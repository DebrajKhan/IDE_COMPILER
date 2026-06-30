from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import threading
import queue
import asyncio

from services.execution_engine import execute_code
from core.tracing import run_python_trace
from core.llm_tutor import get_tutor_response

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def handle_websocket_read(websocket: WebSocket, in_queue: queue.Queue):
    """Continuously read from the websocket to catch input_responses."""
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            if payload.get("type") == "input_response":
                in_queue.put(payload.get("value", ""))
    except WebSocketDisconnect:
        # Pushing EOF to prevent python execution from hanging forever on disconnect
        in_queue.put(EOFError("Client disconnected"))
    except Exception as e:
        in_queue.put(EOFError("Error reading websocket: " + str(e)))

@app.websocket("/ws/execute")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        data = await websocket.receive_text()
        payload = json.loads(data)
        code = payload.get("code", "")
        language = payload.get("language", "python")

        if language == "python":
            # --- Python Streaming Execution (Local Thread) ---
            out_queue = queue.Queue()
            in_queue = queue.Queue()

            # Start reading task for input() injection
            read_task = asyncio.create_task(handle_websocket_read(websocket, in_queue))
            
            # Start execution thread
            thread = threading.Thread(target=run_python_trace, args=(code, out_queue, in_queue))
            thread.start()
            
            # Continuously poll the out_queue for new events and stream them
            while True:
                try:
                    # Non-blocking get with asyncio sleep to yield control
                    msg = await asyncio.to_thread(out_queue.get, timeout=0.05)
                    
                    if msg.get("type") == "execution_complete":
                        # Finalize
                        has_error = msg.get("has_error")
                        error_out = msg.get("output")
                        tutor_res = get_tutor_response(code, language, error_out if has_error else None)
                        
                        await websocket.send_json({
                            "type": "tutor_message",
                            "message": tutor_res["message"],
                            "emotion": tutor_res["emotion"]
                        })
                        
                        await websocket.send_json({
                            "type": "execution_complete",
                            "output": error_out if has_error else "",
                            "has_error": has_error
                        })
                        break
                    
                    # Normal event (exec_event)
                    await websocket.send_json({
                        "type": "exec_event",
                        "event": msg
                    })

                except queue.Empty:
                    # Just yield control if queue is empty
                    await asyncio.sleep(0.01)
                except Exception as e:
                    break

            # Cleanup
            read_task.cancel()

        else:
            # --- C/C++ Batch Execution (Docker) ---
            exec_result = execute_code(code, language)
            
            events = exec_result.get("events", [])
            for event in events:
                await websocket.send_json({
                    "type": "exec_event",
                    "event": event
                })
            
            traces = exec_result.get("traces", [])
            for trace in traces:
                await websocket.send_json({
                    "type": "array_update",
                    "trace_data": trace
                })
                
            if exec_result["error"]:
                tutor_res = get_tutor_response(code, language, exec_result["error"])
                await websocket.send_json({
                    "type": "tutor_message",
                    "message": tutor_res["message"],
                    "emotion": tutor_res["emotion"]
                })
                await websocket.send_json({
                    "type": "execution_complete",
                    "output": exec_result["error"],
                    "has_error": True
                })
            else:
                tutor_res = get_tutor_response(code, language)
                await websocket.send_json({
                    "type": "tutor_message",
                    "message": tutor_res["message"],
                    "emotion": tutor_res["emotion"]
                })
                await websocket.send_json({
                    "type": "execution_complete",
                    "output": exec_result["output"],
                    "has_error": False
                })

    except WebSocketDisconnect:
        print("Client disconnected from WebSocket.")