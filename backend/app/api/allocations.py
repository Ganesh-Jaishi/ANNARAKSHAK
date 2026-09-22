"""
Allocations API — run engine, accept/reject, confirm handover/delivery.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.allocation import Allocation
from app.models.food_batch import FoodBatch
from app.models.delivery import Delivery
from app.models.institution import Institution
from app.models.receiver import Receiver
from app.schemas.schemas import AllocationOut
from app.utils.auth import get_current_user, require_role
from app.services.allocation_engine import run_allocation
from app.services.redistribution import redistribute
from app.services.impact_tracker import create_impact_record
from app.services.route_optimizer import optimize_route
from app.services.rescue_clock import calculate_rescue_status
import json

router = APIRouter(prefix="/api/allocations", tags=["Allocations"])


@router.post("/run")
def trigger_allocation(
    user: User = Depends(require_role("institution", "admin")),
    db: Session = Depends(get_db),
):
    """Run the central allocation engine for unallocated food batches."""
    results = run_allocation(db)
    return {"allocations_created": len(results), "details": results}


@router.get("")
def list_allocations(
    status: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Allocation)

    if user.role == "receiver":
        receiver = db.query(Receiver).filter(Receiver.user_id == user.id).first()
        if receiver:
            query = query.filter(Allocation.receiver_id == receiver.id)
    elif user.role == "institution":
        inst = db.query(Institution).filter(Institution.user_id == user.id).first()
        if inst:
            batch_ids = [b.id for b in db.query(FoodBatch).filter(FoodBatch.institution_id == inst.id).all()]
            query = query.filter(Allocation.food_batch_id.in_(batch_ids))

    if status:
        query = query.filter(Allocation.status == status)

    allocations = query.order_by(Allocation.created_at.desc()).all()

    # Enrich with names
    result = []
    for a in allocations:
        batch = db.query(FoodBatch).filter(FoodBatch.id == a.food_batch_id).first()
        receiver = db.query(Receiver).filter(Receiver.id == a.receiver_id).first()
        inst = db.query(Institution).filter(Institution.id == batch.institution_id).first() if batch else None

        rc = calculate_rescue_status(batch.available_until) if batch and batch.available_until else {}

        result.append({
            "id": a.id,
            "food_batch_id": a.food_batch_id,
            "receiver_id": a.receiver_id,
            "quantity_kg": a.quantity_kg,
            "priority_score": a.priority_score,
            "distance_km": a.distance_km,
            "estimated_travel_min": a.estimated_travel_min,
            "status": a.status,
            "assigned_driver": a.assigned_driver,
            "driver_phone": a.driver_phone,
            "vehicle_type": a.vehicle_type,
            "created_at": str(a.created_at) if a.created_at else None,
            "institution_name": inst.name if inst else None,
            "receiver_name": receiver.name if receiver else None,
            "food_type": batch.food_type if batch else None,
            "description": batch.description if batch else None,
            "image_path": batch.image_path if (batch and batch.image_path) else (f"/uploads/{batch.food_type}.jpg" if batch else None),
            "ai_condition": batch.ai_condition if batch else None,
            "ai_confidence": batch.ai_confidence if batch else None,
            "segregation": batch.segregation if batch else None,
            "rescue_status": rc.get("status", "unknown"),
            "rescue_remaining_min": rc.get("remaining_minutes", 0),
            "rescue_color": rc.get("color", "#6b7280"),
        })

    return result


@router.put("/{allocation_id}/accept")
def accept_allocation(
    allocation_id: int,
    user: User = Depends(require_role("receiver")),
    db: Session = Depends(get_db),
):
    allocation = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")

    allocation.status = "accepted"

    # Create delivery record with route
    batch = db.query(FoodBatch).filter(FoodBatch.id == allocation.food_batch_id).first()
    inst = db.query(Institution).filter(Institution.id == batch.institution_id).first() if batch else None
    receiver = db.query(Receiver).filter(Receiver.id == allocation.receiver_id).first()

    route_data = {}
    if inst and receiver:
        route_data = optimize_route(
            pickup=(inst.lat, inst.lng),
            delivery=(receiver.lat, receiver.lng),
        )

    delivery = Delivery(
        allocation_id=allocation_id,
        driver_name=allocation.assigned_driver,
        driver_phone=allocation.driver_phone,
        vehicle_type=allocation.vehicle_type,
        route_polyline=json.dumps(route_data.get("route_polyline", [])),
        distance_km=route_data.get("total_distance_km", allocation.distance_km),
        status="assigned",
    )
    db.add(delivery)
    db.commit()
    db.refresh(allocation)
    return {"message": "Allocation accepted", "delivery_id": delivery.id}


@router.put("/{allocation_id}/reject")
def reject_allocation(
    allocation_id: int,
    user: User = Depends(require_role("receiver")),
    db: Session = Depends(get_db),
):
    allocation = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")

    allocation.status = "rejected"
    db.commit()

    # Trigger dynamic redistribution
    result = redistribute(db, allocation_id)
    return {"message": "Allocation rejected, redistribution triggered", "redistribution": result}


@router.put("/{allocation_id}/confirm-handover")
def confirm_handover(
    allocation_id: int,
    user: User = Depends(require_role("institution")),
    db: Session = Depends(get_db),
):
    allocation = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")

    allocation.status = "in_transit"
    delivery = db.query(Delivery).filter(Delivery.allocation_id == allocation_id).first()
    if delivery:
        delivery.confirmed_by_institution = True
        delivery.pickup_time = datetime.now(timezone.utc)
        delivery.status = "picked_up"

    db.commit()
    return {"message": "Handover confirmed, food is in transit"}


@router.put("/{allocation_id}/confirm-delivery")
def confirm_delivery(
    allocation_id: int,
    user: User = Depends(require_role("receiver")),
    db: Session = Depends(get_db),
):
    allocation = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")

    allocation.status = "delivered"
    delivery = db.query(Delivery).filter(Delivery.allocation_id == allocation_id).first()
    if delivery:
        delivery.confirmed_by_receiver = True
        delivery.delivery_time = datetime.now(timezone.utc)
        delivery.status = "delivered"

    # Update food batch
    batch = db.query(FoodBatch).filter(FoodBatch.id == allocation.food_batch_id).first()
    if batch:
        batch.status = "completed"

    # Generate impact record
    impact = create_impact_record(db, allocation_id)

    db.commit()
    return {
        "message": "Delivery confirmed, impact record created",
        "impact": {
            "quantity_rescued_kg": impact.quantity_rescued_kg if impact else 0,
            "beneficiaries_served": impact.beneficiaries_served if impact else 0,
            "carbon_saved_kg": impact.carbon_saved_kg if impact else 0,
        },
    }
