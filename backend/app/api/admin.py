"""
Admin / Ministry Dashboard API
Centralized India-wide view: national → state → district → institution
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.institution import Institution
from app.models.receiver import Receiver
from app.models.food_batch import FoodBatch
from app.models.allocation import Allocation
from app.models.impact import ImpactRecord, WasteRecord
from app.utils.auth import require_role
from app.services.rescue_clock import calculate_rescue_status

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard")
def get_dashboard(
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    institutions = db.query(Institution).all()
    receivers = db.query(Receiver).all()
    batches = db.query(FoodBatch).all()
    impacts = db.query(ImpactRecord).all()

    total_registered = sum(b.quantity_kg for b in batches)
    total_rescued = sum(i.quantity_rescued_kg for i in impacts)
    total_wasted = sum(b.quantity_kg for b in batches if b.status == "wasted")
    active_rescues = len([b for b in batches if b.status in ("assessed", "segregated", "allocated")])

    return {
        "total_institutions": len(institutions),
        "total_receivers": len(receivers),
        "total_food_batches": len(batches),
        "total_rescued_kg": round(total_rescued, 1),
        "total_wasted_kg": round(total_wasted, 1),
        "total_animal_recovery_kg": round(sum(i.recovery_kg for i in impacts if i.biogas_output_kwh == 0 and i.recovery_kg > 0), 1),
        "total_biogas_recovery_kg": round(sum(i.recovery_kg for i in impacts if i.biogas_output_kwh > 0), 1),
        "total_compost_kg": round(sum(i.compost_output_kg for i in impacts), 1),
        "total_carbon_saved_kg": round(sum(i.carbon_saved_kg for i in impacts), 1),
        "total_water_saved_liters": round(sum(i.water_saved_liters for i in impacts), 1),
        "total_beneficiaries": sum(i.beneficiaries_served for i in impacts),
        "active_rescues": active_rescues,
        "rescue_rate_percent": round(total_rescued / total_registered * 100, 1) if total_registered > 0 else 0,
        "states_active": list(set(i.state for i in institutions)),
    }


@router.get("/states/{state}")
def get_state_data(
    state: str,
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    institutions = db.query(Institution).filter(Institution.state == state).all()
    inst_ids = [i.id for i in institutions]
    receivers = db.query(Receiver).filter(Receiver.state == state).all()
    batches = db.query(FoodBatch).filter(FoodBatch.institution_id.in_(inst_ids)).all()
    impacts = db.query(ImpactRecord).filter(ImpactRecord.institution_id.in_(inst_ids)).all()

    return {
        "state": state,
        "institutions": len(institutions),
        "receivers": len(receivers),
        "total_rescued_kg": round(sum(i.quantity_rescued_kg for i in impacts), 1),
        "total_wasted_kg": round(sum(b.quantity_kg for b in batches if b.status == "wasted"), 1),
        "districts": list(set(i.district for i in institutions if i.district)),
        "institution_details": [
            {"id": i.id, "name": i.name, "type": i.type, "city": i.city, "district": i.district}
            for i in institutions
        ],
    }


@router.get("/heatmap")
def get_heatmap(
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    points = []

    # Surplus points (institutions with active batches)
    institutions = db.query(Institution).all()
    for inst in institutions:
        active_qty = sum(
            b.quantity_kg for b in db.query(FoodBatch).filter(
                FoodBatch.institution_id == inst.id,
                FoodBatch.status.in_(["registered", "assessed", "segregated"]),
            ).all()
        )
        if active_qty > 0:
            points.append({
                "lat": inst.lat, "lng": inst.lng,
                "type": "surplus", "intensity": min(1.0, active_qty / 200),
                "label": f"{inst.name}: {active_qty:.0f} kg surplus",
            })

    # Demand points (receivers with demand)
    receivers = db.query(Receiver).filter(Receiver.is_available == True).all()
    for recv in receivers:
        if recv.current_demand_kg > 0:
            points.append({
                "lat": recv.lat, "lng": recv.lng,
                "type": "demand", "intensity": min(1.0, recv.current_demand_kg / 200),
                "label": f"{recv.name}: {recv.current_demand_kg:.0f} kg demand",
            })

    return {"points": points, "total_points": len(points)}


@router.get("/esg-report")
def get_esg_report(
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    from app.services.impact_tracker import get_esg_summary
    return get_esg_summary(db)


@router.get("/waste-hotspots")
def get_waste_hotspots(
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    institutions = db.query(Institution).all()
    hotspots = []
    for inst in institutions:
        wasted = sum(
            b.quantity_kg for b in db.query(FoodBatch).filter(
                FoodBatch.institution_id == inst.id,
                FoodBatch.status == "wasted",
            ).all()
        )
        total = sum(
            b.quantity_kg for b in db.query(FoodBatch).filter(
                FoodBatch.institution_id == inst.id
            ).all()
        )
        if total > 0:
            hotspots.append({
                "institution_id": inst.id,
                "name": inst.name,
                "city": inst.city,
                "state": inst.state,
                "lat": inst.lat,
                "lng": inst.lng,
                "total_kg": round(total, 1),
                "wasted_kg": round(wasted, 1),
                "waste_rate": round(wasted / total * 100, 1),
            })
    hotspots.sort(key=lambda x: x["waste_rate"], reverse=True)
    return {"hotspots": hotspots}


@router.get("/institutions")
def list_all_institutions(
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    institutions = db.query(Institution).all()
    users_by_id = {u.id: u for u in db.query(User).filter(User.role == "institution").all()}
    result = []
    for inst in institutions:
        u = users_by_id.get(inst.user_id)
        impacts = db.query(ImpactRecord).filter(ImpactRecord.institution_id == inst.id).all()
        batches = db.query(FoodBatch).filter(FoodBatch.institution_id == inst.id).all()
        total_reg = sum(b.quantity_kg for b in batches)
        total_rescued = sum(i.quantity_rescued_kg for i in impacts)
        result.append({
            "id": inst.id,
            "name": inst.name,
            "type": inst.type,
            "address": inst.address,
            "city": inst.city,
            "state": inst.state,
            "district": inst.district,
            "lat": inst.lat,
            "lng": inst.lng,
            "fssai_license": inst.fssai_license,
            "capacity_kg_daily": inst.capacity_kg_daily,
            "contact_person": u.full_name if u else "Operations Lead",
            "email": u.email if u else None,
            "phone": u.phone if u else None,
            "total_registered_kg": round(total_reg, 1),
            "total_rescued_kg": round(total_rescued, 1),
            "rescue_rate": round(total_rescued / total_reg * 100, 1) if total_reg > 0 else 0,
            "total_beneficiaries": sum(i.beneficiaries_served for i in impacts),
        })
    return result
