from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Host, Job
import datetime
import json
import asyncio

router = APIRouter(tags=["WebSockets"])

# Simple connection manager (In production, use Redis pub/sub for multiple workers)
class ConnectionManager:
    def __init__(self):
        self.host_connections: dict[str, WebSocket] = {}
        self.job_connections: dict[str, list[WebSocket]] = {}

    async def connect_host(self, websocket: WebSocket, host_id: str):
        await websocket.accept()
        self.host_connections[host_id] = websocket

    def disconnect_host(self, host_id: str):
        if host_id in self.host_connections:
            del self.host_connections[host_id]

    async def connect_job(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        if job_id not in self.job_connections:
            self.job_connections[job_id] = []
        self.job_connections[job_id].append(websocket)

    def disconnect_job(self, websocket: WebSocket, job_id: str):
        if job_id in self.job_connections:
            self.job_connections[job_id].remove(websocket)
            
    async def broadcast_job_event(self, job_id: str, message: dict):
        if job_id in self.job_connections:
            for connection in self.job_connections[job_id]:
                await connection.send_text(json.dumps(message))

    # Workspace specific routing
    async def connect_workspace(self, websocket: WebSocket, workspace_id: str):
        await websocket.accept()
        if workspace_id not in self.job_connections:
            self.job_connections[workspace_id] = []
        self.job_connections[workspace_id].append(websocket)
        
    def disconnect_workspace(self, websocket: WebSocket, workspace_id: str):
        if workspace_id in self.job_connections:
            self.job_connections[workspace_id].remove(websocket)

manager = ConnectionManager()

def get_current_user_ws(token: str, db: Session):
    # In production, validate JWT. For MVP fallback to first user.
    from models import User
    user = db.query(User).first()
    return user

@router.websocket("/ws/hosts/{host_id}")
async def websocket_host_endpoint(websocket: WebSocket, host_id: str, token: str):
    db = SessionLocal()
    host = db.query(Host).filter(Host.id == host_id, Host.token == token).first()
    if not host:
        await websocket.close(code=1008)
        db.close()
        return

    await manager.connect_host(websocket, host_id)
    host.last_heartbeat_at = datetime.datetime.utcnow()
    db.commit()

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if payload.get("type") == "heartbeat":
                host.last_heartbeat_at = datetime.datetime.utcnow()
                db.commit()
            
            elif payload.get("type") in ["telemetry", "log", "terminal_output", "job_completed"]:
                # Route from host back to specific job or workspace
                target_id = payload.get("workspace_id") or payload.get("job_id")
                if target_id:
                    await manager.broadcast_job_event(target_id, payload)
                
                if payload.get("type") == "job_completed":
                    job_id = payload.get("job_id")
                    if job_id:
                        job = db.query(Job).filter(Job.id == job_id).first()
                        if job:
                            job.status = "COMPLETED"
                            db.commit()

    except WebSocketDisconnect:
        manager.disconnect_host(host_id)
    finally:
        db.close()

@router.websocket("/ws/workspaces/{workspace_id}")
async def websocket_workspace_endpoint(websocket: WebSocket, workspace_id: str, token: str = "demo"):
    db = SessionLocal()
    from models import Workspace, JobAllocation
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    user = get_current_user_ws(token, db)
    
    if not workspace or workspace.user_id != user.id:
        await websocket.close(code=1008)
        db.close()
        return
        
    allocation = db.query(JobAllocation).filter(JobAllocation.id == workspace.allocation_id).first()
    host_id = allocation.host_id if allocation else None

    await manager.connect_workspace(websocket, workspace_id)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Route terminal input from browser down to the correct Host Agent
            if payload.get("type") == "terminal_input" and host_id:
                if host_id in manager.host_connections:
                    await manager.host_connections[host_id].send_text(json.dumps({
                        "type": "terminal_input",
                        "workspace_id": workspace_id,
                        "data": payload.get("data")
                    }))
    except WebSocketDisconnect:
        manager.disconnect_workspace(websocket, workspace_id)
    finally:
        db.close()

@router.websocket("/ws/jobs/{job_id}")
async def websocket_job_endpoint(websocket: WebSocket, job_id: str):
    await manager.connect_job(websocket, job_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_job(websocket, job_id)
