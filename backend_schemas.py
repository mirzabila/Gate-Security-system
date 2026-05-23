"""
Pydantic request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from models import UserRole


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    name:     str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      str
    role:         str
    name:         str

class RegisterRequest(BaseModel):
    name:       str
    password:   str
    invite_key: str          # super key or family key
    device_token: Optional[str] = None
    platform:     Optional[str] = "android"


# ── User ──────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id:        str
    name:      str
    role:      str
    family_id: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ── Family ────────────────────────────────────────────────────────────────────

class FamilyCreate(BaseModel):
    name:        str
    admin_name:  str
    max_devices: int = 4

class FamilyUpdate(BaseModel):
    max_devices: Optional[int]
    is_active:   Optional[bool]

class FamilyOut(BaseModel):
    id:          str
    name:        str
    admin_name:  str
    invite_key:  str
    max_devices: int
    is_active:   bool
    created_at:  datetime
    member_count: Optional[int] = 0
    device_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ── Device ────────────────────────────────────────────────────────────────────

class DeviceRegister(BaseModel):
    name:        Optional[str] = "My Device"
    push_token:  Optional[str] = None
    platform:    str = "android"

class DeviceOut(BaseModel):
    id:           str
    name:         Optional[str]
    platform:     str
    is_active:    bool
    registered_at: datetime

    class Config:
        from_attributes = True


# ── Gate ──────────────────────────────────────────────────────────────────────

class GateTrigger(BaseModel):
    message: str = "Someone is at the gate!"

class GateEventOut(BaseModel):
    id:           str
    triggered_by: str
    message:      str
    acknowledged: bool
    ack_by:       Optional[str]
    created_at:   datetime

    class Config:
        from_attributes = True


# ── Schedule ──────────────────────────────────────────────────────────────────

class ScheduleCreate(BaseModel):
    date:        str   # YYYY-MM-DD
    unavailable: bool = True
    note:        Optional[str] = None

class ScheduleOut(BaseModel):
    id:          str
    date:        str
    unavailable: bool
    note:        Optional[str]
    user_id:     str

    class Config:
        from_attributes = True


# ── Notification ──────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id:         str
    title:      str
    body:       str
    is_read:    bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Super Key ─────────────────────────────────────────────────────────────────

class SuperKeyOut(BaseModel):
    id:          str
    key_value:   str
    max_devices: int
    is_active:   bool
    created_at:  datetime

    class Config:
        from_attributes = True
