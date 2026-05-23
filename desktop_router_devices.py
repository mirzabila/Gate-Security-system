"""
Devices router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from desktop_database import get_db
import desktop_models as models, desktop_schemas as schemas, desktop_security as security

router = APIRouter()


@router.post("/register", response_model=schemas.DeviceOut)
def register_device(
    req: schemas.DeviceRegister,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # Check limit
    if current_user.family_id:
        family = db.query(models.Family).filter(models.Family.id == current_user.family_id).first()
        count = db.query(models.Device).filter(
            models.Device.family_id == current_user.family_id,
            models.Device.is_active == True
        ).count()
        if family and count >= family.max_devices:
            raise HTTPException(status_code=403, detail="Device limit reached")

    device = models.Device(
        name=req.name,
        push_token=req.push_token,
        platform=req.platform,
        owner_id=current_user.id,
        family_id=current_user.family_id,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/my", response_model=List[schemas.DeviceOut])
def my_devices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return db.query(models.Device).filter(
        models.Device.owner_id == current_user.id,
        models.Device.is_active == True
    ).all()


@router.get("/family", response_model=List[schemas.DeviceOut])
def family_devices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_family_admin),
):
    fid = current_user.family_id
    if current_user.role == models.UserRole.SUPER_ADMIN:
        return db.query(models.Device).filter(models.Device.is_active == True).all()
    return db.query(models.Device).filter(
        models.Device.family_id == fid,
        models.Device.is_active == True
    ).all()


@router.delete("/{device_id}")
def remove_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.owner_id != current_user.id and current_user.role not in (
        models.UserRole.SUPER_ADMIN, models.UserRole.FAMILY_ADMIN
    ):
        raise HTTPException(status_code=403, detail="Not allowed")
    device.is_active = False
    db.commit()
    return {"message": "Device removed"}

