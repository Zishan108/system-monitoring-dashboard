"""
metrics.py
==========

REST endpoints for historical data. This is the "hybrid approach" from
the spec: WebSocket handles live streaming, REST handles anything that's
a one-time fetch — like "give me the last 24 hours of snapshots" when the
dashboard first loads, before any live WebSocket data has arrived yet.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import MetricSnapshot

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/history")
def get_history(limit: int = 100, db: Session = Depends(get_db)):
    """
    Returns the most recent `limit` snapshots, oldest first (so charts
    can plot them left-to-right in chronological order without the
    frontend needing to reverse the array itself).
    """
    snapshots = (
        db.query(MetricSnapshot)
        .order_by(desc(MetricSnapshot.timestamp))
        .limit(limit)
        .all()
    )
    snapshots.reverse()

    return [
        {
            "timestamp": s.timestamp.isoformat(),
            "cpu_usage": s.cpu_usage,
            "memory_usage": s.memory_usage,
            "disk_usage": s.disk_usage,
            "network_bytes_sent": s.network_bytes_sent,
            "network_bytes_received": s.network_bytes_received,
        }
        for s in snapshots
    ]