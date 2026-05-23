"""
SQLAlchemy Models
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from desktop_database import Base
import uuid
import enum


def gen_id():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    SUPER_ADMIN  = "super_admin"   # Mirza Bilal
    FAMILY_ADMIN = "family_admin"
    MEMBER       = "member"


class User(Base):
    __tablename__ = "users"

    id           = Column(String, primary_key=True, default=gen_id)
    name         = Column(String(120), nullable=False)
    role         = Column(Enum(UserRole), default=UserRole.MEMBER)
    password_hash= Column(String(256), nullable=False)
    family_id    = Column(String, ForeignKey("families.id"), nullable=True)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    family       = relationship("Family", back_populates="members")
    devices      = relationship("Device", back_populates="owner")
    schedules    = relationship("Schedule", back_populates="user")


class Family(Base):
    __tablename__ = "families"

    id           = Column(String, primary_key=True, default=gen_id)
    name         = Column(String(120), nullable=False)
    admin_name   = Column(String(120), nullable=False)
    invite_key   = Column(String(64), unique=True, nullable=False)
    max_devices  = Column(Integer, default=4)   # set by super admin
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    members      = relationship("User", back_populates="family")
    devices      = relationship("Device", back_populates="family")


class Device(Base):
    __tablename__ = "devices"

    id           = Column(String, primary_key=True, default=gen_id)
    name         = Column(String(120))
    push_token   = Column(String(256), nullable=True)
    platform     = Column(String(20))   # ios | android
    owner_id     = Column(String, ForeignKey("users.id"), nullable=True)
    family_id    = Column(String, ForeignKey("families.id"), nullable=True)
    is_active    = Column(Boolean, default=True)
    registered_at= Column(DateTime(timezone=True), server_default=func.now())

    owner        = relationship("User", back_populates="devices")
    family       = relationship("Family", back_populates="devices")


class GateEvent(Base):
    __tablename__ = "gate_events"

    id           = Column(String, primary_key=True, default=gen_id)
    triggered_by = Column(String(120), default="gate_sensor")
    message      = Column(String(256), default="Someone is at the gate!")
    acknowledged = Column(Boolean, default=False)
    ack_by       = Column(String, nullable=True)   # user id
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


class Schedule(Base):
    __tablename__ = "schedules"

    id           = Column(String, primary_key=True, default=gen_id)
    user_id      = Column(String, ForeignKey("users.id"))
    family_id    = Column(String, ForeignKey("families.id"))
    date         = Column(String(12), nullable=False)   # YYYY-MM-DD
    unavailable  = Column(Boolean, default=True)
    note         = Column(String(256), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    user         = relationship("User", back_populates="schedules")


class Notification(Base):
    __tablename__ = "notifications"

    id           = Column(String, primary_key=True, default=gen_id)
    user_id      = Column(String, ForeignKey("users.id"), nullable=True)
    family_id    = Column(String, ForeignKey("families.id"), nullable=True)
    title        = Column(String(200))
    body         = Column(Text)
    is_read      = Column(Boolean, default=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


class SuperKey(Base):
    """Global invite key managed by Mirza Bilal"""
    __tablename__ = "super_keys"

    id           = Column(String, primary_key=True, default=gen_id)
    key_value    = Column(String(64), unique=True, nullable=False)
    max_devices  = Column(Integer, default=50)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

