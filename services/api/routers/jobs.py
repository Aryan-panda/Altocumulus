from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from models import Job, GPU, JobAllocation, User
from schemas import JobCreateRequest, JobCreateResponse, WorkloadRequirements
from scheduler import get_recommendations
import datetime

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobCreateResponse)
def create_job(req: JobCreateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        # Fallback to the first seeded user for the demo
        user = db.query(User).first()
        if not user:
            raise HTTPException(status_code=404, detail="No users found in database")
        req.user_id = user.id
        
    recommendations = get_recommendations(db, req.requirements)
    
    # Even if no recommendations, we create the job in QUEUED state
    new_job = Job(
        user_id=req.user_id,
        status="QUEUED",
        req_min_vram_gb=req.requirements.min_vram_gb,
        req_max_price=req.requirements.max_price_per_hour
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    return JobCreateResponse(
        job_id=new_job.id,
        status=new_job.status,
        recommendations=recommendations
    )

@router.post("/{job_id}/start")
async def start_job(
    job_id: str, 
    gpu_id: str, 
    idempotency_key: str = Header(default=None),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status != "QUEUED":
        raise HTTPException(status_code=400, detail=f"Job is not in QUEUED state (current: {job.status})")
    
    # ATOMIC ALLOCATION
    try:
        gpu = db.query(GPU).filter(GPU.id == gpu_id).with_for_update().first()
        if not gpu:
            raise HTTPException(status_code=404, detail="GPU not found")
            
        if gpu.status != "AVAILABLE":
            raise HTTPException(status_code=409, detail="GPU is no longer available (NO_CAPACITY)")
            
        gpu.status = "RESERVED"
        job.status = "SCHEDULING"
        
        allocation = JobAllocation(
            job_id=job.id,
            host_id=gpu.host_id,
            gpu_id=gpu.id,
            started_at=datetime.datetime.utcnow()
        )
        db.add(allocation)
        db.commit()
        
        # Notify host agent via WS
        from routers.ws import manager
        if gpu.host_id in manager.host_connections:
            ws = manager.host_connections[gpu.host_id]
            import json
            await ws.send_text(json.dumps({
                "type": "job_assignment",
                "job_id": job.id,
                "requirements": {
                    "vram_gb": job.req_min_vram_gb
                }
            }))
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Allocation failed: {str(e)}")
        
    return {"status": "success", "job_id": job.id, "gpu_id": gpu.id, "job_status": "SCHEDULING"}

