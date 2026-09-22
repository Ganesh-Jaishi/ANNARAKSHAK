"""
Waste Intelligence Service

Generates institution-specific Waste Fingerprints
by analyzing operational waste records over time.
Identifies likely loss sources and provides recommendations.
"""
from typing import List
from sqlalchemy.orm import Session
from app.models.impact import WasteRecord


def generate_waste_fingerprint(db: Session, institution_id: int) -> dict:
    """
    Analyze waste records to create a Waste Fingerprint.

    Tracks:
      - Overproduction
      - Raw material loss
      - Spoilage / storage loss
      - Machine downtime
      - Excess energy use
    """
    records = db.query(WasteRecord).filter(
        WasteRecord.institution_id == institution_id
    ).order_by(WasteRecord.period_end.desc()).all()

    if not records:
        return {
            "institution_id": institution_id,
            "has_data": False,
            "message": "No waste records found. Start recording operational waste to generate your Waste Fingerprint.",
        }

    # Aggregate totals
    totals = {
        "overproduction_kg": sum(r.overproduction_kg for r in records),
        "raw_material_loss_kg": sum(r.raw_material_loss_kg for r in records),
        "spoilage_kg": sum(r.spoilage_kg for r in records),
        "storage_loss_kg": sum(r.storage_loss_kg for r in records),
        "machine_downtime_hours": sum(r.machine_downtime_hours for r in records),
        "excess_energy_kwh": sum(r.excess_energy_kwh for r in records),
    }

    total_waste = (
        totals["overproduction_kg"] +
        totals["raw_material_loss_kg"] +
        totals["spoilage_kg"] +
        totals["storage_loss_kg"]
    )

    # Calculate percentages
    if total_waste > 0:
        breakdown = {
            "overproduction": round(totals["overproduction_kg"] / total_waste * 100, 1),
            "raw_material_loss": round(totals["raw_material_loss_kg"] / total_waste * 100, 1),
            "spoilage": round(totals["spoilage_kg"] / total_waste * 100, 1),
            "storage_loss": round(totals["storage_loss_kg"] / total_waste * 100, 1),
        }
    else:
        breakdown = {"overproduction": 0, "raw_material_loss": 0, "spoilage": 0, "storage_loss": 0}

    # Identify top loss source
    top_source = max(breakdown, key=breakdown.get)

    # Generate recommendations
    recommendations = _get_recommendations(top_source, breakdown, totals)

    # Trend (compare last 3 vs previous 3 records)
    recent = records[:3]
    older = records[3:6]
    if recent and older:
        recent_total = sum(r.overproduction_kg + r.spoilage_kg + r.storage_loss_kg + r.raw_material_loss_kg for r in recent)
        older_total = sum(r.overproduction_kg + r.spoilage_kg + r.storage_loss_kg + r.raw_material_loss_kg for r in older)
        if older_total > 0:
            trend_pct = round((recent_total - older_total) / older_total * 100, 1)
            trend = "improving" if trend_pct < 0 else "worsening" if trend_pct > 0 else "stable"
        else:
            trend_pct = 0
            trend = "stable"
    else:
        trend_pct = 0
        trend = "insufficient_data"

    return {
        "institution_id": institution_id,
        "has_data": True,
        "total_waste_kg": round(total_waste, 1),
        "breakdown_percent": breakdown,
        "totals": totals,
        "top_loss_source": top_source,
        "recommendations": recommendations,
        "trend": trend,
        "trend_change_pct": trend_pct,
        "records_analyzed": len(records),
    }


def _get_recommendations(top_source: str, breakdown: dict, totals: dict) -> List[str]:
    """Generate targeted recommendations based on waste fingerprint."""
    recs = []

    if breakdown.get("overproduction", 0) > 30:
        recs.append("High overproduction detected. Implement demand forecasting and adjust production volumes based on historical consumption patterns.")
        recs.append("Consider batch-size optimization — prepare food in smaller batches timed to actual demand.")

    if breakdown.get("spoilage", 0) > 25:
        recs.append("Significant spoilage losses. Review cold-chain management and storage temperatures.")
        recs.append("Implement FIFO (First In, First Out) inventory rotation strictly.")

    if breakdown.get("storage_loss", 0) > 20:
        recs.append("Storage losses are high. Audit storage conditions — temperature, humidity, pest control.")
        recs.append("Consider IoT temperature/humidity monitoring for real-time storage alerts (planned ANNARAKSHAK integration).")

    if breakdown.get("raw_material_loss", 0) > 20:
        recs.append("Raw material losses are notable. Review procurement quality and supplier standards.")
        recs.append("Train kitchen staff on efficient preparation techniques to minimize trim waste.")

    if totals.get("machine_downtime_hours", 0) > 10:
        recs.append("Equipment downtime is contributing to waste. Schedule preventive maintenance regularly.")

    if totals.get("excess_energy_kwh", 0) > 100:
        recs.append("Excess energy consumption detected. Audit equipment efficiency and operating schedules.")

    if not recs:
        recs.append("Waste levels are within acceptable ranges. Continue monitoring to maintain performance.")

    recs.append("Register surplus food on ANNARAKSHAK before it reaches the waste stage — our AI will match it to nearby receivers.")

    return recs
