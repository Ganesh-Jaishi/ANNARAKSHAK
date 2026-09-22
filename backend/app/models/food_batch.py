"""
FoodBatch model — represents a registered surplus food batch
with AI assessment, segregation, and rescue clock tracking.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from app.database import Base


class FoodBatch(Base):
    __tablename__ = "food_batches"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)

    # Food details
    food_type = Column(String(100), nullable=False)  # rice, vegetables, bread, dairy, cooked_meal, fruits, etc.
    description = Column(String(500), nullable=True)
    quantity_kg = Column(Float, nullable=False)
    preparation_time = Column(DateTime, nullable=False)
    available_until = Column(DateTime, nullable=False)

    # Image & AI assessment
    image_path = Column(String(500), nullable=True)
    ai_category = Column(String(100), nullable=True)       # AI-detected food category
    ai_condition = Column(String(50), nullable=True)        # fresh, acceptable, deteriorating, unsuitable
    ai_confidence = Column(Float, nullable=True)            # 0.0 - 1.0
    ai_deterioration_risk = Column(String(20), nullable=True)  # low, medium, high
    ai_estimated_safe_hours = Column(Float, nullable=True)

    # Institution-side segregation
    segregation = Column(String(50), nullable=True)  # human, animal, recovery

    # Rescue clock
    rescue_status = Column(String(20), default="safe")  # safe, urgent, critical, expired
    rescue_clock_start = Column(DateTime, server_default=func.now())

    # Status
    status = Column(String(20), default="registered")  # registered, assessed, segregated, allocated, completed, wasted

    created_at = Column(DateTime, server_default=func.now())
