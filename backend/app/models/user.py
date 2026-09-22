"""
User model — supports institution, receiver, and admin roles.
"""
from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # institution, receiver, admin
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
