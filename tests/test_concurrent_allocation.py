import asyncio
import httpx
import time

API_URL = "http://localhost:8000"

async def create_job():
    async with httpx.AsyncClient() as client:
        req = {
            "user_id": "demo_user",
            "requirements": {
                "min_vram_gb": 8,
                "max_price_per_hour": 50.0,
                "workload_type": "mnist-cnn-v1"
            }
        }
        res = await client.post(f"{API_URL}/jobs/", json=req)
        data = res.json()
        
        job_id = data["job_id"]
        gpu_id = data["recommendations"][0]["gpu_id"]
        return job_id, gpu_id

async def attempt_start(job_id, gpu_id, idempotency_key):
    async with httpx.AsyncClient() as client:
        headers = {"Idempotency-Key": idempotency_key}
        res = await client.post(f"{API_URL}/jobs/{job_id}/start?gpu_id={gpu_id}", headers=headers)
        return res.status_code, res.json()

async def run_concurrent_test():
    print("Setting up two jobs targeting the same GPU...")
    job_1, gpu_1 = await create_job()
    job_2, gpu_2 = await create_job()
    
    # Assert they recommend the same GPU (which they should because it's the best one)
    if gpu_1 != gpu_2:
        print(f"Test failed setup: GPU 1 ({gpu_1}) != GPU 2 ({gpu_2})")
        return
        
    print(f"Jobs created: {job_1} and {job_2}")
    print(f"Both attempting to allocate GPU: {gpu_1}")
    
    print("Firing simultaneous start requests...")
    # Fire simultaneously
    results = await asyncio.gather(
        attempt_start(job_1, gpu_1, "key1"),
        attempt_start(job_2, gpu_1, "key2")
    )
    
    print("\nResults:")
    for i, (status, data) in enumerate(results):
        print(f"Request {i+1} - Status {status}: {data}")
        
    # Validation
    successes = [s for s, _ in results if s == 200]
    conflicts = [s for s, _ in results if s == 409]
    
    if len(successes) == 1 and len(conflicts) == 1:
        print("\nSUCCESS: Atomic allocation prevented double-booking!")
    else:
        print("\nFAILURE: Atomic allocation did not behave as expected.")

if __name__ == "__main__":
    asyncio.run(run_concurrent_test())
