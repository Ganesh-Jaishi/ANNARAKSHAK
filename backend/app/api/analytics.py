"""
Analytics API — waste fingerprint, predictions, deliveries.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.institution import Institution
from app.models.receiver import Receiver
from app.models.delivery import Delivery
from app.models.allocation import Allocation
from app.models.food_batch import FoodBatch
from app.models.impact import WasteRecord
from app.schemas.schemas import WasteRecordCreate, WasteRecordOut, DeliveryOut
from app.utils.auth import get_current_user, require_role
from app.services.waste_intelligence import generate_waste_fingerprint
from app.services.demand_prediction import predict_receiver_demand, predict_institution_surplus

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/waste-fingerprint/{institution_id}")
def get_waste_fingerprint(
    institution_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return generate_waste_fingerprint(db, institution_id)


@router.post("/waste-records")
def create_waste_record(
    data: WasteRecordCreate,
    user: User = Depends(require_role("institution")),
    db: Session = Depends(get_db),
):
    inst = db.query(Institution).filter(Institution.user_id == user.id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution profile not found")

    record = WasteRecord(institution_id=inst.id, **data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/predictions")
def get_predictions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = {"receivers": [], "institutions": []}

    receivers = db.query(Receiver).all()
    for r in receivers:
        pred = predict_receiver_demand(r.type, r.capacity_kg)
        results["receivers"].append({
            "id": r.id, "name": r.name, "type": r.type,
            **pred,
        })

    institutions = db.query(Institution).all()
    for i in institutions:
        pred = predict_institution_surplus(i.type, i.capacity_kg_daily)
        results["institutions"].append({
            "id": i.id, "name": i.name, "type": i.type,
            **pred,
        })

    return results


@router.get("/deliveries")
def list_deliveries(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Delivery)

    # Filter by role
    if user.role == "institution":
        inst = db.query(Institution).filter(Institution.user_id == user.id).first()
        if inst:
            batch_ids = [b.id for b in db.query(FoodBatch).filter(FoodBatch.institution_id == inst.id).all()]
            alloc_ids = [a.id for a in db.query(Allocation).filter(Allocation.food_batch_id.in_(batch_ids)).all()]
            query = query.filter(Delivery.allocation_id.in_(alloc_ids))
    elif user.role == "receiver":
        recv = db.query(Receiver).filter(Receiver.user_id == user.id).first()
        if recv:
            alloc_ids = [a.id for a in db.query(Allocation).filter(Allocation.receiver_id == recv.id).all()]
            query = query.filter(Delivery.allocation_id.in_(alloc_ids))

    deliveries = query.order_by(Delivery.created_at.desc()).all()
    result = []
    for d in deliveries:
        alloc = db.query(Allocation).filter(Allocation.id == d.allocation_id).first()
        batch = db.query(FoodBatch).filter(FoodBatch.id == alloc.food_batch_id).first() if alloc else None
        inst = db.query(Institution).filter(Institution.id == batch.institution_id).first() if batch else None
        recv = db.query(Receiver).filter(Receiver.id == alloc.receiver_id).first() if alloc else None
        current_lat = None
        current_lng = None
        if d.route_polyline:
            try:
                pts = json.loads(d.route_polyline)
                if pts and len(pts) > 0:
                    if d.status == "delivered":
                        cur = pts[-1]
                    elif d.status in ("picked_up", "in_transit"):
                        cur = pts[len(pts) // 2]
                    else:
                        cur = pts[0]
                    current_lat, current_lng = float(cur[0]), float(cur[1])
            except Exception:
                pass

        if current_lat is None and inst:
            current_lat, current_lng = inst.lat, inst.lng

        result.append({
            "id": d.id,
            "allocation_id": d.allocation_id,
            "driver_name": d.driver_name,
            "driver_phone": d.driver_phone,
            "vehicle_type": d.vehicle_type,
            "pickup_time": str(d.pickup_time) if d.pickup_time else None,
            "delivery_time": str(d.delivery_time) if d.delivery_time else None,
            "distance_km": d.distance_km,
            "estimated_travel_min": alloc.estimated_travel_min if alloc else 20,
            "status": d.status,
            "confirmed_by_institution": d.confirmed_by_institution,
            "confirmed_by_receiver": d.confirmed_by_receiver,
            "route_polyline": d.route_polyline,
            "quantity_kg": alloc.quantity_kg if alloc else 0,
            "food_type": batch.food_type if batch else None,
            "description": batch.description if batch else None,
            "image_path": batch.image_path if (batch and batch.image_path) else (f"/uploads/{batch.food_type}.jpg" if batch else None),
            "institution_name": inst.name if inst else None,
            "pickup_address": inst.address if inst else None,
            "pickup_city": inst.city if inst else None,
            "pickup_lat": inst.lat if inst else None,
            "pickup_lng": inst.lng if inst else None,
            "receiver_name": recv.name if recv else None,
            "delivery_address": recv.address if recv else None,
            "delivery_city": recv.city if recv else None,
            "delivery_lat": recv.lat if recv else None,
            "delivery_lng": recv.lng if recv else None,
            "current_lat": current_lat,
            "current_lng": current_lng,
        })
    return result
