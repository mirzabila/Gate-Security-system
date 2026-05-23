"""
Admin routes â€” super admin manages families, keys, devices
"""
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from desktop_database import get_db
import desktop_models as models, desktop_schemas as schemas, desktop_security as security

router = APIRouter()


# â”€â”€ Super Admin: Families â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/families", response_model=List[schemas.FamilyOut])
def list_families(
    db: Session = Depends(get_db),
    _: models.User = Depends(security.require_super_admin),
):
    families = db.query(models.Family).all()
    result = []
    for f in families:
        fo = schemas.FamilyOut.from_orm(f)
        fo.member_count = len(f.members)
        fo.device_count = len(f.devices)
        result.append(fo)
    return result


@router.post("/families", response_model=schemas.FamilyOut)
def create_family(
    req: schemas.FamilyCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(security.require_super_admin),
):
    key = secrets.token_hex(12)
    family = models.Family(
        name=req.name,
        admin_name=req.admin_name,
        invite_key=key,
        max_devices=req.max_devices,
    )
    db.add(family)
    db.commit()
    db.refresh(family)
    return family


@router.patch("/families/{family_id}", response_model=schemas.FamilyOut)
def update_family(
    family_id: str,
    req: schemas.FamilyUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(security.require_super_admin),
):
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    if req.max_devices is not None:
        family.max_devices = req.max_devices
    if req.is_active is not None:
        family.is_active = req.is_active
    db.commit()
    db.refresh(family)
    return family


@router.delete("/families/{family_id}")
def delete_family(
    family_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(security.require_super_admin),
):
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    family.is_active = False
    db.commit()
    return {"message": "Family deactivated"}


# â”€â”€ Super Admin: Keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/super-key", response_model=schemas.SuperKeyOut)
def get_super_key(
    db: Session = Depends(get_db),
    _: models.User = Depends(security.require_super_admin),
):
    key = db.query(models.SuperKey).filter(models.SuperKey.is_active == True).first()
    if not key:
        raise HTTPException(status_code=404, detail="No active super key")
    return key


@router.post("/super-key/regenerate", response_model=schemas.SuperKeyOut)
def regenerate_super_key(
    db: Session = Depends(get_db),
    _: models.User = Depends(security.require_super_admin),
):
    old = db.query(models.SuperKey).filter(models.SuperKey.is_active == True).first()
    if old:
        old.is_active = False
    new_key = models.SuperKey(key_value=secrets.token_hex(16), max_devices=50)
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    return new_key


@router.post("/families/{family_id}/regenerate-key")
def regenerate_family_key(
    family_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(security.require_super_admin),
):
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    family.invite_key = secrets.token_hex(12)
    db.commit()
    return {"invite_key": family.invite_key}


# â”€â”€ Admin: Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_family_admin),
):
    if current_user.role == models.UserRole.SUPER_ADMIN:
        return db.query(models.User).all()
    return db.query(models.User).filter(models.User.family_id == current_user.family_id).all()


@router.delete("/users/{user_id}")
def remove_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_family_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role != models.UserRole.SUPER_ADMIN:
        if user.family_id != current_user.family_id:
            raise HTTPException(status_code=403, detail="Not allowed")
    user.is_active = False
    db.commit()
    return {"message": "User deactivated"}


# â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/stats")
def stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(security.require_super_admin),
):
    return {
        "total_families": db.query(models.Family).count(),
        "active_families": db.query(models.Family).filter(models.Family.is_active == True).count(),
        "total_users":   db.query(models.User).count(),
        "total_devices": db.query(models.Device).filter(models.Device.is_active == True).count(),
        "total_events":  db.query(models.GateEvent).count(),
    }

