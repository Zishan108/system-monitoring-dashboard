"""
websocket.py
============

The /ws route itself. As of Phase 4, ConnectionManager lives in
services/websocket_manager.py — this file just handles the connection
lifecycle (accept, receive, disconnect) and imports the shared manager.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We still listen for incoming messages (e.g. future: client
            # could send config changes, like alert thresholds in Phase 9).
            # For now we just keep the connection alive by waiting on it —
            # the actual metric data going OUT is pushed by the background
            # broadcaster (Step 4 below), not sent from here.
            data = await websocket.receive_text()
            print(f"[received] {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)