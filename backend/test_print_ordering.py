import sys
import json
import copy
import io
import traceback
import builtins

source_file = "dummy.py"
user_code = """
arr = [10, 20]
for val in arr:
    print(val)
"""

source_lines = user_code.strip().splitlines()
events = []
step_counter = [0]
call_stack = []
scope_locals = {}
pending_stack = {}  # scope_name -> pending line info or None

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

def _flush_pending(frame, scope_name):
    if scope_name not in pending_stack or pending_stack[scope_name] is None:
        return
    pend = pending_stack[scope_name]
    pending_stack[scope_name] = None

    step_counter[0] += 1
    events.append({
        "step": step_counter[0],
        "type": "line",
        "line": pend["line"],
        "code": pend["code"],
        "scope": pend["scope"],
        "stack": pend["stack"],
    })

    curr = {}
    for k, v in frame.f_locals.items():
        if k.startswith('__') or callable(v) or k in ('builtins', '__builtins__'):
            continue
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
            events.append({"step": step_counter[0], "type": "var_declare", **info})
            prev[var_name] = {"value": var_value}
        else:
            try:
                changed = prev[var_name]["value"] != var_value
            except Exception:
                changed = True
            if changed:
                safe_old = _safe_json(prev[var_name].get("value"))
                step_counter[0] += 1
                events.append({
                    "step": step_counter[0],
                    "type": "var_update",
                    "old_value": safe_old,
                    **info,
                })
                prev[var_name] = {"value": var_value}

    scope_locals[scope_name] = prev

_original_print = builtins.print

def _traced_print(*args, **kwargs):
    scope_name = call_stack[-1] if call_stack else "<module>"
    # Flush pending line BEFORE print event, using the caller's frame
    try:
        _flush_pending(sys._getframe(1), scope_name)
    except Exception:
        pass

    sep = kwargs.get('sep', ' ')
    end = kwargs.get('end', '\\n')
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
    events.append({
        "step": step_counter[0],
        "type": "print_output",
        "output_text": output_text,
        "source_vars": source_vars[:3],
        "scope": scope_name,
        "stack": list(call_stack),
    })
    _original_print(*args, **kwargs)

builtins.print = _traced_print

def trace_calls(frame, event, arg):
    if frame.f_code.co_filename != '<string>':
        return None

    if event == 'call':
        func_name = frame.f_code.co_name
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
        events.append({
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
        events.append({
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

old_stdout = sys.stdout
redirected_output = io.StringIO()
sys.stdout = redirected_output

try:
    sys.settrace(trace_calls)
    exec(compile(user_code, '<string>', 'exec'), {"__builtins__": builtins})
except Exception as e:
    pass
finally:
    sys.settrace(None)
    sys.stdout = old_stdout
    builtins.print = _original_print

for ev in events:
    t = ev.get("type")
    if t == "line":
        print(f"  Step {ev['step']:2d}: LINE {ev['line']}  ->  {ev['code']}")
    elif t == "var_declare":
        print(f"  Step {ev['step']:2d}: DECLARE  {ev['name']} = {ev['value']}  (dtype={ev['dtype']})")
    elif t == "var_update":
        print(f"  Step {ev['step']:2d}: UPDATE   {ev['name']}: {ev['old_value']} -> {ev['value']}")
    elif t == "print_output":
        print(f"  Step {ev['step']:2d}: PRINT    '{ev['output_text'].strip()}'")
    else:
        print(f"  Step {ev.get('step','?'):>2}: {t}  {ev}")
