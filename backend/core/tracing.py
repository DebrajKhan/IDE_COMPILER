import sys
import json
import copy
import io
import builtins
import traceback
import queue
import threading

def run_python_trace(user_code: str, out_queue: queue.Queue, in_queue: queue.Queue):
    """
    Executes Python code in the current thread and pushes execution events to out_queue.
    Uses a DEFERRED SNAPSHOT approach to perfectly sync for-loop variables.
    Supports blocking input() calls by interacting with in_queue.
    """
    source_lines = user_code.splitlines()
    step_counter = [0]
    call_stack = []
    scope_locals = {}
    pending_stack = {}

    def _push_event(event_dict):
        # We push to the out_queue immediately for streaming
        out_queue.put(event_dict)

    # --- Monkey-patch print ---
    _original_print = builtins.print
    def _traced_print(*args, **kwargs):
        scope_name = call_stack[-1] if call_stack else "<module>"
        try:
            _flush_pending(sys._getframe(1), scope_name)
        except Exception:
            pass

        sep = kwargs.get('sep', ' ')
        end = kwargs.get('end', '\n')
        output_text = sep.join(str(a) for a in args) + end

        source_vars = []
        for a in args:
            for s_name in reversed(call_stack + ['<module>']):
                scope_dict = scope_locals.get(s_name, {})
                for vname, vinfo in list(scope_dict.items()):
                    try:
                        if vinfo['value'] is a or str(vinfo['value']) == str(a):
                            source_vars.append(vname)
                            break
                    except Exception:
                        pass

        step_counter[0] += 1
        _push_event({
            "step": step_counter[0],
            "type": "print_output",
            "output_text": output_text,
            "source_vars": source_vars[:3],
            "scope": scope_name,
            "stack": list(call_stack),
        })
        # Note: We don't actually print to the real terminal to avoid noise, 
        # or we could. Let's just suppress it since it goes to the visualizer.

    # --- Monkey-patch input ---
    _original_input = builtins.input
    def _traced_input(prompt=""):
        scope_name = call_stack[-1] if call_stack else "<module>"
        try:
            _flush_pending(sys._getframe(1), scope_name)
        except Exception:
            pass

        if prompt:
            step_counter[0] += 1
            _push_event({
                "step": step_counter[0],
                "type": "print_output",
                "output_text": str(prompt)
            })

        step_counter[0] += 1
        _push_event({
            "step": step_counter[0],
            "type": "input_request",
            "prompt": str(prompt)
        })

        # Block and wait for input from WebSocket
        while True:
            try:
                # Use a timeout to occasionally check if we should shut down (not strictly necessary but good practice)
                user_val = in_queue.get(timeout=1.0)
                if isinstance(user_val, Exception):
                    raise user_val
                return str(user_val)
            except queue.Empty:
                pass
            except EOFError as e:
                raise e
            except Exception as e:
                raise EOFError("Input stream interrupted")

    builtins.print = _traced_print
    builtins.input = _traced_input

    # --- Helper: build variable info dict ---
    def _var_info(name, value, scope_name):
        try:
            size = sys.getsizeof(value)
        except Exception:
            size = 0
        dtype = type(value).__name__
        try:
            addr = hex(id(value))
        except Exception:
            addr = "0x0"
        try:
            json.dumps(value)
            safe_value = value
        except (TypeError, ValueError):
            try:
                safe_value = repr(value)
            except Exception:
                safe_value = f"<unrepresentable {dtype}>"
        return {
            "name": name,
            "value": safe_value,
            "dtype": dtype,
            "size": size,
            "addr": addr,
            "scope": scope_name,
        }

    def _safe_json(val):
        try:
            json.dumps(val)
            return val
        except (TypeError, ValueError):
            try:
                return repr(val)
            except Exception:
                return "<unrepresentable>"

    # --- Deferred flush: emit buffered line + snapshot current locals ---
    def _flush_pending(frame, scope_name):
        if scope_name not in pending_stack or pending_stack[scope_name] is None:
            return
        pend = pending_stack[scope_name]
        pending_stack[scope_name] = None

        step_counter[0] += 1
        _push_event({
            "step": step_counter[0],
            "type": "line",
            "line": pend["line"],
            "code": pend["code"],
            "scope": pend["scope"],
            "stack": pend["stack"],
        })

        curr = {}
        for k, v in frame.f_locals.items():
            if k.startswith('_') or k.startswith('.') or callable(v) or k in ('builtins', '__builtins__'):
                continue
            if k in ('range_iterator', 'list_iterator', 'genexpr'):
                continue
            try:
                dtype = type(v).__name__
                if dtype in ('range_iterator', 'list_iterator', 'genexpr', 'generator'):
                    continue
            except Exception:
                pass
            if hasattr(v, '__code__'):
                continue
            try:
                curr[k] = copy.deepcopy(v)
            except Exception:
                curr[k] = v

        prev = scope_locals.get(scope_name, {})
        for var_name, var_value in curr.items():
            info = _var_info(var_name, var_value, scope_name)
            if var_name not in prev:
                step_counter[0] += 1
                _push_event({"step": step_counter[0], "type": "var_declare", **info})
                prev[var_name] = {"value": var_value}
            else:
                try:
                    changed = prev[var_name]["value"] != var_value
                except Exception:
                    changed = True
                if changed:
                    safe_old = _safe_json(prev[var_name].get("value"))
                    step_counter[0] += 1
                    _push_event({
                        "step": step_counter[0],
                        "type": "var_update",
                        "old_value": safe_old,
                        **info,
                    })
                    prev[var_name] = {"value": var_value}
        scope_locals[scope_name] = prev

    # --- Trace function ---
    def trace_calls(frame, event, arg):
        if frame.f_code.co_filename != '<string>':
            return None

        if event == 'call':
            func_name = frame.f_code.co_name
            if func_name != '<module>' and func_name.startswith('<') and func_name.endswith('>'):
                return None
                
            if func_name == '<module>':
                scope_locals['<module>'] = {}
                return trace_calls

            call_stack.append(func_name)
            scope_locals[func_name] = {}

            arg_names = frame.f_code.co_varnames[:frame.f_code.co_argcount]
            args_dict = {}
            for aname in arg_names:
                if aname in frame.f_locals:
                    info = _var_info(aname, frame.f_locals[aname], func_name)
                    args_dict[aname] = info
                    scope_locals[func_name][aname] = {"value": frame.f_locals[aname]}

            step_counter[0] += 1
            line_no = frame.f_lineno
            _push_event({
                "step": step_counter[0],
                "type": "func_call",
                "name": func_name,
                "line": line_no,
                "code": source_lines[line_no - 1] if line_no <= len(source_lines) else "",
                "args": args_dict,
                "scope": call_stack[-2] if len(call_stack) >= 2 else "<module>",
                "stack": list(call_stack),
            })
            return trace_calls

        elif event == 'return':
            func_name = frame.f_code.co_name
            if func_name == '<module>':
                _flush_pending(frame, '<module>')
                return trace_calls

            _flush_pending(frame, func_name)
            safe_ret = _safe_json(arg)

            step_counter[0] += 1
            line_no = frame.f_lineno
            _push_event({
                "step": step_counter[0],
                "type": "func_return",
                "name": func_name,
                "line": line_no,
                "code": source_lines[line_no - 1] if line_no <= len(source_lines) else "",
                "return_value": safe_ret,
                "scope": func_name,
                "stack": list(call_stack),
            })

            if call_stack and call_stack[-1] == func_name:
                call_stack.pop()
            if func_name in scope_locals:
                del scope_locals[func_name]

            return trace_calls

        elif event == 'line':
            scope_name = call_stack[-1] if call_stack else '<module>'
            _flush_pending(frame, scope_name)
            line_no = frame.f_lineno
            pending_stack[scope_name] = {
                "line": line_no,
                "code": source_lines[line_no - 1] if line_no <= len(source_lines) else "",
                "scope": scope_name,
                "stack": list(call_stack),
            }
            return trace_calls
        return trace_calls

    # --- Execute ---
    error_msg = None
    try:
        sys.settrace(trace_calls)
        exec(compile(user_code, '<string>', 'exec'), {"__builtins__": builtins})
    except (EOFError, BrokenPipeError) as e:
        error_msg = "Execution interrupted: " + str(e)
        step_counter[0] += 1
        _push_event({
            "step": step_counter[0],
            "type": "error",
            "line": None,
            "error_type": type(e).__name__,
            "message": str(e),
            "traceback": error_msg
        })
    except Exception as e:
        tb = e.__traceback__
        error_line = None
        while tb:
            if tb.tb_frame.f_code.co_filename == '<string>':
                error_line = tb.tb_lineno
            tb = tb.tb_next
        error_msg = traceback.format_exc()
        step_counter[0] += 1
        _push_event({
            "step": step_counter[0],
            "type": "error",
            "line": error_line,
            "error_type": type(e).__name__,
            "message": str(e),
            "traceback": error_msg
        })
    finally:
        sys.settrace(None)
        builtins.print = _original_print
        builtins.input = _original_input
        # Signal completion
        out_queue.put({"type": "execution_complete", "has_error": bool(error_msg), "output": error_msg or ""})

# Keep C_GDB_SCRIPT for C/C++ Docker execution
C_GDB_SCRIPT = """set pagination off
set confirm off
set print pretty on
break main
run > /app/stdout.txt

python
import sys
sys.path.insert(0, '/usr/share/gcc-15.2.0/python')
try:
    from libstdcxx.v6.printers import register_libstdcxx_printers
    register_libstdcxx_printers(None)
except Exception as e:
    pass

import gdb
import json

events = []
step_counter = 1
prev_locals_cache = {}

def parse_gdb_value(val):
    try:
        size = val.type.sizeof
    except:
        size = 0

    try:
        type_code = val.type.strip_typedefs().code
    except Exception:
        type_code = gdb.TYPE_CODE_INT

    try:
        visualizer = gdb.default_visualizer(val)
        if visualizer:
            type_name = str(val.type)
            if hasattr(visualizer, 'children'):
                children = list(visualizer.children())
                if "vector" in type_name or "deque" in type_name or "list" in type_name or "stack" in type_name or "queue" in type_name or "array" in type_name:
                    arr = []
                    for name, child_val in children:
                        arr.append(parse_gdb_value(child_val)["value"])
                    return {"type": "array", "value": arr, "size": size}
                elif "map" in type_name or "set" in type_name:
                    arr = []
                    for name, child_val in children:
                        arr.append(parse_gdb_value(child_val)["value"])
                    return {"type": "object", "value": arr, "size": size}

            if hasattr(visualizer, 'to_string'):
                s = visualizer.to_string()
                if hasattr(s, 'value'):
                    s = s.value()
                if isinstance(s, gdb.Value):
                    try:
                        s = s.string()
                    except:
                        s = str(s)
                return {"type": "primitive", "value": str(s), "size": size}
    except Exception:
        pass

    if type_code == gdb.TYPE_CODE_PTR:
        try:
            target = val.dereference()
            return {"type": "pointer", "value": str(val), "deref": str(target), "size": size}
        except:
            return {"type": "pointer", "value": str(val), "size": size}
    elif type_code == gdb.TYPE_CODE_ARRAY:
        try:
            target_type = val.type.target().strip_typedefs().code
            if target_type == gdb.TYPE_CODE_INT and val.type.target().sizeof == 1:
                return {"type": "primitive", "value": val.string(), "size": size}
        except:
            pass
        try:
            arr = []
            low, high = val.type.range()
            for i in range(low, high + 1):
                arr.append(parse_gdb_value(val[i])["value"])
            return {"type": "array", "value": arr, "size": size}
        except:
            return {"type": "array", "value": str(val), "size": size}
    elif type_code == gdb.TYPE_CODE_STRUCT or type_code == gdb.TYPE_CODE_UNION:
        fields = {}
        try:
            for field in val.type.fields():
                if hasattr(field, 'bitpos') and field.name and not field.name.startswith('_'):
                    fields[field.name] = parse_gdb_value(val[field])
        except:
            pass
        return {"type": "object", "value": fields, "size": size}
    else:
        try:
            v = val.string() if type_code == gdb.TYPE_CODE_STRING else str(val)
            try:
                if '.' in v:
                    v = float(v)
                else:
                    v = int(v.split(' ')[0])
            except:
                pass
            return {"type": "primitive", "value": v, "size": size}
        except:
            return {"type": "primitive", "value": str(val), "size": size}

while True:
    try:
        frame = gdb.selected_frame()
        if not frame or frame.name() is None:
            break

        block = frame.block()
        locals_dict = {}
        for symbol in block:
            if symbol.is_argument or symbol.is_variable:
                if symbol.name.startswith('_'):
                    continue
                try:
                    val = frame.read_var(symbol)
                    parsed = parse_gdb_value(val)
                    locals_dict[symbol.name] = {
                        "value": parsed["value"],
                        "dtype": parsed["type"],
                        "size": parsed["size"],
                        "addr": str(val.address) if val.address else "0x0"
                    }
                except Exception as e:
                    pass

        for var_name, info in locals_dict.items():
            if var_name not in prev_locals_cache:
                events.append({
                    "step": step_counter,
                    "type": "var_declare",
                    "name": var_name,
                    "value": info["value"],
                    "dtype": info["dtype"],
                    "size": info["size"],
                    "addr": info["addr"],
                    "scope": frame.name() or "<module>"
                })
                step_counter += 1
            else:
                old_info = prev_locals_cache[var_name]
                if old_info["value"] != info["value"]:
                    events.append({
                        "step": step_counter,
                        "type": "var_update",
                        "name": var_name,
                        "value": info["value"],
                        "old_value": old_info["value"],
                        "dtype": info["dtype"],
                        "size": info["size"],
                        "addr": info["addr"],
                        "scope": frame.name() or "<module>"
                    })
                    step_counter += 1

        prev_locals_cache = locals_dict
        gdb.execute('next')
    except Exception as e:
        break

print("---GDB_JSON_START---")
print(json.dumps(events))
print("---GDB_JSON_END---")
end
"""
