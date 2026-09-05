from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="USER") # "USER" or "PROVIDER" or "BOTH"
    
    jobs = relationship("Job", back_populates="user")
    provider = relationship("Provider", back_populates="user", uselist=False)

class Provider(Base):
    __tablename__ = "providers"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    
    user = relationship("User", back_populates="provider")
    hosts = relationship("Host", back_populates="provider")

class Host(Base):
    __tablename__ = "hosts"
    id = Column(String, primary_key=True, default=generate_uuid)
    provider_id = Column(String, ForeignKey("providers.id"))
    token = Column(String, unique=True, index=True, default=generate_uuid)
    last_heartbeat_at = Column(DateTime, nullable=True)
    
    provider = relationship("Provider", back_populates="hosts")
    gpus = relationship("GPU", back_populates="host")

class GPU(Base):
    __tablename__ = "gpus"
    id = Column(String, primary_key=True, default=generate_uuid)
    host_id = Column(String, ForeignKey("hosts.id"))
    model = Column(String) # e.g. "RTX 4090"
    vram_gb = Column(Integer)
    price_per_hour = Column(Float)
    status = Column(String, default="AVAILABLE") # AVAILABLE, RESERVED, BUSY, OFFLINE
    reliability = Column(Float, default=1.0)
    
    host = relationship("Host", back_populates="gpus")
    allocations = relationship("JobAllocation", back_populates="gpu")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="QUEUED") # QUEUED, SCHEDULING, PROVISIONING, RUNNING, COMPLETED, FAILED, CANCELLED
    failure_code = Column(String, nullable=True) # e.g. HOST_DISCONNECTED
    
    # Workload Requirements stored as JSON or simple columns
    req_min_vram_gb = Column(Integer)
    req_max_price = Column(Float)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="jobs")
    allocation = relationship("JobAllocation", back_populates="job", uselist=False)

class JobAllocation(Base):
    __tablename__ = "job_allocations"
    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(String, ForeignKey("jobs.id"), unique=True)
    host_id = Column(String, ForeignKey("hosts.id"))
    gpu_id = Column(String, ForeignKey("gpus.id"))
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    
    job = relationship("Job", back_populates="allocation")
    gpu = relationship("GPU", back_populates="allocations")

class BenchmarkProfile(Base):
    __tablename__ = "benchmark_profiles"
    id = Column(String, primary_key=True, default=generate_uuid)
    workload_type = Column(String) # e.g. "mnist-cnn-v1"
    gpu_model = Column(String) # e.g. "RTX 4090"
    estimated_runtime_sec = Column(Integer)

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True) # A workspace belongs to a job allocation
    allocation_id = Column(String, ForeignKey("job_allocations.id"), nullable=True)
    status = Column(String, default="PROVISIONING") # PROVISIONING, READY, RUNNING, STOPPING, STOPPED, FAILED
    runtime_profile = Column(String) # e.g. "pytorch-mnist-demo"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    stopped_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    last_activity_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User")
    job = relationship("Job")
    allocation = relationship("JobAllocation")
    files = relationship("WorkspaceFile", back_populates="workspace", cascade="all, delete-orphan")
    sessions = relationship("WorkspaceSession", back_populates="workspace", cascade="all, delete-orphan")

class WorkspaceFile(Base):
    __tablename__ = "workspace_files"
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"))
    path = Column(String, index=True) # e.g. "datasets/mnist.csv"
    size = Column(Integer, default=0) # bytes
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    workspace = relationship("Workspace", back_populates="files")

class WorkspaceSession(Base):
    __tablename__ = "workspace_sessions"
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"))
    user_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    workspace = relationship("Workspace", back_populates="sessions")
    user = relationship("User")

