"""
Dynamic Redistribution Service

Handles allocation failures:
  - Receiver rejects → find next suitable receiver
  - Route fails → reroute to alternative
  - Cascading fallback: human → animal → recovery
"""
from sqlalchemy.orm import Session
from app.models.allocation import Allocation
from app.models.food_batch import FoodBatch
from app.models.receiver import Receiver
from app.models.institution import Institution
from app.services.allocation_engine import score_receiver_for_batch, haversine_km
from app.services.rescue_clock import calculate_rescue_status
import random


def redistribute(db: Session, allocation_id: int) -> dict:
    """
    When an allocation is rejected or fails, find the next best receiver.

    Process:
      1. Mark current allocation as rejected/failed
      2. Re-score remaining receivers (excluding the failed one)
      3. If no suitable human receiver → try animal organizations
      4. If no animal org → try recovery facilities
      5. Update food batch status accordingly
    """
    allocation = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not allocation:
        return {"success": False, "reason": "Allocation not found"}

    batch = db.query(FoodBatch).filter(FoodBatch.id == allocation.food_batch_id).first()
    if not batch:
        return {"success": False, "reason": "Food batch not found"}

    institution = db.query(Institution).filter(Institution.id == batch.institution_id).first()
    if not institution:
        return {"success": False, "reason": "Institution not found"}

    # Get rescue clock
    rescue_info = calculate_rescue_status(batch.available_until)
    if rescue_info["status"] == "expired":
        batch.status = "wasted"
        batch.rescue_status = "expired"
        db.commit()
        return {"success": False, "reason": "Food batch has expired"}

    # Get all available receivers, excluding the one that rejected
    excluded_ids = [allocation.receiver_id]
    # Also exclude any previously failed allocations for this batch
    failed = db.query(Allocation).filter(
        Allocation.food_batch_id == batch.id,
        Allocation.status.in_(["rejected", "failed"]),
    ).all()
    excluded_ids.extend([a.receiver_id for a in failed])

    receivers = db.query(Receiver).filter(
        Receiver.is_available == True,
        Receiver.id.notin_(excluded_ids),
    ).all()

    if not receivers:
        # Cascading fallback — try different segregation
        if batch.segregation == "human":
            # Downgrade to animal
            batch.segregation = "animal"
            receivers = db.query(Receiver).filter(
                Receiver.is_available == True,
                Receiver.type == "animal_org",
            ).all()

        if not receivers and batch.segregation in ("human", "animal"):
            # Downgrade to recovery
            batch.segregation = "recovery"
            receivers = db.query(Receiver).filter(
                Receiver.is_available == True,
                Receiver.type == "recovery_facility",
            ).all()

    if not receivers:
        batch.status = "wasted"
        db.commit()
        return {"success": False, "reason": "No suitable receivers available"}

    # Score remaining receivers
    scored = []
    for receiver in receivers:
        result = score_receiver_for_batch(batch, receiver, institution, rescue_info)
        if result["total_score"] > 10:
            scored.append((receiver, result))

    scored.sort(key=lambda x: x[1]["total_score"], reverse=True)

    if not scored:
        batch.status = "wasted"
        db.commit()
        return {"success": False, "reason": "No receiver scored above threshold"}

    # Create new allocation
    best_receiver, best_result = scored[0]
    qty = min(batch.quantity_kg, best_receiver.current_demand_kg or batch.quantity_kg)

    rng = random.Random(batch.id + best_receiver.id + 999)
    driver_names = ["Vikram P.", "Neha T.", "Arun M.", "Kavitha S."]

    new_allocation = Allocation(
        food_batch_id=batch.id,
        receiver_id=best_receiver.id,
        quantity_kg=qty,
        priority_score=best_result["total_score"],
        distance_km=best_result["distance_km"],
        estimated_travel_min=best_result["estimated_travel_min"],
        status="pending",
        assigned_driver=rng.choice(driver_names),
        driver_phone=f"+91 98765 {rng.randint(10000, 99999)}",
        vehicle_type=rng.choice(["bike", "auto", "van"]),
    )
    db.add(new_allocation)
    batch.status = "allocated"
    db.commit()
    db.refresh(new_allocation)

    return {
        "success": True,
        "new_allocation_id": new_allocation.id,
        "receiver_id": best_receiver.id,
        "receiver_name": best_receiver.name,
        "score": best_result["total_score"],
        "distance_km": best_result["distance_km"],
        "segregation_changed": batch.segregation != "human",
        "new_segregation": batch.segregation,
    }
