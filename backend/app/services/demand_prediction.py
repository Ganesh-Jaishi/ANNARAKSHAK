"""
Demand / Surplus Prediction Service

Simulated XGBoost model for predicting:
  - Expected demand per receiver
  - Expected surplus per institution
  - Overproduction risk score

In production: trained XGBoost model using historical data
(registration patterns, day-of-week, seasonal trends, receiver capacity utilization).
"""
from datetime import datetime, timezone
import math


# Typical demand patterns by receiver type (base daily demand in kg)
RECEIVER_DEMAND_PROFILES = {
    "ngo": {"base_demand": 80, "peak_days": [0, 5, 6], "peak_multiplier": 1.4},
    "shelter": {"base_demand": 60, "peak_days": [5, 6], "peak_multiplier": 1.3},
    "food_bank": {"base_demand": 150, "peak_days": [0, 1], "peak_multiplier": 1.2},
    "community_kitchen": {"base_demand": 100, "peak_days": [5, 6], "peak_multiplier": 1.5},
    "animal_org": {"base_demand": 40, "peak_days": [0, 3], "peak_multiplier": 1.1},
    "recovery_facility": {"base_demand": 200, "peak_days": [], "peak_multiplier": 1.0},
}

# Surplus patterns by institution type
INSTITUTION_SURPLUS_PROFILES = {
    "restaurant": {"base_surplus_pct": 0.12, "peak_days": [4, 5, 6], "peak_multiplier": 1.6},
    "canteen": {"base_surplus_pct": 0.15, "peak_days": [0, 4], "peak_multiplier": 1.3},
    "hotel": {"base_surplus_pct": 0.18, "peak_days": [5, 6], "peak_multiplier": 1.5},
    "caterer": {"base_surplus_pct": 0.20, "peak_days": [5, 6], "peak_multiplier": 1.8},
    "factory": {"base_surplus_pct": 0.08, "peak_days": [], "peak_multiplier": 1.0},
    "hospital": {"base_surplus_pct": 0.10, "peak_days": [0, 6], "peak_multiplier": 1.2},
}


def predict_receiver_demand(receiver_type: str, capacity_kg: float, current_hour: int = None) -> dict:
    """Predict demand for a receiver based on type, capacity, and time patterns."""
    now = datetime.now(timezone.utc)
    day_of_week = now.weekday()
    hour = current_hour if current_hour is not None else now.hour

    profile = RECEIVER_DEMAND_PROFILES.get(receiver_type, {
        "base_demand": 50, "peak_days": [], "peak_multiplier": 1.0
    })

    demand = profile["base_demand"]

    # Peak day adjustment
    if day_of_week in profile["peak_days"]:
        demand *= profile["peak_multiplier"]

    # Time-of-day adjustment (higher demand at meal times)
    if 11 <= hour <= 14:    # Lunch
        demand *= 1.3
    elif 18 <= hour <= 21:  # Dinner
        demand *= 1.2

    # Cap at capacity
    demand = min(demand, capacity_kg)

    return {
        "predicted_demand_kg": round(demand, 1),
        "confidence": 0.78,
        "peak_day": day_of_week in profile["peak_days"],
        "demand_urgency": "high" if demand > capacity_kg * 0.7 else "medium" if demand > capacity_kg * 0.4 else "low",
        "model": "Simulated XGBoost (receiver demand prediction)",
    }


def predict_institution_surplus(institution_type: str, capacity_kg_daily: float) -> dict:
    """Predict expected surplus and overproduction risk for an institution."""
    now = datetime.now(timezone.utc)
    day_of_week = now.weekday()
    hour = now.hour

    profile = INSTITUTION_SURPLUS_PROFILES.get(institution_type, {
        "base_surplus_pct": 0.10, "peak_days": [], "peak_multiplier": 1.0
    })

    surplus_pct = profile["base_surplus_pct"]

    # Peak day
    if day_of_week in profile["peak_days"]:
        surplus_pct *= profile["peak_multiplier"]

    expected_surplus = capacity_kg_daily * surplus_pct

    # Overproduction risk
    if surplus_pct > 0.25:
        risk = "high"
        risk_score = 0.85
    elif surplus_pct > 0.15:
        risk = "medium"
        risk_score = 0.55
    else:
        risk = "low"
        risk_score = 0.25

    return {
        "predicted_surplus_kg": round(expected_surplus, 1),
        "overproduction_risk": risk,
        "risk_score": risk_score,
        "surplus_percentage": round(surplus_pct * 100, 1),
        "confidence": 0.74,
        "model": "Simulated XGBoost (surplus/overproduction prediction)",
    }
