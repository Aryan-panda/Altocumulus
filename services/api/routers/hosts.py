from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Host, Provider
import datetime

router = APIRouter(prefix="/hosts", tags=["Hosts"])

class RegisterHostRequest(BaseModel):
    provider_id: str

@router.post("/register")
def register_host(req: RegisterHostRequest, db: Session = Depends(get_db)):
    provider = db.query(Provider).filter(Provider.id == req.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    new_host = Host(provider_id=provider.id)
    db.add(new_host)
    db.commit()
    db.refresh(new_host)
    
    return {
        "host_id": new_host.id,
        "host_token": new_host.token
    }

@router.get("/")
def get_hosts(db: Session = Depends(get_db)):
    hosts = db.query(Host).all()
    return [{"id": h.id, "provider_id": h.provider_id, "last_heartbeat_at": h.last_heartbeat_at} for h in hosts]
