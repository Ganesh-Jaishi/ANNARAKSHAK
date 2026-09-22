"""
Receiver model — unified receiver for NGOs, shelters, food banks,
community kitchens, animal organizations, and recovery facilities.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, func
from app.database import Base


class Receiver(Base):
    __tablename__ = "receivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # ngo, shelter, food_bank, community_kitchen, animal_org, recovery_facility
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    categories_accepted = Column(Text, default="[]")  # JSON array: ["cooked_meal", "raw_vegetables", "bread", "dairy"]
    capacity_kg = Column(Float, default=100)
    current_demand_kg = Column(Float, default=0)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
