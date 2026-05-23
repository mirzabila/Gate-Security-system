"""
Gate router â€” trigger alerts, WebSocket real-time broadcast + push notifications
"""
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
import asyncio
from desktop_database import get_db
import desktop_models as models, desktop_schemas as schemas, desktop_security as security
from desktop_push_service import notify_gate_alert

router = APIRouter()


# â”€â”€ WebSocket connection manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()


# â”€â”€ REST endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@router.post("/trigger", response_model=schemas.GateEventOut)
async def trigger_gate(
    req: schemas.GateTrigger,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    event = models.GateEvent(
        triggered_by=current_user.name,
        message=req.message,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    payload = {
        "type":         "GATE_ALERT",
        "event_id":     event.id,
        "message":      event.message,
        "triggered_by": event.triggered_by,
        "timestamp":    event.created_at.isoformat(),
    }

    # Broadcast via WebSocket
    await manager.broadcast(payload)

    # Send push notifications to all registered devices
    asyncio.create_task(
        notify_gate_alert(db, event.id, event.message, event.triggered_by)
    )

    # Create in-app notifications for all active users
    users = db.query(models.User).filter(models.User.is_active == True).all()
    for u in users:
        notif = models.Notification(
            user_id=u.id,
            title="ðŸšª Gate Alert!",
            body=f"{event.triggered_by}: {event.message}",
        )
        db.add(notif)
    db.commit()

    return event


@router.post("/acknowledge/{event_id}", response_model=schemas.GateEventOut)
def acknowledge(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    event = db.query(models.GateEvent).filter(models.GateEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.acknowledged = True
    event.ack_by = current_user.id
    db.commit()
    db.refresh(event)
    return event


@router.get("/events", response_model=List[schemas.GateEventOut])
def list_events(
    limit: int = 20,
    db: Session = Depends(get_db),
    _: models.User = Depends(security.get_current_user),
):
    return (
        db.query(models.GateEvent)
        .order_by(models.GateEvent.created_at.desc())
        .limit(limit)
        .all()
    )


# â”€â”€ WebSocket endpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

