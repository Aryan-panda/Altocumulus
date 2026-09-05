import asyncio
import json

class TerminalService:
    def __init__(self, ws_client):
        self.ws_client = ws_client
        self.sessions = {} # workspace_id -> session state
        
    async def handle_input(self, workspace_id: str, data: str):
        pass

class MockTerminalService(TerminalService):
    async def handle_input(self, workspace_id: str, data: str):
        # We simulate a PTY by responding to specific commands
        cmd = data.strip()
        
        # Echo the command back as if it was typed
        await self._send_output(workspace_id, f"{cmd}\r\n")
        
        if cmd == "nvidia-smi":
            output = (
                "NVIDIA GeForce RTX 4090\r\n"
                "Memory: 8124 / 24576 MiB\r\n"
                "GPU Utilization: 92%\r\n"
            )
            await self._send_output(workspace_id, output)
            
        elif cmd == "python train.py":
            await self._send_output(workspace_id, "CUDA available: True\r\nGPU: NVIDIA GeForce RTX 4090\r\n\r\n")
            
            # Simulate training loop
            for i in range(1, 11):
                await asyncio.sleep(0.5)
                bar = "█" * (i * 2)
                await self._send_output(workspace_id, f"Epoch {i}/10 {bar}\r\n")
                
            await self._send_output(workspace_id, "\r\nTraining complete. Model saved to outputs/model.pt\r\n")
            
        elif cmd == "ls /":
            output = "bin  boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var  workspace\r\n"
            await self._send_output(workspace_id, output)
            
        elif cmd != "":
            await self._send_output(workspace_id, f"bash: {cmd}: command not found\r\n")
            
        # Print prompt
        if cmd != "":
            await self._send_output(workspace_id, "\r\nuser@workspace:~$ ")
        
    async def _send_output(self, workspace_id: str, data: str):
        if self.ws_client:
            await self.ws_client.send_json({
                "type": "terminal_output",
                "workspace_id": workspace_id,
                "data": data
            })
