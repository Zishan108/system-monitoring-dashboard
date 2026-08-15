"""
main.py
=======

Entrypoint. As of Phase 4, this file also manages the background
broadcaster's lifecycle using FastAPI's `lifespan` context manager.
"""

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # reads backend/.env into environment variables BEFORE
                # broadcaster.py reads os.getenv("METRICS_INTERVAL")

from app.routers import websocket, metrics, alerts
from app.services.broadcaster import broadcast_loop




@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    WHY A LIFESPAN CONTEXT MANAGER INSTEAD OF JUST STARTING THE LOOP
    AT MODULE LEVEL:
    We need the broadcast loop to start AFTER the app is fully up, and —
    just as importantly — we need a clean way to CANCEL it when the app
    shuts down (e.g. you hit Ctrl+C). Without explicit cancellation, the
    background task would be abruptly killed mid-operation, which is
    messy. `asyncio.create_task()` here schedules broadcast_loop() to run
    concurrently with everything else the event loop is doing. Code
    BEFORE `yield` runs on startup; code AFTER `yield` runs on shutdown.
    """
    task = asyncio.create_task(broadcast_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


import asyncio  # placed here intentionally so it's visible near its usage above

app = FastAPI(
    title="Real-Time System Monitoring Dashboard",
    description="Phase 4: background metric broadcasting over WebSocket.",
    version="0.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(websocket.router)
app.include_router(metrics.router)
app.include_router(alerts.router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "System Monitoring Dashboard API — Phase 4"}