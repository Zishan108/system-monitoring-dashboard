"""
websocket_manager.py
=====================

Owns the list of connected clients and knows how to broadcast to all of
them. Moved out of routers/websocket.py into services/ because as of
Phase 4, this class is used by TWO different places: the WebSocket route
(to register/remove connections) AND the background broadcaster (to push
metrics out). Keeping it in its own module avoids a circular import
between those two.
"""

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[connect] Client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"[disconnect] Client disconnected. Total clients: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        """
        Sends `message` to every currently-connected client.

        WHY WE COLLECT DEAD CONNECTIONS INSTEAD OF REMOVING THEM MID-LOOP:
        If client B disconnects between when the broadcast loop started and
        when we try to send to them, ws.send_text() raises an exception.
        We DON'T want that to stop clients C, D, E from getting their
        update (Section 13 of the spec: "one disconnected client does not
        crash the monitoring loop"). So we try each send, note failures,
        and clean them up AFTER the loop finishes — never mutate a list
        while iterating over it, that causes its own bugs.
        """
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


# Singleton instance — shared by the WebSocket route AND the background
# broadcaster. Both import THIS SAME OBJECT, so they're always looking
# at the same list of active connections.
manager = ConnectionManager()