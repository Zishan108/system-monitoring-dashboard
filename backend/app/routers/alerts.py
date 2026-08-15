"""
alerts.py
=========

REST endpoints for reading/updating alert thresholds. Plain REST, not
WebSocket — configuring a threshold is a rare deliberate action, not a
live stream. WebSocket stays reserved for the continuous metric/alert push.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services import alert_service

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class ThresholdUpdate(BaseModel):
    cpu: Optional[float] = None
    memory: Optional[float] = None
    disk: Optional[float] = None


@router.get("/thresholds")
def get_thresholds():
    return alert_service.get_thresholds()


@router.post("/thresholds")
def update_thresholds(payload: ThresholdUpdate):
    return alert_service.set_thresholds(payload.dict())