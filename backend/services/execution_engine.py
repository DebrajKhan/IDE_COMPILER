import os
import uuid
import tempfile
import json
import re
import subprocess
from core.tracing import C_GDB_SCRIPT


def sanitize_cpp_events(events, prog_output=""):
    """
    Parses the structured snapshots from GDB and converts them into 
    var_declare and var_update events for the frontend.
    """
    sanitized = []
    prev_vars = {}
    
    for event in events:
        if event.get("type") == "snapshot":
            variables = event.get("variables", {})
            step_counter = event.get("step")
            scope = event.get("scope", "<module>")
            
            for var_name, info in variables.items():
                if var_name not in prev_vars:
                    sanitized.append({
                        "step": step_counter,
                        "type": "var_declare",
                        "name": var_name,
                        "value": info["value"],
                        "dtype": info["dtype"],
                        "size": info["size"],
                        "addr": info["addr"],
                        "scope": scope
                    })
                else:
                    old_info = prev_vars[var_name]
                    if old_info["value"] != info["value"]:
                        sanitized.append({
                            "step": step_counter,
                            "type": "var_update",
                            "name": var_name,
                            "value": info["value"],
                            "old_value": old_info["value"],
                            "dtype": info["dtype"],
                            "size": info["size"],
                            "addr": info["addr"],
                            "scope": scope
                        })
            
            prev_vars = variables
        else:
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
        exe_path = f"/tmp/exec_{file_id}"
        compiler = "g++" if language in ["cpp", "c++"] else "gcc"
        command = (
            f"{compiler} -g {container_source} -o {exe_path} > /tmp/compile_logs.txt 2>&1 ; "
            f"if [ $? -eq 0 ]; then "
            f"  gdb -batch -x {container_tracer} {exe_path} > /tmp/gdb_logs.txt 2>&1 ; "
            f"  cat /tmp/stdout.txt && echo '---GDB_SPLIT---' && cat /tmp/gdb_logs.txt ; "
            f"else "
            f"  echo '---COMPILE_ERROR---' && cat /tmp/compile_logs.txt ; "
            f"fi"
        )

    try:
        cmd = [
            "docker", "run", "--rm",
            "--network", "none",
            "-v", f"{host_source_path}:{container_source}:ro",
            "-v", f"{host_tracer_path}:{container_tracer}:ro",
            "--workdir", "/app",
            "--memory", "256m",
            image,
            "sh", "-c", command
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        logs = result.stdout + result.stderr

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
            if "---COMPILE_ERROR---" in logs:
                parts = logs.split("---COMPILE_ERROR---")
                return {"type": "compile_error", "message": parts[1].strip()}

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
            events = sanitize_cpp_events(events, prog_output)

            return {"output": prog_output, "error": None, "events": events}

    except subprocess.TimeoutExpired:
        return {"output": "", "error": "Execution timed out.", "events": []}
    except Exception as e:
        return {"output": "", "error": "Execution failed: " + str(e), "events": []}
    finally:
        # Cleanup temp files
        if os.path.exists(host_source_path):
            os.remove(host_source_path)
        if os.path.exists(host_tracer_path):
            os.remove(host_tracer_path)
