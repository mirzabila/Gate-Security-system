"""
Auth routes — register, login, seed super admin
"""
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, security

router = APIRouter()

SUPER_ADMIN_NAME = "Mirza Bilal"

FAMILY_ADMINS = [
    "Iftikhar Mehmood", "Sajid Mehmood", "Majid Mehmood",
    "Mirza Younas", "Mirza Yousaf", "Iftikhar Najmi",
    "Ghiyour Asif", "Khalil Baig",
]


def _seed(db: Session):
    """Create super admin + family admins if they don't exist yet."""
    sa = db.query(models.User).filter(models.User.role == models.UserRole.SUPER_ADMIN).first()
    if not sa:
        # Create super key
        super_key_val = secrets.token_hex(16)
        sk = models.SuperKey(key_value=super_key_val, max_devices=50)
        db.add(sk)

        sa = models.User(
            name=SUPER_ADMIN_NAME,
            role=models.UserRole.SUPER_ADMIN,
            password_hash=security.hash_password("admin@gate2024"),
        )
        db.add(sa)
        db.flush()

        # Create family admins
        for fname in FAMILY_ADMINS:
            invite_key = secrets.token_hex(12)
            family = models.Family(
                name=f"{fname.split()[0]} Family",
                admin_name=fname,
                invite_key=invite_key,
                max_devices=4,
            )
            db.add(family)
            db.flush()

            user = models.User(
                name=fname,
                role=models.UserRole.FAMILY_ADMIN,
                password_hash=security.hash_password("admin@gate2024"),
                family_id=family.id,
            )
            db.add(user)

        db.commit()


@router.on_event("startup")  # type: ignore
def startup():
    from database import SessionLocal
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()


@router.post("/seed")
def seed(db: Session = Depends(get_db)):
    _seed(db)
    return {"message": "Seeded"}


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.name == req.name).first()
    if not user or not security.verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid name or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = security.create_access_token({"sub": user.id})
    return schemas.TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role,
        name=user.name,
    )


@router.post("/register", response_model=schemas.TokenResponse)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    # Check invite key against super key or family key
    super_key = db.query(models.SuperKey).filter(
        models.SuperKey.key_value == req.invite_key,
        models.SuperKey.is_active == True
    ).first()

    family = db.query(models.Family).filter(
        models.Family.invite_key == req.invite_key,
        models.Family.is_active == True
    ).first()

    if not super_key and not family:
        raise HTTPException(status_code=400, detail="Invalid invite key")

    if family:
        # Check device limit
        device_count = db.query(models.Device).filter(
            models.Device.family_id == family.id,
            models.Device.is_active == True
        ).count()
        if device_count >= family.max_devices:
            raise HTTPException(status_code=403, detail="Device limit reached for this family")

    existing = db.query(models.User).filter(models.User.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Name already taken")

    user = models.User(
        name=req.name,
        role=models.UserRole.MEMBER,
        password_hash=security.hash_password(req.password),
        family_id=family.id if family else None,
    )
    db.add(user)
    db.flush()

    if req.device_token:
        device = models.Device(
            name="My Device",
            push_token=req.device_token,
            platform=req.platform or "android",
            owner_id=user.id,
            family_id=family.id if family else None,
        )
        db.add(device)

    db.commit()
    token = security.create_access_token({"sub": user.id})
    return schemas.TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role,
        name=user.name,
    )


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(security.get_current_user)):
    return current_user
