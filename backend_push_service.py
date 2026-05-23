"""
Push notification service — sends Expo push notifications to devices
"""
import httpx
import asyncio
from typing import List
from sqlalchemy.orm import Session
import models

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(tokens: List[str], title: str, body: str, data: dict = None):
    """Send push notification via Expo Push API."""
    if not tokens:
        return

    messages = [
        {
            "to":       token,
            "title":    title,
            "body":     body,
            "data":     data or {},
            "sound":    "gate_alert.wav",
            "priority": "high",
            "channelId": "gate-alerts",
            "_displayInForeground": True,
        }
        for token in tokens
        if token and token.startswith("ExponentPushToken")
    ]

    if not messages:
        return

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={"Content-Type": "application/json"},
            )
    except Exception as e:
        print(f"[Push] Error: {e}")


async def notify_gate_alert(db: Session, event_id: str, message: str, triggered_by: str):
    """Collect all active push tokens and fire gate alert notification."""
    devices = db.query(models.Device).filter(
        models.Device.is_active == True,
        models.Device.push_token != None,
    ).all()

    tokens = [d.push_token for d in devices if d.push_token]

    await send_push(
        tokens=tokens,
        title="🚪 Gate Alert!",
        body=message,
        data={
            "type":         "GATE_ALERT",
            "event_id":     event_id,
            "message":      message,
            "triggered_by": triggered_by,
        },
    )


async def notify_family(db: Session, family_id: str, title: str, body: str, data: dict = None):
    """Notify only a specific family's devices."""
    devices = db.query(models.Device).filter(
        models.Device.family_id == family_id,
        models.Device.is_active == True,
        models.Device.push_token != None,
    ).all()

    tokens = [d.push_token for d in devices if d.push_token]
    await send_push(tokens, title, body, data)
