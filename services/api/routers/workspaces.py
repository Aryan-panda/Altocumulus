from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import Workspace, Job, User, WorkspaceFile
from schemas import WorkspaceCreate, WorkspaceResponse, WorkspaceFileMeta
import datetime
import os
import shutil

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

# In MVP, we store files on the host in a workspace-data dir
WORKSPACE_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "host_filesystem", "workspace-data")
os.makedirs(WORKSPACE_DATA_DIR, exist_ok=True)

def get_workspace_dir(workspace_id: str):
    path = os.path.join(WORKSPACE_DATA_DIR, workspace_id)
    os.makedirs(path, exist_ok=True)
    return path

# Dummy current_user auth dependency for MVP
def get_current_user(db: Session = Depends(get_db)):
    # Fallback to first user since there's no real auth yet
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No users exist")
    return user

@router.post("/", response_model=WorkspaceResponse)
def create_workspace(req: WorkspaceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    workspace = Workspace(
        user_id=current_user.id,
        job_id=job.id,
        allocation_id=job.allocation.id if job.allocation else None,
        runtime_profile=req.runtime_profile
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    
    # Create the workspace directory
    get_workspace_dir(workspace.id)
    
    return workspace

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    if workspace.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return workspace

@router.get("/{workspace_id}/files", response_model=list[WorkspaceFileMeta])
def list_workspace_files(workspace_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace or workspace.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    files = db.query(WorkspaceFile).filter(WorkspaceFile.workspace_id == workspace_id).all()
    return files

@router.post("/{workspace_id}/files")
async def upload_workspace_file(workspace_id: str, file: UploadFile = File(...), path: str = "", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace or workspace.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Prevent path traversal
    if ".." in path or path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")
        
    ws_dir = get_workspace_dir(workspace_id)
    file_path = os.path.join(ws_dir, path, file.filename)
    
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update DB meta
    file_size = os.path.getsize(file_path)
    meta = db.query(WorkspaceFile).filter(WorkspaceFile.workspace_id == workspace_id, WorkspaceFile.path == os.path.join(path, file.filename)).first()
    if not meta:
        meta = WorkspaceFile(workspace_id=workspace_id, path=os.path.join(path, file.filename), size=file_size)
        db.add(meta)
    else:
        meta.size = file_size
        meta.updated_at = datetime.datetime.utcnow()
        
    db.commit()
    return {"status": "success", "file": file.filename}

@router.post("/{workspace_id}/start")
def start_workspace(workspace_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Orchestrated by backend/host agent
    pass
