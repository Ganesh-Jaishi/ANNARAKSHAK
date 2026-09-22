"""
Delivery model — tracks pickup and delivery logistics.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, func
from app.database import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("allocations.id"), nullable=False)

    # Driver info
    driver_name = Column(String(255), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    vehicle_type = Column(String(50), nullable=True)  # bike, auto, van, truck

    # Timing
    pickup_time = Column(DateTime, nullable=True)
    delivery_time = Column(DateTime, nullable=True)
    estimated_arrival = Column(DateTime, nullable=True)

    # Route
    route_polyline = Column(Text, nullable=True)  # JSON array of [lat, lng]
    distance_km = Column(Float, nullable=True)

    # Status
    status = Column(String(50), default="assigned")  # assigned, picked_up, in_transit, delivered, failed

    # Confirmations
    confirmed_by_institution = Column(Boolean, default=False)
    confirmed_by_receiver = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now())
