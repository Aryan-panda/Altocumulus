from database import engine, Base, SessionLocal
from models import User, Provider, Host, GPU, BenchmarkProfile

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing
    db.query(BenchmarkProfile).delete()
    db.query(GPU).delete()
    db.query(Host).delete()
    db.query(Provider).delete()
    db.query(User).delete()

    # Create demo user
    demo_user = User(email="demo@example.com", role="BOTH")
    db.add(demo_user)
    db.commit()

    # Create provider
    provider = Provider(user_id=demo_user.id, name="Verified Provider #2841")
    db.add(provider)
    db.commit()

    # Create host A
    host_a = Host(
        id="demo-host-a",
        provider_id=provider.id,
        token="demo-token-123"
    )
    db.add(host_a)
    db.commit()
    
    gpu_a = GPU(
        id="demo-gpu-a",
        host_id=host_a.id,
        model="RTX 4090",
        vram_gb=24,
        price_per_hour=42.0,
        status="AVAILABLE",
        reliability=0.987
    )
    db.add(gpu_a)

    # Create host B
    host_b = Host(provider_id=provider.id)
    db.add(host_b)
    db.commit()

    gpu_b = GPU(
        host_id=host_b.id,
        model="RTX 4070",
        vram_gb=12,
        price_per_hour=28.0,
        status="AVAILABLE",
        reliability=0.974
    )
    db.add(gpu_b)

    # Seed benchmarks
    benchmarks = [
        BenchmarkProfile(workload_type="mnist-cnn-v1", gpu_model="RTX 4090", estimated_runtime_sec=102),
        BenchmarkProfile(workload_type="mnist-cnn-v1", gpu_model="RTX 4070", estimated_runtime_sec=181),
        BenchmarkProfile(workload_type="mnist-cnn-v1", gpu_model="RTX 3090", estimated_runtime_sec=145),
        BenchmarkProfile(workload_type="mnist-cnn-v1", gpu_model="A100", estimated_runtime_sec=65),
    ]
    db.add_all(benchmarks)

    db.commit()
    db.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed()
