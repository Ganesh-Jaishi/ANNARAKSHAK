"""
Route Optimization Service

Simulated OR-Tools vehicle routing with pickup and delivery.
Uses haversine distance + nearest-neighbor heuristic for the prototype.

In production:
  - Google Distance Matrix API for real travel times
  - OR-Tools CVRPTW (Capacitated VRP with Time Windows)
  - AddPickupAndDelivery() constraints
  - Real-time traffic adjustments
"""
import math
from typing import List, Tuple


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in km."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def interpolate_route(start: Tuple[float, float], end: Tuple[float, float], steps: int = 10) -> List[List[float]]:
    """
    Generate intermediate points between start and end for route visualization.
    In production, this would come from a directions API.
    """
    points = []
    for i in range(steps + 1):
        t = i / steps
        lat = start[0] + t * (end[0] - start[0])
        lng = start[1] + t * (end[1] - start[1])
        # Add slight curve for visual realism
        offset = math.sin(t * math.pi) * 0.002
        points.append([round(lat + offset, 6), round(lng - offset, 6)])
    return points


def optimize_route(
    pickup: Tuple[float, float],
    delivery: Tuple[float, float],
    intermediate_stops: List[Tuple[float, float]] = None,
) -> dict:
    """
    Optimize a pickup-delivery route.

    For the prototype: direct route with interpolated waypoints.
    In production: OR-Tools VRPTW with real distance matrix.

    Args:
        pickup: (lat, lng) of institution
        delivery: (lat, lng) of receiver
        intermediate_stops: optional list of (lat, lng) for multi-stop routes

    Returns:
        Optimized route with polyline, distance, and time estimates.
    """
    stops = [pickup]
    if intermediate_stops:
        # Nearest-neighbor ordering
        remaining = list(intermediate_stops)
        current = pickup
        ordered = []
        while remaining:
            nearest = min(remaining, key=lambda s: haversine_km(current[0], current[1], s[0], s[1]))
            ordered.append(nearest)
            current = nearest
            remaining.remove(nearest)
        stops.extend(ordered)
    stops.append(delivery)

    # Calculate total distance
    total_distance = 0
    route_polyline = []

    for i in range(len(stops) - 1):
        segment_dist = haversine_km(stops[i][0], stops[i][1], stops[i + 1][0], stops[i + 1][1])
        total_distance += segment_dist
        segment_points = interpolate_route(stops[i], stops[i + 1], steps=8)
        if i > 0:
            segment_points = segment_points[1:]  # Avoid duplicate points
        route_polyline.extend(segment_points)

    # Estimated time: assume 24 km/h average urban speed
    estimated_minutes = (total_distance / 24) * 60

    return {
        "route_polyline": route_polyline,
        "total_distance_km": round(total_distance, 2),
        "estimated_time_min": round(estimated_minutes, 1),
        "stops": [list(s) for s in stops],
        "num_stops": len(stops),
        "optimization_method": "Simulated OR-Tools (nearest-neighbor heuristic)",
    }


def find_empty_leg_driver(
    pickup: Tuple[float, float],
    delivery: Tuple[float, float],
    available_drivers: List[dict] = None,
) -> dict:
    """
    Empty-Leg Gig Rescue: find a nearby driver whose route is compatible.

    Simulates matching by generating plausible nearby drivers.
    """
    if available_drivers is None:
        # Simulate available gig drivers near the pickup point
        import random
        rng = random.Random(int(pickup[0] * 1000))
        drivers = []
        for i in range(5):
            d_lat = pickup[0] + rng.uniform(-0.05, 0.05)
            d_lng = pickup[1] + rng.uniform(-0.05, 0.05)
            dist = haversine_km(pickup[0], pickup[1], d_lat, d_lng)
            drivers.append({
                "id": f"DRV-{1000 + i}",
                "name": rng.choice(["Rajesh", "Amit", "Priya", "Suresh", "Deepa", "Mohammed"]) + f" {chr(65 + i)}.",
                "current_lat": d_lat,
                "current_lng": d_lng,
                "distance_to_pickup_km": round(dist, 2),
                "vehicle": rng.choice(["bike", "auto", "van"]),
                "rating": round(rng.uniform(3.5, 5.0), 1),
                "compatible_route": dist < 5,  # Within 5km is compatible
            })
        available_drivers = drivers

    # Filter compatible and sort by distance
    compatible = [d for d in available_drivers if d.get("compatible_route", True)]
    compatible.sort(key=lambda d: d["distance_to_pickup_km"])

    if compatible:
        best = compatible[0]
        return {
            "matched": True,
            "driver": best,
            "pickup_eta_min": round(best["distance_to_pickup_km"] * 2.5, 1),
        }
    return {"matched": False, "driver": None, "pickup_eta_min": None}
