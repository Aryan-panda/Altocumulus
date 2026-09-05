from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import gpus, hosts, jobs, ws, workspaces
import logging

app = FastAPI(
    title="GPU Platform API",
    description="Backend API for the GPU workload compute platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gpus.router)
app.include_router(hosts.router)
app.include_router(jobs.router)
app.include_router(ws.router)
app.include_router(workspaces.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "GPU Platform API is running"}


