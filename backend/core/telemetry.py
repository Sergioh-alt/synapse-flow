import time
import psutil
from typing import Dict, Any

class HardwareTelemetry:
    """
    Live Hardware Telemetry via psutil to showcase the REDDIT-FLOW-NODE UI
    activity. Real CPU and RAM metrics.
    """
    
    def __init__(self):
        self.ram_boost_until = 0.0
        # Initialize psutil empty call on startup to calculate delta correctly
        psutil.cpu_percent(interval=None)
    
    def trigger_ram_boost(self, duration_sec: float = 3.0):
        """
        Keep state for PROCESSING UI status but rely on real hardware metrics.
        """
        self.ram_boost_until = time.time() + duration_sec
        
    def get_stats(self) -> Dict[str, Any]:
        """
        Returns live hardware telemetry statistics.
        """
        is_boosted = time.time() < self.ram_boost_until
        status = "PROCESSING" if is_boosted else "IDLE"
        
        cpu = psutil.cpu_percent(interval=None)
        ram = psutil.virtual_memory().percent
            
        return {
            "status": status,
            "cpu_usage_pct": float(cpu),
            "ram_usage_pct": float(ram),
            "timestamp": time.time()
        }

# Singleton instance
telemetry_monitor = HardwareTelemetry()
