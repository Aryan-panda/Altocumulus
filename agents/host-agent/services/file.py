import os

class FileService:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)
        
    def get_workspace_dir(self, workspace_id: str) -> str:
        path = os.path.join(self.base_dir, workspace_id)
        os.makedirs(path, exist_ok=True)
        return path
        
    def setup_workspace(self, workspace_id: str):
        path = self.get_workspace_dir(workspace_id)
        os.makedirs(os.path.join(path, "datasets"), exist_ok=True)
        os.makedirs(os.path.join(path, "outputs"), exist_ok=True)
        
        # Seed with demo train.py
        with open(os.path.join(path, "train.py"), "w") as f:
            f.write("import torch\n\nprint('CUDA available:', torch.cuda.is_available())\nprint('GPU:', torch.cuda.get_device_name(0))\n")
