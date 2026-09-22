"""
Allocation model — AI-generated assignment of food batches to receivers.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from app.database import Base


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    food_batch_id = Column(Integer, ForeignKey("food_batches.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("receivers.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    priority_score = Column(Float, default=0)      # Higher = more urgent
    distance_km = Column(Float, nullable=True)
    estimated_travel_min = Column(Float, nullable=True)

    # Status flow: pending → accepted → in_transit → delivered  OR  pending → rejected → reallocated
    status = Column(String(50), default="pending")

    # Driver assignment
    assigned_driver = Column(String(255), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    vehicle_type = Column(String(50), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
