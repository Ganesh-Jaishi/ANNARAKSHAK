"""
Models package — import all models so SQLAlchemy discovers them.
"""
from app.models.user import User
from app.models.institution import Institution
from app.models.receiver import Receiver
from app.models.food_batch import FoodBatch
from app.models.allocation import Allocation
from app.models.delivery import Delivery
from app.models.impact import ImpactRecord, WasteRecord

__all__ = [
    "User",
    "Institution",
    "Receiver",
    "FoodBatch",
    "Allocation",
    "Delivery",
    "ImpactRecord",
    "WasteRecord",
]
