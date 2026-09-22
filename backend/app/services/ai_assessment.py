"""
AI Food Image Assessment Service

Simulated EfficientNet/ResNet + OpenCV pipeline for food condition assessment.
In production, this would load a trained model and run real inference.
For the prototype, uses deterministic heuristics based on food type and time.

Architecture:
  Image → Preprocessing (OpenCV resize/normalize) →
  EfficientNet-B0 backbone → Classification head →
  Category + Condition + Deterioration Risk + Estimated Safe Hours
"""
import hashlib
import random
from datetime import datetime, timezone


# Food categories and their typical shelf characteristics
FOOD_PROFILES = {
    "rice": {"base_hours": 8, "deterioration_rate": "low", "category": "cooked_grain"},
    "cooked_meal": {"base_hours": 6, "deterioration_rate": "medium", "category": "mixed_cooked"},
    "bread": {"base_hours": 24, "deterioration_rate": "low", "category": "bakery"},
    "vegetables": {"base_hours": 12, "deterioration_rate": "medium", "category": "fresh_produce"},
    "fruits": {"base_hours": 24, "deterioration_rate": "low", "category": "fresh_produce"},
    "dairy": {"base_hours": 4, "deterioration_rate": "high", "category": "dairy"},
    "curry": {"base_hours": 5, "deterioration_rate": "medium", "category": "cooked_gravy"},
    "salad": {"base_hours": 3, "deterioration_rate": "high", "category": "fresh_produce"},
    "snacks": {"base_hours": 48, "deterioration_rate": "low", "category": "packaged"},
    "sweets": {"base_hours": 12, "deterioration_rate": "medium", "category": "confectionery"},
    "biryani": {"base_hours": 6, "deterioration_rate": "medium", "category": "cooked_grain"},
    "roti": {"base_hours": 10, "deterioration_rate": "low", "category": "bakery"},
    "dal": {"base_hours": 6, "deterioration_rate": "medium", "category": "cooked_gravy"},
    "paneer": {"base_hours": 4, "deterioration_rate": "high", "category": "dairy"},
}


def assess_food_image(
    food_type: str,
    preparation_time: datetime,
    image_path: str = None,
    available_until: datetime = None,
) -> dict:
    """
    Simulated AI assessment of food condition from image + metadata.

    In production:
      1. Load image with OpenCV (cv2.imread)
      2. Resize to 224x224 for EfficientNet-B0
      3. Run through trained model: model.predict(preprocessed_image)
      4. Post-process: category, condition score, deterioration features

    For prototype: deterministic heuristic based on food type and elapsed time.
    """
    now = datetime.now(timezone.utc)
    prep_time = preparation_time
    if prep_time.tzinfo is None:
        from datetime import timezone as tz
        prep_time = prep_time.replace(tzinfo=tz.utc)

    elapsed_hours = (now - prep_time).total_seconds() / 3600

    # Get food profile
    profile = FOOD_PROFILES.get(food_type.lower(), {
        "base_hours": 8, "deterioration_rate": "medium", "category": "unknown"
    })

    base_hours = profile["base_hours"]

    # Calculate condition based on elapsed time vs base shelf life
    freshness_ratio = max(0, 1 - (elapsed_hours / base_hours))

    if freshness_ratio > 0.7:
        condition = "fresh"
        confidence = 0.85 + (freshness_ratio - 0.7) * 0.5
    elif freshness_ratio > 0.4:
        condition = "acceptable"
        confidence = 0.75 + (freshness_ratio - 0.4) * 0.33
    elif freshness_ratio > 0.1:
        condition = "deteriorating"
        confidence = 0.70 + (freshness_ratio - 0.1) * 0.33
    else:
        condition = "unsuitable"
        confidence = 0.80 + freshness_ratio

    confidence = min(0.98, max(0.60, confidence))

    # Deterioration risk
    if freshness_ratio > 0.6:
        deterioration_risk = "low"
    elif freshness_ratio > 0.3:
        deterioration_risk = "medium"
    else:
        deterioration_risk = "high"

    # Estimated remaining safe hours
    estimated_safe_hours = max(0, base_hours - elapsed_hours)

    # Seed randomness from image path for consistency
    seed = int(hashlib.md5((image_path or food_type).encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)
    confidence += rng.uniform(-0.05, 0.05)
    confidence = round(min(0.98, max(0.55, confidence)), 2)

    return {
        "ai_category": profile["category"],
        "ai_condition": condition,
        "ai_confidence": confidence,
        "ai_deterioration_risk": deterioration_risk,
        "ai_estimated_safe_hours": round(estimated_safe_hours, 1),
        "food_type_detected": food_type,
        "elapsed_hours": round(elapsed_hours, 1),
        "analysis_method": "Simulated EfficientNet-B0 + OpenCV (preliminary visual assessment, not food-safety certification)",
    }
