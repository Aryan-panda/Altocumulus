from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WorkloadRequirements(BaseModel):
    min_vram_gb: int
    min_cores: Optional[int] = 4
    min_ram_gb: Optional[int] = 16
    max_price_per_hour: float
    workload_type: str # e.g. "mnist-cnn-v1"
    privacy_level: Optional[str] = "public"

class JobCreateRequest(BaseModel):
    user_id: str
    requirements: WorkloadRequirements

class JobRecommendation(BaseModel):
    gpu_id: str
    gpu_model: str
    estimated_runtime_sec: int
    estimated_cost: float
    reliability: float
    score: float
    reason: str

class JobCreateResponse(BaseModel):
    job_id: str
    status: str
    recommendations: List[JobRecommendation]

class WorkspaceCreate(BaseModel):
    job_id: str
    runtime_profile: str = "pytorch-mnist-demo"

class WorkspaceResponse(BaseModel):
    id: str
    job_id: str
    status: str
    runtime_profile: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class WorkspaceFileMeta(BaseModel):
    id: str
    path: str
    size: int
    updated_at: datetime
    
    class Config:
        orm_mode = True
