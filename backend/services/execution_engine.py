import os
import docker
import uuid
import tempfile
import json
import re
from core.tracing import C_GDB_SCRIPT

# Connect to local Docker engine
client = docker.from_env()


# ==========================================
# C++ Event Sanitizer — The Blacklist
# ==========================================
def _sanitize_value(val):
    """
    Recursively sanitize a value from the GDB JSON payload.
    - Dicts: remove any key starting with '_', recurse into remaining values.
    - Lists: recurse into each element.
    - Primitives: return as-is.
    """
    if isinstance(val, dict):
        cleaned = {}
        for k, v in val.items():
            if isinstance(k, str) and k.startswith('_'):
                continue
            cleaned[k] = _sanitize_value(v)
        return cleaned
    elif isinstance(val, list):
        return [_sanitize_value(item) for item in val]
    else:
        return val


def _flatten_stl_value(event):
    """
    If the event's value is a nested dict that represents an STL container
    (std::vector, std::string, etc.), flatten it to a plain list or string.
    After _sanitize_value has stripped underscore keys, STL containers often
    leave behind empty dicts or single-key wrapper dicts. This collapses them.
    """
    val = event.get("value")
    dtype = event.get("dtype", "")

    # Already a clean array or primitive — nothing to do
    if isinstance(val, list) or isinstance(val, (int, float, bool)) or val is None:
        return event

    # If it's a string, strip surrounding quotes from GDB pretty-printer
    if isinstance(val, str):
        stripped = val.strip()
        if stripped.startswith('"') and stripped.endswith('"'):
            event["value"] = stripped[1:-1]
        return event

    # Dict value — try to flatten
    if isinstance(val, dict):
        # Check if all values are empty dicts (fully stripped STL internals)
        all_empty = all(
            (isinstance(v, dict) and not v) for v in val.values()
        ) if val else True

        if all_empty:
            # The container was fully internal; value is meaningless after stripping
            event["value"] = []
            if dtype == "object":
                event["dtype"] = "array"
            return event

        # Check if there's a single key whose value is itself a stripped container
        if len(val) == 1:
            only_key = list(val.keys())[0]
            inner = val[only_key]
            if isinstance(inner, dict):
                # Check if inner has a "value" key (parsed struct format)
                if "value" in inner:
                    event["value"] = inner["value"]
                    if "type" in inner:
                        event["dtype"] = inner["type"]
                    return event
                elif not inner:
                    event["value"] = []
                    event["dtype"] = "array"
                    return event

    return event


def sanitize_cpp_events(events):
    """
    Full sanitization pipeline for C++ GDB events before they reach the frontend.
    1. Strip all underscore-prefixed keys recursively from every event.
    2. Flatten STL wrappers to plain values.
    3. Drop events for variables whose names start with underscores.
    """
    sanitized = []
    for event in events:
        # Skip variables with underscore names (compiler-generated)
        name = event.get("name", "")
        if isinstance(name, str) and name.startswith("_"):
            continue

        # Recursively strip underscore keys from the entire event dict
        event = _sanitize_value(event)

        # Flatten STL container values
        event = _flatten_stl_value(event)

        # Also sanitize old_value if present
        if "old_value" in event:
            old = event["old_value"]
            if isinstance(old, dict):
                old = _sanitize_value(old)
                # Try to flatten old_value too
                temp = {"value": old, "dtype": event.get("dtype", "")}
                temp = _flatten_stl_value(temp)
                event["old_value"] = temp["value"]
            elif isinstance(old, str):
                stripped = old.strip()
                if stripped.startswith('"') and stripped.endswith('"'):
                    event["old_value"] = stripped[1:-1]

        sanitized.append(event)
    return sanitized


def sanitize_python_events(events):
    sanitized = []
    for event in events:
        name = event.get("name", "")
        if isinstance(name, str):
            if name.startswith("_") or name.startswith("."):
                continue
            if name in ("range_iterator", "list_iterator", "genexpr"):
                continue
        
        dtype = event.get("dtype", "")
        if dtype in ("range_iterator", "list_iterator", "genexpr", "generator"):
            continue

        sanitized.append(event)
    return sanitized

def execute_code(code: str, language: str = "python") -> dict:
    """
    Securely executes code in an ephemeral Docker container and returns
    both program output and animation traces.
    """
    file_id = str(uuid.uuid4())
    temp_dir = tempfile.gettempdir()

    # 1. Prepare Paths
    suffix = ".py" if language == "python" else (".cpp" if language in ["cpp", "c++"] else ".c")
    host_source_path = os.path.join(temp_dir, f"source_{file_id}{suffix}")
    host_tracer_path = os.path.join(temp_dir, f"tracer_{file_id}.py" if language == "python" else f"gdb_{file_id}.txt")

    # 2. Write source and tracer/config files
    with open(host_source_path, 'w', encoding='utf-8') as f:
        f.write(code)

    with open(host_tracer_path, 'w', encoding='utf-8') as f:
        f.write(C_GDB_SCRIPT)

    container_source = f"/app/source_{file_id}{suffix}"
    container_tracer = f"/app/tracer_{file_id}.py" if language == "python" else f"/app/gdb_{file_id}.txt"
    image = "python-runner:latest" if language == "python" else "c-runner:latest"

    volumes = {
        host_source_path: {'bind': container_source, 'mode': 'ro'},
        host_tracer_path: {'bind': container_tracer, 'mode': 'ro'}
    }

    # 3. Define Execution Strategy
    if language == "python":
        command = f"python3 {container_tracer} {container_source}"
    else:
        exe_path = f"/app/exec_{file_id}"
        compiler = "g++" if language in ["cpp", "c++"] else "gcc"
        command = (
            f"{compiler} -g {container_source} -o {exe_path} && "
            f"gdb -batch -x {container_tracer} {exe_path} > /app/gdb_logs.txt 2>&1 ; "
            f"cat /app/stdout.txt && echo '---GDB_SPLIT---' && cat /app/gdb_logs.txt"
        )

    container = None
    try:
        container = client.containers.run(
            image=image,
            command=f"sh -c '{command}'",
            volumes=volumes,
            working_dir="/app",
            mem_limit="128m",
            network_mode="none",
            detach=True
        )

        # Security timeout
        container.wait(timeout=5)

        # 4. Extract and Parse Results
        logs = container.logs(stdout=True, stderr=True).decode('utf-8')

        if language == "python":
            try:
                events = json.loads(logs)
                # === SANITIZE Python events before returning ===
                if isinstance(events, dict) and "events" in events:
                    events["events"] = sanitize_python_events(events["events"])
                return events
            except json.JSONDecodeError:
                return {"output": "", "error": logs, "events": []}
        else:
            prog_output = ""
            if "---GDB_SPLIT---" in logs:
                parts = logs.split("---GDB_SPLIT---")
                prog_output = parts[0].strip()
            else:
                prog_output = logs.strip()

            events = []
            if "---GDB_JSON_START---" in logs and "---GDB_JSON_END---" in logs:
                try:
                    json_str = logs.split("---GDB_JSON_START---")[1].split("---GDB_JSON_END---")[0]
                    events = json.loads(json_str)
                except Exception:
                    pass

            # === SANITIZE C++ events before returning ===
            events = sanitize_cpp_events(events)

            # Detect compile/run errors
            if "error:" in prog_output.lower() or "collect2:" in prog_output:
                return {"output": "", "error": prog_output, "events": []}
            return {"output": prog_output, "error": None, "events": events}

    except Exception as e:
        if container:
            try:
                container.kill()
            except:
                pass
        return {"output": "", "error": "Execution timed out or failed.", "events": []}
    finally:
        # Cleanup containers and temp files
        if container:
            try:
                container.remove(force=True)
            except:
                pass
        if os.path.exists(host_source_path):
            os.remove(host_source_path)
        if os.path.exists(host_tracer_path):
            os.remove(host_tracer_path)
