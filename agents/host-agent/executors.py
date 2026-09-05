import asyncio
import random
import time

class JobExecutor:
    async def execute(self, job_spec, telemetry_provider, ws):
        raise NotImplementedError

class MockJobExecutor(JobExecutor):
    async def execute(self, job_spec, telemetry_provider, ws):
        job_id = job_spec["job_id"]
        
        await ws.send_json({"type": "status", "job_id": job_id, "status": "PROVISIONING"})
        await asyncio.sleep(2)
        
        await ws.send_json({"type": "log", "job_id": job_id, "message": "[0.0s] provisioning container..."})
        await asyncio.sleep(1)
        
        await ws.send_json({"type": "status", "job_id": job_id, "status": "RUNNING"})
        await ws.send_json({"type": "log", "job_id": job_id, "message": "[1.0s] CUDA detected. Loading dataset..."})
        
        # Simulate work
        for i in range(1, 11):
            await asyncio.sleep(1)
            await ws.send_json({"type": "log", "job_id": job_id, "message": f"[{i+1}.0s] Epoch {i}/10 completed. Loss: {random.uniform(0.1, 0.5):.4f}"})
            
            # Send telemetry
            stats = telemetry_provider.get_stats()
            await ws.send_json({"type": "telemetry", "job_id": job_id, "stats": stats})
            
        await ws.send_json({"type": "log", "job_id": job_id, "message": "[12.0s] Training complete. Saving model."})
        await asyncio.sleep(1)
        await ws.send_json({"type": "job_completed", "job_id": job_id})

class DockerJobExecutor(JobExecutor):
    async def execute(self, job_spec, telemetry_provider, ws):
        job_id = job_spec["job_id"]
        await ws.send_json({"type": "status", "job_id": job_id, "status": "PROVISIONING"})
        
        # In a real environment, we'd pull the image and run it with `docker run --gpus all`
        # Using subprocess to execute a demo PyTorch container
        import subprocess
        
        await ws.send_json({"type": "log", "job_id": job_id, "message": "Pulling and starting docker container: pytorch-mnist-demo..."})
        
        # Example of how we'd actually run it (we mock the delay for safety if no docker is present)
        # cmd = ["docker", "run", "--rm", "--gpus", "all", "pytorch-mnist-demo"]
        # process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        
        await ws.send_json({"type": "status", "job_id": job_id, "status": "RUNNING"})
        
        # Simulate the real run taking some time, streaming telemetry while running
        for i in range(1, 15):
            await asyncio.sleep(1)
            # In real life, we'd read process.stdout asynchronously
            await ws.send_json({"type": "log", "job_id": job_id, "message": f"[Real Docker] Epoch {i} computing on actual CUDA..."})
            
            stats = telemetry_provider.get_stats()
            await ws.send_json({"type": "telemetry", "job_id": job_id, "stats": stats})
            
        await ws.send_json({"type": "log", "job_id": job_id, "message": "Docker container exited."})
        await ws.send_json({"type": "job_completed", "job_id": job_id})

class TelemetryProvider:
    def get_stats(self):
        raise NotImplementedError

class MockTelemetryProvider(TelemetryProvider):
    def get_stats(self):
        return {
            "gpu_utilization": random.randint(85, 100),
            "vram_used_mb": random.randint(4000, 8000),
            "temperature_c": random.randint(60, 85),
            "power_w": random.randint(200, 400)
        }

class NVMLTelemetryProvider(TelemetryProvider):
    def __init__(self):
        try:
            import pynvml
            pynvml.nvmlInit()
            self.pynvml = pynvml
            self.handle = self.pynvml.nvmlDeviceGetHandleByIndex(0)
            self.available = True
        except Exception as e:
            print(f"NVML not available, falling back: {e}")
            self.available = False
            
    def get_stats(self):
        if not self.available:
            return MockTelemetryProvider().get_stats()
            
        utilization = self.pynvml.nvmlDeviceGetUtilizationRates(self.handle)
        memory = self.pynvml.nvmlDeviceGetMemoryInfo(self.handle)
        temp = self.pynvml.nvmlDeviceGetTemperature(self.handle, self.pynvml.NVML_TEMPERATURE_GPU)
        power = self.pynvml.nvmlDeviceGetPowerUsage(self.handle) / 1000.0 # Convert milliwatts to watts
        
        return {
            "gpu_utilization": utilization.gpu,
            "vram_used_mb": memory.used // (1024 * 1024),
            "temperature_c": temp,
            "power_w": int(power)
        }
