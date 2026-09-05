import asyncio
import os
from .executor import MockWorkspaceExecutor, DockerWorkspaceExecutor
from .terminal import MockTerminalService
from .file import FileService
from .telemetry import MockTelemetryProvider, NVMLTelemetryProvider

class WorkspaceManager:
    def __init__(self, ws_client, demo_mode: bool = True):
        self.ws_client = ws_client
        self.demo_mode = demo_mode
        
        if self.demo_mode:
            self.executor = MockWorkspaceExecutor()
            self.telemetry = MockTelemetryProvider()
        else:
            self.executor = DockerWorkspaceExecutor()
            self.telemetry = NVMLTelemetryProvider()
            
        self.terminal = MockTerminalService(ws_client)
        
        # Determine host filesystem base path
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "host_filesystem", "workspace-data"))
        self.file_service = FileService(base_dir)
        
        self.active_workspaces = set()
        
    async def create_workspace(self, workspace_id: str, profile: str):
        self.file_service.setup_workspace(workspace_id)
        await self.executor.create(workspace_id, profile)
        self.active_workspaces.add(workspace_id)
        
        # Start telemetry loop for this workspace
        asyncio.create_task(self._telemetry_loop(workspace_id))
        
    async def handle_terminal_input(self, workspace_id: str, data: str):
        await self.terminal.handle_input(workspace_id, data)
        
    async def _telemetry_loop(self, workspace_id: str):
        while workspace_id in self.active_workspaces:
            stats = self.telemetry.get_stats()
            if self.ws_client:
                await self.ws_client.send_json({
                    "type": "telemetry",
                    "workspace_id": workspace_id,
                    "stats": stats
                })
            await asyncio.sleep(1)
