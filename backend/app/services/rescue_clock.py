"""
Rescue Clock Service

Calculates real-time urgency status for each food batch
based on remaining redistribution window.

Statuses:
  SAFE     (green)  — > 4 hours remaining
  URGENT   (amber)  — 1-4 hours remaining
  CRITICAL (red)    — < 1 hour remaining
  EXPIRED  (grey)   — past available_until time
"""
from datetime import datetime, timezone
from app.config import settings


def calculate_rescue_status(available_until: datetime, now: datetime = None) -> dict:
    """
    Calculate the current rescue clock status for a food batch.

    Returns dict with: status, remaining_minutes, priority_score, color, label
    """
    if now is None:
        now = datetime.now(timezone.utc)

    # Ensure timezone awareness
    if available_until.tzinfo is None:
        available_until = available_until.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    remaining = available_until - now
    remaining_minutes = remaining.total_seconds() / 60

    if remaining_minutes <= 0:
        return {
            "status": "expired",
            "remaining_minutes": 0,
            "priority_score": 0,
            "color": "#6b7280",
            "label": "EXPIRED",
            "urgency_level": 0,
        }

    if remaining_minutes > settings.RESCUE_SAFE_THRESHOLD:
        status = "safe"
        color = "#10b981"     # Green
        label = "SAFE"
        # Low priority — plenty of time
        priority_score = 30 + (settings.RESCUE_SAFE_THRESHOLD / remaining_minutes) * 20
    elif remaining_minutes > settings.RESCUE_URGENT_THRESHOLD:
        status = "urgent"
        color = "#f59e0b"     # Amber
        label = "URGENT"
        # Medium priority — time pressure building
        fraction = 1 - (remaining_minutes - settings.RESCUE_URGENT_THRESHOLD) / (settings.RESCUE_SAFE_THRESHOLD - settings.RESCUE_URGENT_THRESHOLD)
        priority_score = 50 + fraction * 30
    else:
        status = "critical"
        color = "#ef4444"     # Red
        label = "CRITICAL"
        # High priority — immediate action needed
        fraction = 1 - (remaining_minutes / settings.RESCUE_URGENT_THRESHOLD)
        priority_score = 80 + fraction * 20

    priority_score = round(min(100, max(0, priority_score)), 1)

    return {
        "status": status,
        "remaining_minutes": round(max(0, remaining_minutes), 1),
        "priority_score": priority_score,
        "color": color,
        "label": label,
        "urgency_level": 3 if status == "critical" else 2 if status == "urgent" else 1,
    }


def update_batch_rescue_status(batch) -> str:
    """
    Update a food batch's rescue_status based on current time.
    Returns the new status.
    """
    result = calculate_rescue_status(batch.available_until)
    return result["status"]
