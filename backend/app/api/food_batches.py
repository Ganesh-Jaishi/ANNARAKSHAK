"""
Food Batches API — register surplus, image upload, AI assessment, segregation, rescue clock.
"""
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.institution import Institution
from app.models.food_batch import FoodBatch
from app.schemas.schemas import FoodBatchCreate, FoodBatchOut, SegregationUpdate
from app.utils.auth import get_current_user, require_role
from app.services.ai_assessment import assess_food_image
from app.services.rescue_clock import calculate_rescue_status
from app.config import settings

router = APIRouter(prefix="/api/food-batches", tags=["Food Batches"])


@router.post("", response_model=FoodBatchOut)
def create_food_batch(
    food_type: str = Form(...),
    description: str = Form(None),
    quantity_kg: float = Form(...),
    preparation_time: str = Form(...),
    available_until: str = Form(...),
    image: UploadFile = File(None),
    user: User = Depends(require_role("institution")),
    db: Session = Depends(get_db),
):
    institution = db.query(Institution).filter(Institution.user_id == user.id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Create institution profile first")

    # Parse datetimes
    try:
        prep_time = datetime.fromisoformat(preparation_time)
        avail_until = datetime.fromisoformat(available_until)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO format.")

    # Save image
    image_path = None
    if image:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        image_path = os.path.join(settings.UPLOAD_DIR, filename)
        with open(image_path, "wb") as f:
            f.write(image.file.read())

    # AI Assessment
    assessment = assess_food_image(
        food_type=food_type,
        preparation_time=prep_time,
        image_path=image_path,
        available_until=avail_until,
    )

    batch = FoodBatch(
        institution_id=institution.id,
        food_type=food_type,
        description=description,
        quantity_kg=quantity_kg,
        preparation_time=prep_time,
        available_until=avail_until,
        image_path=image_path,
        ai_category=assessment["ai_category"],
        ai_condition=assessment["ai_condition"],
        ai_confidence=assessment["ai_confidence"],
        ai_deterioration_risk=assessment["ai_deterioration_risk"],
        ai_estimated_safe_hours=assessment["ai_estimated_safe_hours"],
        status="assessed",
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("", response_model=list[FoodBatchOut])
def list_food_batches(
    institution_id: int = None,
    status: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FoodBatch)
    if institution_id:
        query = query.filter(FoodBatch.institution_id == institution_id)
    elif user.role == "institution":
        inst = db.query(Institution).filter(Institution.user_id == user.id).first()
        if inst:
            query = query.filter(FoodBatch.institution_id == inst.id)
    if status:
        query = query.filter(FoodBatch.status == status)
    batches = query.order_by(FoodBatch.created_at.desc()).all()

    # Update rescue statuses
    for b in batches:
        if b.available_until:
            rc = calculate_rescue_status(b.available_until)
            b.rescue_status = rc["status"]

    return batches


@router.get("/{batch_id}", response_model=FoodBatchOut)
def get_food_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(FoodBatch).filter(FoodBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Food batch not found")
    if batch.available_until:
        rc = calculate_rescue_status(batch.available_until)
        batch.rescue_status = rc["status"]
    return batch


@router.put("/{batch_id}/segregate", response_model=FoodBatchOut)
def segregate_food_batch(
    batch_id: int,
    data: SegregationUpdate,
    user: User = Depends(require_role("institution")),
    db: Session = Depends(get_db),
):
    batch = db.query(FoodBatch).filter(FoodBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Food batch not found")

    if data.segregation not in ("human", "animal", "recovery"):
        raise HTTPException(status_code=400, detail="Segregation must be: human, animal, or recovery")

    batch.segregation = data.segregation
    batch.status = "segregated"
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/{batch_id}/assessment")
def get_assessment(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(FoodBatch).filter(FoodBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Food batch not found")
    return {
        "batch_id": batch.id,
        "food_type": batch.food_type,
        "ai_category": batch.ai_category,
        "ai_condition": batch.ai_condition,
        "ai_confidence": batch.ai_confidence,
        "ai_deterioration_risk": batch.ai_deterioration_risk,
        "ai_estimated_safe_hours": batch.ai_estimated_safe_hours,
        "disclaimer": "This is a preliminary visual assessment using AI, not a food-safety certification.",
    }


@router.get("/{batch_id}/rescue-clock")
def get_rescue_clock(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(FoodBatch).filter(FoodBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Food batch not found")
    return calculate_rescue_status(batch.available_until)
