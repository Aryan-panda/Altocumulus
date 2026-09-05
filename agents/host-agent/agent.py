import asyncio
import os
import json
import httpx
import websockets
from services.manager import WorkspaceManager

API_URL = os.environ.get("API_URL", "http://localhost:8000")
WS_URL = os.environ.get("WS_URL", "ws://localhost:8000")
DEMO_MODE = os.environ.get("DEMO_MODE", "true").lower() == "true"

class HostAgent:
    def __init__(self):
        self.provider_id = None
        self.host_id = None
        self.host_token = None
        self.workspace_manager = None
            
    async def register(self):
        print(f"Connecting to API to find a provider...")
        self.host_id = os.environ.get("HOST_ID", "demo-host-a")
        self.host_token = os.environ.get("HOST_TOKEN", "demo-token-123")
        
        if not self.host_id or not self.host_token:
            print("ERROR: HOST_ID and HOST_TOKEN must be provided.")
            exit(1)
            
        print(f"Registered as Host: {self.host_id}")

    async def heartbeat(self, ws):
        while True:
            try:
                await ws.send(json.dumps({"type": "heartbeat"}))
                await asyncio.sleep(5)
            except Exception as e:
                print(f"Heartbeat failed: {e}")
                break

    async def run(self):
        ws_endpoint = f"{WS_URL}/ws/hosts/{self.host_id}?token={self.host_token}"
        print(f"Connecting to {ws_endpoint}")
        
        async with websockets.connect(ws_endpoint) as ws:
            print("Connected to control plane.")
            
            class WsWrapper:
                async def send_json(self, data):
                    await ws.send(json.dumps(data))
            
            wrapped_ws = WsWrapper()
            self.workspace_manager = WorkspaceManager(wrapped_ws, DEMO_MODE)
            
            asyncio.create_task(self.heartbeat(ws))
            
            while True:
                message = await ws.recv()
                data = json.loads(message)
                
                # Create workspace
                if data.get("type") == "job_assignment":
                    # For backward compatibility with the mock job assignment
                    job_id = data.get("job_id")
                    workspace_id = data.get("workspace_id", f"ws_{job_id}") 
                    print(f"Received assignment. Creating workspace: {workspace_id}")
                    asyncio.create_task(
                        self.workspace_manager.create_workspace(workspace_id, "pytorch-mnist-demo")
                    )
                    
                # Terminal IO
                elif data.get("type") == "terminal_input":
                    workspace_id = data.get("workspace_id")
                    term_data = data.get("data")
                    if workspace_id and term_data:
                        asyncio.create_task(
                            self.workspace_manager.handle_terminal_input(workspace_id, term_data)
                        )

if __name__ == "__main__":
    agent = HostAgent()
    asyncio.run(agent.register())
    asyncio.run(agent.run())
