"""
Central Allocation Engine

Decides WHO gets HOW MUCH food, WHERE it goes, and BY WHEN.

Scoring factors:
  1. Food suitability — does receiver accept this food type?
  2. Condition score — fresher food → human-suitable receivers first
  3. Remaining rescue time — urgent batches get higher priority
  4. Demand urgency — receivers with higher unmet demand score higher
  5. Distance — closer receivers preferred
  6. Capacity — don't over-allocate
  7. Quantity match — prefer receivers whose demand matches available quantity
"""
import json
import math
from typing import List
from sqlalchemy.orm import Session
from app.models.food_batch import FoodBatch
from app.models.receiver import Receiver
from app.models.allocation import Allocation
from app.models.institution import Institution
from app.services.rescue_clock import calculate_rescue_status


# Weight configuration for multi-factor scoring
WEIGHTS = {
    "suitability": 0.20,
    "condition": 0.15,
    "rescue_urgency": 0.20,
    "demand": 0.15,
    "distance": 0.20,
    "quantity_match": 0.10,
}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in km."""
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def score_receiver_for_batch(
    batch: FoodBatch,
    receiver: Receiver,
    institution: Institution,
    rescue_info: dict,
) -> dict:
    """
    Score a single receiver for a food batch.
    Returns scoring breakdown and total score.
    """
    scores = {}

    # 1. Suitability — does receiver accept this food type and segregation?
    try:
        accepted = json.loads(receiver.categories_accepted) if receiver.categories_accepted else []
    except (json.JSONDecodeError, TypeError):
        accepted = []

    suitability = 0.5  # default
    if not accepted or batch.food_type.lower() in [c.lower() for c in accepted]:
        suitability = 1.0

    # Segregation matching
    if batch.segregation == "human" and receiver.type in ("ngo", "shelter", "food_bank", "community_kitchen"):
        suitability = min(1.0, suitability + 0.3)
    elif batch.segregation == "animal" and receiver.type == "animal_org":
        suitability = 1.0
    elif batch.segregation == "recovery" and receiver.type == "recovery_facility":
        suitability = 1.0
    elif batch.segregation == "human" and receiver.type in ("animal_org", "recovery_facility"):
        suitability = 0.1  # Poor match
    elif batch.segregation == "animal" and receiver.type != "animal_org":
        suitability = 0.1

    scores["suitability"] = suitability

    # 2. Condition — fresher food scores higher for human receivers
    condition_map = {"fresh": 1.0, "acceptable": 0.75, "deteriorating": 0.4, "unsuitable": 0.1}
    scores["condition"] = condition_map.get(batch.ai_condition, 0.5)

    # 3. Rescue urgency — from rescue clock
    scores["rescue_urgency"] = rescue_info["priority_score"] / 100

    # 4. Demand urgency — how much does this receiver need food?
    if receiver.capacity_kg > 0:
        demand_ratio = receiver.current_demand_kg / receiver.capacity_kg
    else:
        demand_ratio = 0.5
    scores["demand"] = min(1.0, demand_ratio)

    # 5. Distance — closer is better (inverse, capped at 50km)
    dist = haversine_km(institution.lat, institution.lng, receiver.lat, receiver.lng)
    scores["distance"] = max(0, 1 - (dist / 50))  # 0km = 1.0, 50km+ = 0.0

    # 6. Quantity match — how well does batch quantity match receiver demand?
    if receiver.current_demand_kg > 0:
        q_ratio = min(batch.quantity_kg, receiver.current_demand_kg) / max(batch.quantity_kg, receiver.current_demand_kg)
    else:
        q_ratio = 0.3
    scores["quantity_match"] = q_ratio

    # Weighted total
    total = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)

    return {
        "total_score": round(total * 100, 1),
        "scores": {k: round(v, 2) for k, v in scores.items()},
        "distance_km": round(dist, 1),
        "estimated_travel_min": round(dist * 2.5, 1),  # ~24 km/h avg urban speed
    }


def run_allocation(db: Session, batch_ids: List[int] = None) -> List[dict]:
    """
    Run the central allocation engine.

    If batch_ids is provided, allocate only those batches.
    Otherwise, allocate all unallocated, segregated batches.
    """
    # Get batches to allocate
    query = db.query(FoodBatch).filter(
        FoodBatch.status.in_(["segregated", "assessed", "registered"]),
        FoodBatch.segregation.isnot(None),
    )
    if batch_ids:
        query = query.filter(FoodBatch.id.in_(batch_ids))
    batches = query.all()

    # Get available receivers
    receivers = db.query(Receiver).filter(Receiver.is_available == True).all()

    if not batches or not receivers:
        return []

    allocations_created = []

    for batch in batches:
        # Get institution
        institution = db.query(Institution).filter(Institution.id == batch.institution_id).first()
        if not institution:
            continue

        # Calculate rescue clock
        rescue_info = calculate_rescue_status(batch.available_until)
        if rescue_info["status"] == "expired":
            batch.rescue_status = "expired"
            batch.status = "wasted"
            continue

        # Update rescue status
        batch.rescue_status = rescue_info["status"]

        # Score all receivers
        scored = []
        for receiver in receivers:
            result = score_receiver_for_batch(batch, receiver, institution, rescue_info)
            if result["total_score"] > 15:  # Minimum threshold
                scored.append((receiver, result))

        # Sort by score descending
        scored.sort(key=lambda x: x[1]["total_score"], reverse=True)

        if not scored:
            continue

        # Assign to top receiver
        best_receiver, best_result = scored[0]

        # Determine quantity to allocate
        qty = min(batch.quantity_kg, best_receiver.current_demand_kg or batch.quantity_kg)

        # Simulate gig driver assignment
        driver_names = ["Rajesh K.", "Amit S.", "Priya M.", "Suresh V.", "Deepa R.", "Mohammed A."]
        vehicles = ["bike", "auto", "van"]
        import random
        rng = random.Random(batch.id + best_receiver.id)
        driver = rng.choice(driver_names)
        vehicle = rng.choice(vehicles)

        allocation = Allocation(
            food_batch_id=batch.id,
            receiver_id=best_receiver.id,
            quantity_kg=qty,
            priority_score=best_result["total_score"],
            distance_km=best_result["distance_km"],
            estimated_travel_min=best_result["estimated_travel_min"],
            status="pending",
            assigned_driver=driver,
            driver_phone=f"+91 98765 {rng.randint(10000, 99999)}",
            vehicle_type=vehicle,
        )
        db.add(allocation)

        batch.status = "allocated"

        allocations_created.append({
            "batch_id": batch.id,
            "receiver_id": best_receiver.id,
            "receiver_name": best_receiver.name,
            "quantity_kg": qty,
            "score": best_result["total_score"],
            "distance_km": best_result["distance_km"],
            "driver": driver,
            "vehicle": vehicle,
            "scoring_breakdown": best_result["scores"],
        })

    db.commit()
    return allocations_created
