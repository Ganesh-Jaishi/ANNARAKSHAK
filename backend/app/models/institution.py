"""
Institution model — food donors (restaurants, canteens, factories, hotels, etc.)
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from app.database import Base


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # restaurant, canteen, factory, hotel, caterer, hospital
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    fssai_license = Column(String(100), nullable=True)
    capacity_kg_daily = Column(Float, default=0)
    created_at = Column(DateTime, server_default=func.now())
