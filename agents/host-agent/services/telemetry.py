import random

class TelemetryProvider:
    def get_stats(self) -> dict:
        pass

class MockTelemetryProvider(TelemetryProvider):
    def get_stats(self) -> dict:
        return {
            "gpu_utilization": random.randint(85, 99),
            "vram_used_mb": random.randint(8000, 8500),
            "vram_total_mb": 24576,
            "temperature_c": random.randint(65, 75),
            "power_w": random.randint(300, 350)
        }

class NVMLTelemetryProvider(TelemetryProvider):
    def get_stats(self) -> dict:
        # In a real implementation, this uses pynvml to query the physical GPU
        return {
            "gpu_utilization": 0,
            "vram_used_mb": 0,
            "vram_total_mb": 24576,
            "temperature_c": 35,
            "power_w": 20
        }
