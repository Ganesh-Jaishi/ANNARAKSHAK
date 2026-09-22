"""
Institution API — profile CRUD and stats.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.institution import Institution
from app.models.food_batch import FoodBatch
from app.models.allocation import Allocation
from app.models.impact import ImpactRecord
from app.schemas.schemas import InstitutionCreate, InstitutionOut
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/institutions", tags=["Institutions"])


@router.post("", response_model=InstitutionOut)
def create_institution(
    data: InstitutionCreate,
    user: User = Depends(require_role("institution")),
    db: Session = Depends(get_db),
):
    institution = Institution(user_id=user.id, **data.model_dump())
    db.add(institution)
    db.commit()
    db.refresh(institution)
    return institution


@router.get("/me", response_model=InstitutionOut)
def get_my_institution(
    user: User = Depends(require_role("institution")),
    db: Session = Depends(get_db),
):
    inst = db.query(Institution).filter(Institution.user_id == user.id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution profile not found. Create one first.")
    return inst


@router.get("/{institution_id}", response_model=InstitutionOut)
def get_institution(institution_id: int, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst


@router.put("/{institution_id}", response_model=InstitutionOut)
def update_institution(
    institution_id: int,
    data: InstitutionCreate,
    user: User = Depends(require_role("institution", "admin")),
    db: Session = Depends(get_db),
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    for key, val in data.model_dump().items():
        setattr(inst, key, val)
    db.commit()
    db.refresh(inst)
    return inst


@router.get("/{institution_id}/stats")
def get_institution_stats(institution_id: int, db: Session = Depends(get_db)):
    batches = db.query(FoodBatch).filter(FoodBatch.institution_id == institution_id).all()
    impacts = db.query(ImpactRecord).filter(ImpactRecord.institution_id == institution_id).all()

    total_registered = sum(b.quantity_kg for b in batches)
    total_rescued = sum(i.quantity_rescued_kg for i in impacts)
    total_wasted = sum(b.quantity_kg for b in batches if b.status == "wasted")
    total_animal = sum(i.recovery_kg for i in impacts if i.recovery_kg > 0 and i.biogas_output_kwh == 0)
    total_recovery = sum(i.recovery_kg for i in impacts if i.biogas_output_kwh > 0)

    return {
        "institution_id": institution_id,
        "total_batches": len(batches),
        "total_registered_kg": round(total_registered, 1),
        "total_rescued_kg": round(total_rescued, 1),
        "total_wasted_kg": round(total_wasted, 1),
        "total_animal_recovery_kg": round(total_animal, 1),
        "total_biogas_recovery_kg": round(total_recovery, 1),
        "rescue_rate": round(total_rescued / total_registered * 100, 1) if total_registered > 0 else 0,
        "total_beneficiaries": sum(i.beneficiaries_served for i in impacts),
        "total_carbon_saved_kg": round(sum(i.carbon_saved_kg for i in impacts), 1),
    }
