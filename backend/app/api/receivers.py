"""
Receiver API — profile CRUD, demand/availability, history.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.receiver import Receiver
from app.models.allocation import Allocation
from app.models.food_batch import FoodBatch
from app.models.impact import ImpactRecord
from app.schemas.schemas import ReceiverCreate, ReceiverOut, ReceiverUpdate
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/receivers", tags=["Receivers"])


@router.post("", response_model=ReceiverOut)
def create_receiver(
    data: ReceiverCreate,
    user: User = Depends(require_role("receiver")),
    db: Session = Depends(get_db),
):
    receiver = Receiver(
        user_id=user.id,
        name=data.name,
        type=data.type,
        address=data.address,
        city=data.city,
        state=data.state,
        district=data.district,
        lat=data.lat,
        lng=data.lng,
        categories_accepted=json.dumps(data.categories_accepted or []),
        capacity_kg=data.capacity_kg or 100,
        current_demand_kg=data.current_demand_kg or 0,
        is_available=data.is_available if data.is_available is not None else True,
    )
    db.add(receiver)
    db.commit()
    db.refresh(receiver)
    return receiver


@router.get("/me", response_model=ReceiverOut)
def get_my_receiver(
    user: User = Depends(require_role("receiver")),
    db: Session = Depends(get_db),
):
    receiver = db.query(Receiver).filter(Receiver.user_id == user.id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver profile not found. Create one first.")
    return receiver


@router.get("/{receiver_id}", response_model=ReceiverOut)
def get_receiver(receiver_id: int, db: Session = Depends(get_db)):
    receiver = db.query(Receiver).filter(Receiver.id == receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    return receiver


@router.put("/{receiver_id}", response_model=ReceiverOut)
def update_receiver(
    receiver_id: int,
    data: ReceiverUpdate,
    user: User = Depends(require_role("receiver", "admin")),
    db: Session = Depends(get_db),
):
    receiver = db.query(Receiver).filter(Receiver.id == receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    if data.current_demand_kg is not None:
        receiver.current_demand_kg = data.current_demand_kg
    if data.is_available is not None:
        receiver.is_available = data.is_available
    if data.capacity_kg is not None:
        receiver.capacity_kg = data.capacity_kg
    if data.categories_accepted is not None:
        receiver.categories_accepted = json.dumps(data.categories_accepted)

    db.commit()
    db.refresh(receiver)
    return receiver


@router.get("/{receiver_id}/history")
def get_receiver_history(receiver_id: int, db: Session = Depends(get_db)):
    allocations = db.query(Allocation).filter(
        Allocation.receiver_id == receiver_id,
        Allocation.status == "delivered",
    ).all()

    history = []
    for a in allocations:
        batch = db.query(FoodBatch).filter(FoodBatch.id == a.food_batch_id).first()
        impact = db.query(ImpactRecord).filter(ImpactRecord.allocation_id == a.id).first()
        history.append({
            "allocation_id": a.id,
            "food_type": batch.food_type if batch else "unknown",
            "quantity_kg": a.quantity_kg,
            "delivered_at": a.updated_at,
            "beneficiaries": impact.beneficiaries_served if impact else 0,
            "carbon_saved_kg": impact.carbon_saved_kg if impact else 0,
        })
    return {"receiver_id": receiver_id, "deliveries": history, "total_count": len(history)}
