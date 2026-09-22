"""
Authentication API — register, login, get current user.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Check existing
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if data.role not in ("institution", "receiver", "admin"):
        raise HTTPException(status_code=400, detail="Role must be: institution, receiver, or admin")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        phone=data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role},
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role},
    )


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user
