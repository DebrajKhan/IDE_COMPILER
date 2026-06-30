import sys
sys.path.append('.')
from services.execution_engine import execute_code
import json

# Test: for-loop synchronization
code = """
arr = [10, 20, 30]
for val in arr:
    print(val)
"""

res = execute_code(code, "python")

print("=== FOR-LOOP SYNC TEST ===")
print(f"Output: {res.get('output', '').strip()}")
print(f"Error: {res.get('error')}")
print()

events = res.get("events", [])
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

print()
print("=== KEY CHECK ===")
# Find when val is declared — it should be at the for-statement line
for ev in events:
    if ev.get("type") == "var_declare" and ev.get("name") == "val":
        # Find the most recent line event before this
        prev_line = None
        for prev_ev in events:
            if prev_ev["step"] >= ev["step"]:
                break
            if prev_ev["type"] == "line":
                prev_line = prev_ev
        if prev_line:
            print(f"val declared at step {ev['step']} (val={ev['value']})")
            print(f"  Active line was: L{prev_line['line']} '{prev_line.get('code','')}'")
            if "for" in prev_line.get("code", ""):
                print("  ✅ val declared AT the for-statement line (synchronized!)")
            else:
                print("  ❌ val declared at wrong line (desynchronized)")
        break
