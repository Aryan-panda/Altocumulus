from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import GPU, Host

router = APIRouter(prefix="/gpus", tags=["GPUs"])

@router.get("/")
def get_gpus(db: Session = Depends(get_db)):
    # In a real app we'd serialize with Pydantic, but simple dict is fine for MVP prototype initially
    gpus = db.query(GPU).all()
    result = []
    for g in gpus:
        host = db.query(Host).filter(Host.id == g.host_id).first()
        result.append({
            "id": g.id,
            "host_id": g.host_id,
            "model": g.model,
            "vram_gb": g.vram_gb,
            "price_per_hour": g.price_per_hour,
            "status": g.status,
            "reliability": g.reliability,
            "host_status": "ONLINE" if host and host.last_heartbeat_at else "UNKNOWN" # Simplified
        })
    return result

@router.get("/{gpu_id}")
def get_gpu(gpu_id: str, db: Session = Depends(get_db)):
    gpu = db.query(GPU).filter(GPU.id == gpu_id).first()
    if not gpu:
        raise HTTPException(status_code=404, detail="GPU not found")
    return {
        "id": gpu.id,
        "model": gpu.model,
        "vram_gb": gpu.vram_gb,
        "price_per_hour": gpu.price_per_hour,
        "status": gpu.status,
        "reliability": gpu.reliability
    }
