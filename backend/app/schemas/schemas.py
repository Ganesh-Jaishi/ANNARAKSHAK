"""
Pydantic schemas for all API request/response models.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ─── Auth ──────────────────────────────────────────────
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # institution, receiver, admin
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    class Config:
        from_attributes = True


# ─── Institution ───────────────────────────────────────
class InstitutionCreate(BaseModel):
    name: str
    type: str
    address: str
    city: str
    state: str
    district: Optional[str] = None
    lat: float
    lng: float
    fssai_license: Optional[str] = None
    capacity_kg_daily: Optional[float] = 0

class InstitutionOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: str
    address: str
    city: str
    state: str
    district: Optional[str] = None
    lat: float
    lng: float
    fssai_license: Optional[str] = None
    capacity_kg_daily: float
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# ─── Receiver ──────────────────────────────────────────
class ReceiverCreate(BaseModel):
    name: str
    type: str  # ngo, shelter, food_bank, community_kitchen, animal_org, recovery_facility
    address: str
    city: str
    state: str
    district: Optional[str] = None
    lat: float
    lng: float
    categories_accepted: Optional[List[str]] = []
    capacity_kg: Optional[float] = 100
    current_demand_kg: Optional[float] = 0
    is_available: Optional[bool] = True

class ReceiverOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: str
    address: str
    city: str
    state: str
    district: Optional[str] = None
    lat: float
    lng: float
    categories_accepted: Optional[str] = "[]"
    capacity_kg: float
    current_demand_kg: float
    is_available: bool
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ReceiverUpdate(BaseModel):
    current_demand_kg: Optional[float] = None
    is_available: Optional[bool] = None
    capacity_kg: Optional[float] = None
    categories_accepted: Optional[List[str]] = None


# ─── Food Batch ────────────────────────────────────────
class FoodBatchCreate(BaseModel):
    food_type: str
    description: Optional[str] = None
    quantity_kg: float
    preparation_time: datetime
    available_until: datetime

class FoodBatchOut(BaseModel):
    id: int
    institution_id: int
    food_type: str
    description: Optional[str] = None
    quantity_kg: float
    preparation_time: Optional[datetime] = None
    available_until: Optional[datetime] = None
    image_path: Optional[str] = None
    ai_category: Optional[str] = None
    ai_condition: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_deterioration_risk: Optional[str] = None
    ai_estimated_safe_hours: Optional[float] = None
    segregation: Optional[str] = None
    rescue_status: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class SegregationUpdate(BaseModel):
    segregation: str  # human, animal, recovery


# ─── Allocation ────────────────────────────────────────
class AllocationOut(BaseModel):
    id: int
    food_batch_id: int
    receiver_id: int
    quantity_kg: float
    priority_score: float
    distance_km: Optional[float] = None
    estimated_travel_min: Optional[float] = None
    status: str
    assigned_driver: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields for display
    institution_name: Optional[str] = None
    receiver_name: Optional[str] = None
    food_type: Optional[str] = None
    rescue_status: Optional[str] = None
    class Config:
        from_attributes = True


# ─── Delivery ──────────────────────────────────────────
class DeliveryOut(BaseModel):
    id: int
    allocation_id: int
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    pickup_time: Optional[datetime] = None
    delivery_time: Optional[datetime] = None
    estimated_arrival: Optional[datetime] = None
    distance_km: Optional[float] = None
    status: str
    confirmed_by_institution: bool
    confirmed_by_receiver: bool
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# ─── Impact ────────────────────────────────────────────
class ImpactRecordOut(BaseModel):
    id: int
    allocation_id: int
    institution_id: int
    receiver_id: int
    quantity_rescued_kg: float
    food_type: Optional[str] = None
    beneficiaries_served: int
    recovery_kg: float
    biogas_output_kwh: float
    compost_output_kg: float
    carbon_saved_kg: float
    water_saved_liters: float
    energy_saved_kwh: float
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class WasteRecordCreate(BaseModel):
    overproduction_kg: Optional[float] = 0
    raw_material_loss_kg: Optional[float] = 0
    spoilage_kg: Optional[float] = 0
    storage_loss_kg: Optional[float] = 0
    machine_downtime_hours: Optional[float] = 0
    excess_energy_kwh: Optional[float] = 0
    period_start: datetime
    period_end: datetime

class WasteRecordOut(BaseModel):
    id: int
    institution_id: int
    overproduction_kg: float
    raw_material_loss_kg: float
    spoilage_kg: float
    storage_loss_kg: float
    machine_downtime_hours: float
    excess_energy_kwh: float
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# ─── Admin Dashboard ───────────────────────────────────
class DashboardStats(BaseModel):
    total_institutions: int
    total_receivers: int
    total_food_batches: int
    total_rescued_kg: float
    total_wasted_kg: float
    total_animal_recovery_kg: float
    total_biogas_recovery_kg: float
    total_compost_recovery_kg: float
    total_carbon_saved_kg: float
    total_water_saved_liters: float
    total_beneficiaries: int
    active_rescues: int
    rescue_rate_percent: float

class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    type: str  # surplus, demand
    intensity: float
    label: str
