"""
Impact Tracker Service

Automatically generates Digital Rescue Records and ESG impact metrics
after every completed rescue delivery.
"""
from sqlalchemy.orm import Session
from app.models.impact import ImpactRecord
from app.models.allocation import Allocation
from app.models.food_batch import FoodBatch
from app.config import settings


def calculate_impact(quantity_kg: float, food_type: str, segregation: str) -> dict:
    """
    Calculate environmental and social impact of a food rescue.
    """
    # Beneficiaries (only for human-suitable food)
    if segregation == "human":
        beneficiaries = int(quantity_kg * settings.MEALS_PER_KG)
    else:
        beneficiaries = 0

    # Recovery metrics
    recovery_kg = 0
    biogas_kwh = 0
    compost_kg = 0

    if segregation == "animal":
        recovery_kg = quantity_kg * 0.9  # 90% usable as feed
    elif segregation == "recovery":
        recovery_kg = quantity_kg
        biogas_kwh = quantity_kg * 0.8   # ~0.8 kWh per kg via anaerobic digestion
        compost_kg = quantity_kg * 0.3   # ~30% becomes compost

    # Environmental impact
    carbon_saved = quantity_kg * settings.CO2_SAVED_PER_KG
    water_saved = quantity_kg * settings.WATER_SAVED_PER_KG
    energy_saved = quantity_kg * settings.ENERGY_SAVED_PER_KG

    return {
        "beneficiaries_served": beneficiaries,
        "recovery_kg": round(recovery_kg, 1),
        "biogas_output_kwh": round(biogas_kwh, 1),
        "compost_output_kg": round(compost_kg, 1),
        "carbon_saved_kg": round(carbon_saved, 1),
        "water_saved_liters": round(water_saved, 1),
        "energy_saved_kwh": round(energy_saved, 1),
    }


def create_impact_record(db: Session, allocation_id: int) -> ImpactRecord:
    """
    Create an impact record after a delivery is confirmed.
    This is the Digital Rescue Record + ESG data.
    """
    allocation = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not allocation:
        return None

    batch = db.query(FoodBatch).filter(FoodBatch.id == allocation.food_batch_id).first()
    if not batch:
        return None

    impact = calculate_impact(
        quantity_kg=allocation.quantity_kg,
        food_type=batch.food_type,
        segregation=batch.segregation or "human",
    )

    record = ImpactRecord(
        allocation_id=allocation_id,
        institution_id=batch.institution_id,
        receiver_id=allocation.receiver_id,
        quantity_rescued_kg=allocation.quantity_kg,
        food_type=batch.food_type,
        beneficiaries_served=impact["beneficiaries_served"],
        recovery_kg=impact["recovery_kg"],
        biogas_output_kwh=impact["biogas_output_kwh"],
        compost_output_kg=impact["compost_output_kg"],
        carbon_saved_kg=impact["carbon_saved_kg"],
        water_saved_liters=impact["water_saved_liters"],
        energy_saved_kwh=impact["energy_saved_kwh"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_esg_summary(db: Session, institution_id: int = None) -> dict:
    """
    Generate aggregated ESG report.
    Optionally filtered by institution.
    """
    query = db.query(ImpactRecord)
    if institution_id:
        query = query.filter(ImpactRecord.institution_id == institution_id)

    records = query.all()

    if not records:
        return {
            "total_rescued_kg": 0, "total_beneficiaries": 0,
            "total_carbon_saved_kg": 0, "total_water_saved_liters": 0,
            "total_recovery_kg": 0, "total_biogas_kwh": 0,
            "total_compost_kg": 0, "rescue_count": 0,
        }

    return {
        "total_rescued_kg": round(sum(r.quantity_rescued_kg for r in records), 1),
        "total_beneficiaries": sum(r.beneficiaries_served for r in records),
        "total_carbon_saved_kg": round(sum(r.carbon_saved_kg for r in records), 1),
        "total_water_saved_liters": round(sum(r.water_saved_liters for r in records), 1),
        "total_energy_saved_kwh": round(sum(r.energy_saved_kwh for r in records), 1),
        "total_recovery_kg": round(sum(r.recovery_kg for r in records), 1),
        "total_biogas_kwh": round(sum(r.biogas_output_kwh for r in records), 1),
        "total_compost_kg": round(sum(r.compost_output_kg for r in records), 1),
        "rescue_count": len(records),
    }
