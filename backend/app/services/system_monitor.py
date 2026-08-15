"""
system_monitor.py
==================

Pure functions that collect real system metrics using psutil.

DELIBERATE DESIGN CHOICE: nothing in this file knows about WebSockets,
FastAPI, or the ConnectionManager. It just returns Python dicts. This
means we can test it completely standalone (Step 4 below), and in
Phase 4 the background task will simply call these functions and hand
the result to the ConnectionManager — clean separation of concerns.
"""

import platform
import socket
import time
from datetime import datetime, timezone

import psutil

# Track previous network counters so we can calculate a "speed"
# (bytes/sec) instead of just an ever-increasing total. This module-level
# variable persists between calls as long as the process is running.
_last_net_io = psutil.net_io_counters()
_last_net_time = time.time()


def get_cpu_info():
    """
    CPU usage, core count, per-core usage, and frequency.

    WHY interval=None here is important:
    psutil.cpu_percent(interval=X) BLOCKS for X seconds to measure usage
    accurately. If we called this with interval=1 inside our future
    async broadcast loop, it would freeze the entire event loop for a
    full second — defeating the whole point of async. So we use
    interval=None, which returns usage since the LAST call instead of
    blocking. This means the first call after startup is unreliable
    (no previous reading to compare to), but every call after that is
    accurate AND non-blocking.
    """
    freq = psutil.cpu_freq()
    return {
        "usage_percent": psutil.cpu_percent(interval=None),
        "core_count": psutil.cpu_count(logical=True),
        "physical_cores": psutil.cpu_count(logical=False),
        "per_core_usage": psutil.cpu_percent(interval=None, percpu=True),
        "frequency_mhz": round(freq.current, 2) if freq else None,
    }


def get_memory_info():
    """RAM totals and usage percentage."""
    mem = psutil.virtual_memory()
    return {
        "total_mb": round(mem.total / (1024 ** 2), 2),
        "used_mb": round(mem.used / (1024 ** 2), 2),
        "available_mb": round(mem.available / (1024 ** 2), 2),
        "usage_percent": mem.percent,
    }


def get_disk_info():
    """
    Disk space and read/write stats for the root partition.

    NOTE: psutil.disk_usage("/") works cross-platform, but on Windows
    you'd normally check "C:\\" specifically. For a portfolio project
    demoed on your own machine, "/" is fine; we can make this configurable
    later if needed.
    """
    usage = psutil.disk_usage("/")
    io = psutil.disk_io_counters()
    return {
        "total_gb": round(usage.total / (1024 ** 3), 2),
        "used_gb": round(usage.used / (1024 ** 3), 2),
        "free_gb": round(usage.free / (1024 ** 3), 2),
        "usage_percent": usage.percent,
        "read_bytes": io.read_bytes if io else None,
        "write_bytes": io.write_bytes if io else None,
    }


def get_network_info():
    """
    Cumulative network counters PLUS a calculated speed (bytes/sec)
    based on the delta since the last time this function was called.
    """
    global _last_net_io, _last_net_time

    current = psutil.net_io_counters()
    now = time.time()
    elapsed = now - _last_net_time

    # Guard against divide-by-zero if this gets called twice in the same instant.
    if elapsed <= 0:
        elapsed = 1

    upload_speed = (current.bytes_sent - _last_net_io.bytes_sent) / elapsed
    download_speed = (current.bytes_recv - _last_net_io.bytes_recv) / elapsed

    # Update the "last" snapshot for the NEXT call to diff against.
    _last_net_io = current
    _last_net_time = now

    return {
        "bytes_sent": current.bytes_sent,
        "bytes_received": current.bytes_recv,
        "packets_sent": current.packets_sent,
        "packets_received": current.packets_recv,
        "upload_speed_bps": round(upload_speed, 2),
        "download_speed_bps": round(download_speed, 2),
    }


def get_system_info():
    """Static-ish system info: hostname, OS, uptime, boot time."""
    boot_timestamp = psutil.boot_time()
    uptime_seconds = time.time() - boot_timestamp
    return {
        "hostname": socket.gethostname(),
        "os": platform.system(),
        "os_version": platform.version(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "boot_time": datetime.fromtimestamp(boot_timestamp, tz=timezone.utc).isoformat(),
        "uptime_seconds": round(uptime_seconds, 2),
    }


def get_top_processes(limit: int = 5, sort_by: str = "cpu"):
    """
    Top processes by CPU or memory usage.

    WHY WE ITERATE psutil.process_iter() INSTEAD OF psutil.pids():
    process_iter() lets us request specific attrs up front (pid, name,
    cpu_percent, memory_percent, status) in one pass, which is far more
    efficient than looping over PIDs and creating a Process object for
    each one individually.

    WHY THE try/except INSIDE THE LOOP:
    Processes can exit BETWEEN when process_iter() lists them and when we
    read their info (e.g. a short-lived process closing). Without the
    try/except, one vanishing process would crash the entire metrics
    collection. psutil.NoSuchProcess / AccessDenied are expected, not bugs.
    """
    processes = []
    for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent", "status"]):
        try:
            info = proc.info
            processes.append({
                "pid": info["pid"],
                "name": info["name"],
                "cpu_percent": info["cpu_percent"],
                "memory_percent": round(info["memory_percent"], 2) if info["memory_percent"] else 0,
                "status": info["status"],
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    key = "cpu_percent" if sort_by == "cpu" else "memory_percent"
    processes.sort(key=lambda p: p[key], reverse=True)
    return processes[:limit]


def get_all_metrics():
    """
    Convenience function that bundles everything into one payload —
    this is exactly the shape we'll send over the WebSocket in Phase 4.
    """
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cpu": get_cpu_info(),
        "memory": get_memory_info(),
        "disk": get_disk_info(),
        "network": get_network_info(),
        "system": get_system_info(),
        "top_processes": get_top_processes(),
    }