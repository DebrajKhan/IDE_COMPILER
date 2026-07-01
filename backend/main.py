from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import threading
import queue
import asyncio

class YjsRoomManager:
    def __init__(self):
        self.rooms = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms and len(self.rooms[room_id]) >= 5:
            await websocket.close(code=1008)
            return False
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append(websocket)
        return True

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].remove(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def broadcast(self, message: bytes, room_id: str, sender: WebSocket):
        for connection in self.rooms.get(room_id, []):
            if connection != sender:
                await connection.send_bytes(message)

yjs_manager = YjsRoomManager()

class SignalingManager:
    def __init__(self):
        self.rooms = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].remove(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def broadcast(self, message: str, room_id: str, sender: WebSocket):
        for connection in self.rooms.get(room_id, []):
            if connection != sender:
                await connection.send_text(message)

signaling_manager = SignalingManager()

from services.execution_engine import execute_code
from core.tracing import run_python_trace
from core.llm_tutor import get_tutor_response
import secrets
import string

app = FastAPI()

SESSIONS = {}

@app.post("/api/session/create")
async def create_session():
    session_id = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    SESSIONS[session_id] = {
        "read_only": False,
        "participants": 0
    }
    return {"session_id": session_id}

@app.get("/api/session/validate/{session_id}")
async def validate_session(session_id: str):
    if session_id in SESSIONS:
        return {"valid": True, "read_only": SESSIONS[session_id]["read_only"]}
    return {"valid": False}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/yjs/{room}")
async def yjs_websocket_endpoint(websocket: WebSocket, room: str):
    connected = await yjs_manager.connect(websocket, room)
    if not connected:
        return
    try:
        while True:
            data = await websocket.receive_bytes()
            await yjs_manager.broadcast(data, room, websocket)
    except WebSocketDisconnect:
        yjs_manager.disconnect(websocket, room)

@app.websocket("/ws/signaling/{room_id}")
async def signaling_endpoint(websocket: WebSocket, room_id: str):
    await signaling_manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            await signaling_manager.broadcast(data, room_id, websocket)
    except WebSocketDisconnect:
        signaling_manager.disconnect(websocket, room_id)

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

@app.websocket("/ws/execute/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()

    async def send_and_broadcast(msg_dict):
        # Send to the user who triggered the run
        try: await websocket.send_json(msg_dict)
        except: pass
        # Broadcast to all others in the room via signaling
        if session_id and session_id != "local":
            await signaling_manager.broadcast(json.dumps(msg_dict), session_id, websocket)
    
    try:
        while True:
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
                            tutor_res = await asyncio.to_thread(get_tutor_response, code, language, error_out if has_error else None)
                            
                            await send_and_broadcast({
                                "type": "tutor_message",
                                "message": tutor_res["message"],
                                "emotion": tutor_res["emotion"]
                            })
                            
                            await send_and_broadcast({
                                "type": "execution_complete",
                                "output": error_out if has_error else "",
                                "has_error": has_error
                            })
                            break
                        
                        # Normal event (exec_event)
                        await send_and_broadcast({
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
                try:
                    await read_task
                except asyncio.CancelledError:
                    pass

            else:
                # --- C/C++ Batch Execution (Docker) ---
                exec_result = await asyncio.to_thread(execute_code, code, language)
                
                if exec_result.get("type") == "compile_error":
                    tutor_res = await asyncio.to_thread(get_tutor_response, code, language, exec_result["message"])
                    await send_and_broadcast({
                        "type": "tutor_message",
                        "message": tutor_res["message"],
                        "emotion": tutor_res["emotion"]
                    })
                    await send_and_broadcast({
                        "type": "execution_complete",
                        "output": exec_result["message"],
                        "has_error": True
                    })
                    continue
                
                events = exec_result.get("events", [])
                for event in events:
                    await send_and_broadcast({
                        "type": "exec_event",
                        "event": event
                    })
                
                traces = exec_result.get("traces", [])
                for trace in traces:
                    await send_and_broadcast({
                        "type": "array_update",
                        "trace_data": trace
                    })
                    
                if exec_result["error"]:
                    tutor_res = await asyncio.to_thread(get_tutor_response, code, language, exec_result["error"])
                    await send_and_broadcast({
                        "type": "tutor_message",
                        "message": tutor_res["message"],
                        "emotion": tutor_res["emotion"]
                    })
                    await send_and_broadcast({
                        "type": "execution_complete",
                        "output": exec_result["error"],
                        "has_error": True
                    })
                else:
                    tutor_res = await asyncio.to_thread(get_tutor_response, code, language)
                    await send_and_broadcast({
                        "type": "tutor_message",
                        "message": tutor_res["message"],
                        "emotion": tutor_res["emotion"]
                    })
                    await send_and_broadcast({
                        "type": "execution_complete",
                        "output": exec_result["output"],
                        "has_error": False
                    })

    except WebSocketDisconnect:
        print("Client disconnected from WebSocket.")