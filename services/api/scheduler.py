from sqlalchemy.orm import Session
from models import GPU, BenchmarkProfile, Host
from schemas import WorkloadRequirements, JobRecommendation
from typing import List

def get_recommendations(db: Session, req: WorkloadRequirements) -> List[JobRecommendation]:
    # 1. Hard Constraints
    # GPU must be AVAILABLE
    # VRAM >= req.min_vram_gb
    # Price <= req.max_price_per_hour
    # Host must be ONLINE (we assume Host is online if it exists and has heartbeat, but simplified here)
    
    available_gpus = db.query(GPU).filter(
        GPU.status == "AVAILABLE",
        GPU.vram_gb >= req.min_vram_gb,
        GPU.price_per_hour <= req.max_price_per_hour
    ).all()
    
    if not available_gpus:
        return []
    
    recommendations = []
    
    for gpu in available_gpus:
        # 2. Benchmark Lookup
        benchmark = db.query(BenchmarkProfile).filter(
            BenchmarkProfile.workload_type == req.workload_type,
            BenchmarkProfile.gpu_model == gpu.model
        ).first()
        
        est_runtime = benchmark.estimated_runtime_sec if benchmark else 3600 # default to 1 hour if unknown
        
        # Calculate cost
        est_cost = (est_runtime / 3600.0) * gpu.price_per_hour
        
        # 3. Scoring (Lower is better for cost/runtime, higher for reliability)
        # Score = (Cost * 0.5) + ((Runtime/3600) * 0.3) - (Reliability * 10)
        score = (est_cost * 0.5) + ((est_runtime / 3600.0) * 0.3) - (gpu.reliability * 10)
        
        recommendations.append(
            JobRecommendation(
                gpu_id=gpu.id,
                gpu_model=gpu.model,
                estimated_runtime_sec=est_runtime,
                estimated_cost=round(est_cost, 4),
                reliability=gpu.reliability,
                score=score,
                reason=f"Optimal match based on benchmark for {req.workload_type}"
            )
        )
        
    # Sort recommendations by score ascending (lowest score is best)
    recommendations.sort(key=lambda x: x.score)
    
    return recommendations
