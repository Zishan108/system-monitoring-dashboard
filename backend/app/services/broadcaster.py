"""
broadcaster.py
==============

Collects metrics, checks alert thresholds, broadcasts both metrics and
any triggered alerts over WebSocket, and periodically saves snapshots.
"""

import asyncio
import json
import os

from app.services import system_monitor, alert_service
from app.services.websocket_manager import manager
from app.database import SessionLocal
from app.models import MetricSnapshot

METRICS_INTERVAL = float(os.getenv("METRICS_INTERVAL", "1"))
SNAPSHOT_INTERVAL = float(os.getenv("SNAPSHOT_INTERVAL", "10"))


def save_snapshot(metrics: dict):
    db = SessionLocal()
    try:
        snapshot = MetricSnapshot(
            cpu_usage=metrics["cpu"]["usage_percent"],
            memory_usage=metrics["memory"]["usage_percent"],
            disk_usage=metrics["disk"]["usage_percent"],
            network_bytes_sent=metrics["network"]["bytes_sent"],
            network_bytes_received=metrics["network"]["bytes_received"],
        )
        db.add(snapshot)
        db.commit()
    finally:
        db.close()


async def broadcast_loop():
    elapsed_since_snapshot = 0.0

    while True:
        metrics = await asyncio.to_thread(system_monitor.get_all_metrics)

        # Check thresholds BEFORE broadcasting metrics, so any triggered
        # alert arrives in the same tick as the data that caused it.
        alerts = alert_service.check_thresholds(metrics)
        for alert in alerts:
            await manager.broadcast(json.dumps({"type": "alert", "data": alert}))

        await manager.broadcast(json.dumps({"type": "metrics", "data": metrics}))

        elapsed_since_snapshot += METRICS_INTERVAL
        if elapsed_since_snapshot >= SNAPSHOT_INTERVAL:
            await asyncio.to_thread(save_snapshot, metrics)
            elapsed_since_snapshot = 0.0

        await asyncio.sleep(METRICS_INTERVAL)