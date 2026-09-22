"""
Demo Data Seeder — COMPREHENSIVE

Populates the database with a complete India-based rescue scenario.
Creates the full lifecycle: batches → allocations → deliveries → impact records.
Re-runnable: deletes all existing data first.
"""
from datetime import datetime, timedelta, timezone
import json
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.institution import Institution
from app.models.receiver import Receiver
from app.models.food_batch import FoodBatch
from app.models.allocation import Allocation
from app.models.delivery import Delivery
from app.models.impact import ImpactRecord, WasteRecord
from app.utils.auth import hash_password
from app.services.ai_assessment import assess_food_image
from app.services.rescue_clock import calculate_rescue_status
from app.services.impact_tracker import calculate_impact


def seed_database(db: Session):
    """Seed the database with comprehensive demo data. Deletes existing data first."""
    # ─── Clear everything ──────────────────────────────
    db.query(WasteRecord).delete()
    db.query(ImpactRecord).delete()
    db.query(Delivery).delete()
    db.query(Allocation).delete()
    db.query(FoodBatch).delete()
    db.query(Receiver).delete()
    db.query(Institution).delete()
    db.query(User).delete()
    db.commit()

    now = datetime.now(timezone.utc)
    pwd = hash_password("demo123")

    # ─── Users ─────────────────────────────────────────
    users = [
        User(email="delhi.canteen@demo.in", password_hash=pwd, full_name="Rajiv Sharma", role="institution", phone="+91 98100 10001"),
        User(email="mumbai.hotel@demo.in", password_hash=pwd, full_name="Anita Deshmukh", role="institution", phone="+91 98200 20001"),
        User(email="bangalore.restaurant@demo.in", password_hash=pwd, full_name="Karthik Reddy", role="institution", phone="+91 98300 30001"),
        User(email="chennai.caterer@demo.in", password_hash=pwd, full_name="Lakshmi Iyer", role="institution", phone="+91 98400 40001"),
        User(email="kolkata.factory@demo.in", password_hash=pwd, full_name="Debashis Sen", role="institution", phone="+91 98500 50001"),
        User(email="ngo.delhi@demo.in", password_hash=pwd, full_name="Meera Gupta", role="receiver", phone="+91 98100 10101"),
        User(email="shelter.mumbai@demo.in", password_hash=pwd, full_name="Farhan Sheikh", role="receiver", phone="+91 98200 20101"),
        User(email="foodbank.bangalore@demo.in", password_hash=pwd, full_name="Priya Nair", role="receiver", phone="+91 98300 30101"),
        User(email="kitchen.chennai@demo.in", password_hash=pwd, full_name="Murugan S", role="receiver", phone="+91 98400 40101"),
        User(email="animal.kolkata@demo.in", password_hash=pwd, full_name="Ritu Das", role="receiver", phone="+91 98500 50101"),
        User(email="biogas.delhi@demo.in", password_hash=pwd, full_name="Vikram Patel", role="receiver", phone="+91 98100 10201"),
        User(email="shelter.bangalore@demo.in", password_hash=pwd, full_name="Anjali Rao", role="receiver", phone="+91 98300 30201"),
        User(email="ngo.chennai@demo.in", password_hash=pwd, full_name="Sundar K", role="receiver", phone="+91 98400 40201"),
        User(email="admin@annarakshak.in", password_hash=pwd, full_name="Dr. Arun Kumar", role="admin", phone="+91 99999 00001"),
    ]
    for u in users:
        db.add(u)
    db.flush()

    # ─── Institutions ──────────────────────────────────
    institutions = [
        Institution(user_id=users[0].id, name="Central Govt Canteen", type="canteen",
                    address="Shastri Bhawan, New Delhi", city="New Delhi", state="Delhi", district="Central Delhi",
                    lat=28.6139, lng=77.2090, fssai_license="FSSAI-DL-001", capacity_kg_daily=500),
        Institution(user_id=users[1].id, name="Taj Palace Kitchen", type="hotel",
                    address="Colaba, Mumbai", city="Mumbai", state="Maharashtra", district="Mumbai City",
                    lat=18.9220, lng=72.8347, fssai_license="FSSAI-MH-002", capacity_kg_daily=800),
        Institution(user_id=users[2].id, name="Vidyarthi Bhavan", type="restaurant",
                    address="Gandhi Bazaar, Bangalore", city="Bangalore", state="Karnataka", district="Bangalore Urban",
                    lat=12.9516, lng=77.5674, fssai_license="FSSAI-KA-003", capacity_kg_daily=300),
        Institution(user_id=users[3].id, name="Arusuvai Catering", type="caterer",
                    address="T Nagar, Chennai", city="Chennai", state="Tamil Nadu", district="Chennai",
                    lat=13.0418, lng=80.2341, fssai_license="FSSAI-TN-004", capacity_kg_daily=600),
        Institution(user_id=users[4].id, name="Bengal Food Processing", type="factory",
                    address="Salt Lake, Kolkata", city="Kolkata", state="West Bengal", district="North 24 Parganas",
                    lat=22.5726, lng=88.3639, fssai_license="FSSAI-WB-005", capacity_kg_daily=1000),
    ]
    for i in institutions:
        db.add(i)
    db.flush()

    # ─── Receivers ─────────────────────────────────────
    receivers = [
        Receiver(user_id=users[5].id, name="Akshaya Patra Delhi", type="ngo",
                 address="Dwarka, New Delhi", city="New Delhi", state="Delhi", district="South West Delhi",
                 lat=28.5921, lng=77.0460, categories_accepted=json.dumps(["rice", "cooked_meal", "roti", "dal", "vegetables"]),
                 capacity_kg=200, current_demand_kg=120, is_available=True),
        Receiver(user_id=users[6].id, name="Mumbai Night Shelter", type="shelter",
                 address="Andheri East, Mumbai", city="Mumbai", state="Maharashtra", district="Mumbai Suburban",
                 lat=19.1136, lng=72.8697, categories_accepted=json.dumps(["cooked_meal", "bread", "rice", "curry"]),
                 capacity_kg=150, current_demand_kg=90, is_available=True),
        Receiver(user_id=users[7].id, name="Robin Hood Army BLR", type="food_bank",
                 address="Indiranagar, Bangalore", city="Bangalore", state="Karnataka", district="Bangalore Urban",
                 lat=12.9784, lng=77.6408, categories_accepted=json.dumps(["rice", "cooked_meal", "bread", "vegetables", "fruits"]),
                 capacity_kg=250, current_demand_kg=180, is_available=True),
        Receiver(user_id=users[8].id, name="Amma Unavagam", type="community_kitchen",
                 address="Mylapore, Chennai", city="Chennai", state="Tamil Nadu", district="Chennai",
                 lat=13.0339, lng=80.2678, categories_accepted=json.dumps(["rice", "dal", "curry", "vegetables", "cooked_meal"]),
                 capacity_kg=300, current_demand_kg=200, is_available=True),
        Receiver(user_id=users[9].id, name="PFA Kolkata", type="animal_org",
                 address="Ballygunge, Kolkata", city="Kolkata", state="West Bengal", district="Kolkata",
                 lat=22.5290, lng=88.3636, categories_accepted=json.dumps(["rice", "bread", "vegetables"]),
                 capacity_kg=100, current_demand_kg=60, is_available=True),
        Receiver(user_id=users[10].id, name="GreenTech Biogas Delhi", type="recovery_facility",
                 address="Okhla, New Delhi", city="New Delhi", state="Delhi", district="South Delhi",
                 lat=28.5300, lng=77.2700, categories_accepted=json.dumps(["vegetables", "fruits", "cooked_meal", "rice"]),
                 capacity_kg=500, current_demand_kg=300, is_available=True),
        Receiver(user_id=users[11].id, name="Missionaries of Charity BLR", type="shelter",
                 address="Shivajinagar, Bangalore", city="Bangalore", state="Karnataka", district="Bangalore Urban",
                 lat=12.9857, lng=77.6057, categories_accepted=json.dumps(["cooked_meal", "rice", "dal", "bread"]),
                 capacity_kg=100, current_demand_kg=70, is_available=True),
        Receiver(user_id=users[12].id, name="Udhavum Ullangal", type="ngo",
                 address="Adyar, Chennai", city="Chennai", state="Tamil Nadu", district="Chennai",
                 lat=13.0067, lng=80.2563, categories_accepted=json.dumps(["rice", "cooked_meal", "curry", "roti"]),
                 capacity_kg=150, current_demand_kg=100, is_available=True),
    ]
    for r in receivers:
        db.add(r)
    db.flush()

    # ─── Food Batches ──────────────────────────────────
    # Each batch has a lifecycle stage assigned
    batches_config = [
        # === DELHI CANTEEN (inst 0) ===
        # Batch 0: DELIVERED to Akshaya Patra Delhi
        {"inst": 0, "food": "rice", "qty": 80, "desc": "Steamed basmati rice from lunch service", "hours_ago": 8, "hours_left": -1, "seg": "human", "lifecycle": "delivered"},
        # Batch 1: IN TRANSIT to Akshaya Patra Delhi
        {"inst": 0, "food": "dal", "qty": 30, "desc": "Yellow dal with tadka", "hours_ago": 2, "hours_left": 4, "seg": "human", "lifecycle": "in_transit"},
        # Batch 2: PENDING allocation (segregated, awaiting)
        {"inst": 0, "food": "vegetables", "qty": 20, "desc": "Mixed vegetable curry - surplus from evening", "hours_ago": 1, "hours_left": 6, "seg": "human", "lifecycle": "segregated"},

        # === MUMBAI HOTEL (inst 1) ===
        # Batch 3: DELIVERED to Mumbai Night Shelter
        {"inst": 1, "food": "curry", "qty": 45, "desc": "Butter chicken curry — successfully rescued", "hours_ago": 10, "hours_left": -2, "seg": "human", "lifecycle": "delivered"},
        # Batch 4: ACCEPTED by Mumbai Night Shelter
        {"inst": 1, "food": "biryani", "qty": 50, "desc": "Hyderabadi chicken biryani from buffet", "hours_ago": 2, "hours_left": 3.5, "seg": "human", "lifecycle": "accepted"},
        # Batch 5: URGENT - awaiting allocation
        {"inst": 1, "food": "bread", "qty": 40, "desc": "Assorted dinner rolls and naan", "hours_ago": 3, "hours_left": 2, "seg": "human", "lifecycle": "segregated"},

        # === BANGALORE RESTAURANT (inst 2) ===
        # Batch 6: DELIVERED to Robin Hood Army
        {"inst": 2, "food": "cooked_meal", "qty": 35, "desc": "Masala dosa with chutney", "hours_ago": 12, "hours_left": -4, "seg": "human", "lifecycle": "delivered"},
        # Batch 7: ACCEPTED by Missionaries of Charity
        {"inst": 2, "food": "vegetables", "qty": 25, "desc": "Mixed vegetable curry", "hours_ago": 1, "hours_left": 7, "seg": "human", "lifecycle": "accepted"},
        # Batch 8: CRITICAL - animal food
        {"inst": 2, "food": "salad", "qty": 10, "desc": "Garden salad — past best for humans", "hours_ago": 3, "hours_left": 0.5, "seg": "animal", "lifecycle": "segregated"},

        # === CHENNAI CATERER (inst 3) ===
        # Batch 9: IN TRANSIT to Amma Unavagam
        {"inst": 3, "food": "cooked_meal", "qty": 60, "desc": "Full South Indian thali surplus", "hours_ago": 2, "hours_left": 3, "seg": "human", "lifecycle": "in_transit"},
        # Batch 10: DELIVERED to Udhavum Ullangal
        {"inst": 3, "food": "sweets", "qty": 15, "desc": "Gulab jamun and jalebi from wedding", "hours_ago": 6, "hours_left": -1, "seg": "human", "lifecycle": "delivered"},

        # === KOLKATA FACTORY (inst 4) ===
        # Batch 11: DELIVERED as animal feed to PFA Kolkata
        {"inst": 4, "food": "rice", "qty": 35, "desc": "Overcooked rice — animal feed", "hours_ago": 8, "hours_left": -2, "seg": "animal", "lifecycle": "delivered"},
        # Batch 12: RECOVERY - sent to biogas
        {"inst": 4, "food": "vegetables", "qty": 100, "desc": "Vegetable trimmings and peels", "hours_ago": 3, "hours_left": 10, "seg": "recovery", "lifecycle": "accepted"},
        # Batch 13: CRITICAL - paneer expiring soon
        {"inst": 4, "food": "paneer", "qty": 20, "desc": "Paneer tikka from processing line", "hours_ago": 3, "hours_left": 0.8, "seg": "human", "lifecycle": "segregated"},
    ]

    # Allocation targets: which receiver gets which batch
    alloc_targets = {
        0: {"recv": 0, "driver": "Suresh P.", "phone": "+91 98765 11111", "vehicle": "auto", "dist": 5.2, "travel": 15},
        1: {"recv": 0, "driver": "Rajesh K.", "phone": "+91 98765 22222", "vehicle": "tempo", "dist": 7.1, "travel": 20},
        3: {"recv": 1, "driver": "Amit S.", "phone": "+91 98765 33333", "vehicle": "auto", "dist": 8.3, "travel": 22},
        4: {"recv": 1, "driver": "Ravi M.", "phone": "+91 98765 44444", "vehicle": "van", "dist": 12.4, "travel": 30},
        5: {"recv": 1, "driver": "Sameer D.", "phone": "+91 98765 55555", "vehicle": "auto", "dist": 9.1, "travel": 25},
        6: {"recv": 2, "driver": "Kumar R.", "phone": "+91 98765 66666", "vehicle": "bike", "dist": 3.5, "travel": 12},
        7: {"recv": 6, "driver": "Naveen S.", "phone": "+91 98765 77777", "vehicle": "auto", "dist": 4.2, "travel": 14},
        8: {"recv": 4, "driver": "Sanjay G.", "phone": "+91 98765 88888", "vehicle": "auto", "dist": 6.0, "travel": 18},
        9: {"recv": 3, "driver": "Mani V.", "phone": "+91 98765 99999", "vehicle": "tempo", "dist": 5.8, "travel": 16},
        10: {"recv": 7, "driver": "Vijay S.", "phone": "+91 98765 10101", "vehicle": "auto", "dist": 4.5, "travel": 13},
        11: {"recv": 4, "driver": "Bikas D.", "phone": "+91 98765 20202", "vehicle": "van", "dist": 6.8, "travel": 19},
        12: {"recv": 5, "driver": "Anil P.", "phone": "+91 98765 30303", "vehicle": "truck", "dist": 12.0, "travel": 35},
        13: {"recv": 0, "driver": "Prakash M.", "phone": "+91 98765 40404", "vehicle": "auto", "dist": 15.0, "travel": 40},
    }

    # Routes for deliveries
    routes = {
        0: [[28.614, 77.209], [28.605, 77.150], [28.592, 77.046]],
        1: [[28.614, 77.209], [28.600, 77.130], [28.592, 77.046]],
        3: [[18.922, 72.835], [18.98, 72.84], [19.02, 72.85], [19.114, 72.870]],
        4: [[18.922, 72.835], [18.95, 72.845], [19.114, 72.870]],
        6: [[12.952, 77.567], [12.965, 77.600], [12.978, 77.641]],
        7: [[12.952, 77.567], [12.970, 77.590], [12.986, 77.606]],
        9: [[13.042, 80.234], [13.038, 80.250], [13.034, 80.268]],
        10: [[13.042, 80.234], [13.020, 80.245], [13.007, 80.256]],
        11: [[22.573, 88.364], [22.550, 88.363], [22.529, 88.364]],
        12: [[22.573, 88.364], [22.555, 88.360], [22.530, 88.270]],
    }

    food_batches = []
    for bd in batches_config:
        prep_time = now - timedelta(hours=bd["hours_ago"])
        if bd["hours_left"] < 0:
            avail_until = now + timedelta(hours=bd["hours_left"])
        else:
            avail_until = now + timedelta(hours=bd["hours_left"])

        assessment = assess_food_image(bd["food"], prep_time, f"demo_{bd['food']}_{bd['inst']}.jpg", avail_until)
        rescue = calculate_rescue_status(avail_until, now)

        # Determine batch status based on lifecycle
        lifecycle = bd["lifecycle"]
        if lifecycle == "delivered":
            batch_status = "completed"
        elif lifecycle in ("in_transit", "accepted"):
            batch_status = "allocated"
        else:
            batch_status = "segregated"

        batch = FoodBatch(
            institution_id=institutions[bd["inst"]].id,
            food_type=bd["food"],
            description=bd["desc"],
            quantity_kg=bd["qty"],
            preparation_time=prep_time,
            available_until=avail_until,
            ai_category=assessment["ai_category"],
            ai_condition=assessment["ai_condition"],
            ai_confidence=assessment["ai_confidence"],
            ai_deterioration_risk=assessment["ai_deterioration_risk"],
            ai_estimated_safe_hours=assessment["ai_estimated_safe_hours"],
            segregation=bd["seg"],
            rescue_status=rescue["status"],
            image_path=f"/uploads/{bd['food']}.jpg",
            status=batch_status,
        )
        db.add(batch)
        food_batches.append(batch)
    db.flush()

    # ─── Allocations & Deliveries ──────────────────────
    for batch_idx, target in alloc_targets.items():
        batch = food_batches[batch_idx]
        lifecycle = batches_config[batch_idx]["lifecycle"]
        recv = receivers[target["recv"]]

        # Map lifecycle to allocation status
        alloc_status_map = {
            "segregated": "pending",
            "accepted": "accepted",
            "in_transit": "in_transit",
            "delivered": "delivered",
        }
        alloc_status = alloc_status_map.get(lifecycle, "pending")

        # Compute priority score
        import random
        rng = random.Random(batch_idx * 7 + 42)
        score = round(rng.uniform(55, 95), 1)

        alloc = Allocation(
            food_batch_id=batch.id,
            receiver_id=recv.id,
            quantity_kg=batch.quantity_kg,
            priority_score=score,
            distance_km=target["dist"],
            estimated_travel_min=target["travel"],
            status=alloc_status,
            assigned_driver=target["driver"],
            driver_phone=target["phone"],
            vehicle_type=target["vehicle"],
        )
        db.add(alloc)
        db.flush()

        # Create delivery for accepted / in_transit / delivered
        if lifecycle in ("accepted", "in_transit", "delivered"):
            route = routes.get(batch_idx, [])

            d_status = "assigned"
            pickup_time = None
            delivery_time = None
            confirmed_inst = False
            confirmed_recv = False

            if lifecycle == "accepted":
                d_status = "assigned"
            elif lifecycle == "in_transit":
                d_status = "picked_up"
                pickup_time = now - timedelta(minutes=rng.randint(15, 45))
                confirmed_inst = True
            elif lifecycle == "delivered":
                d_status = "delivered"
                pickup_time = now - timedelta(hours=rng.randint(3, 8))
                delivery_time = pickup_time + timedelta(minutes=target["travel"])
                confirmed_inst = True
                confirmed_recv = True

            delivery = Delivery(
                allocation_id=alloc.id,
                driver_name=target["driver"],
                driver_phone=target["phone"],
                vehicle_type=target["vehicle"],
                pickup_time=pickup_time,
                delivery_time=delivery_time,
                distance_km=target["dist"],
                status=d_status,
                confirmed_by_institution=confirmed_inst,
                confirmed_by_receiver=confirmed_recv,
                route_polyline=json.dumps(route),
            )
            db.add(delivery)
            db.flush()

            # Create impact record for delivered
            if lifecycle == "delivered":
                impact_data = calculate_impact(batch.quantity_kg, batch.food_type, batch.segregation or "human")
                impact = ImpactRecord(
                    allocation_id=alloc.id,
                    institution_id=batch.institution_id,
                    receiver_id=recv.id,
                    quantity_rescued_kg=batch.quantity_kg,
                    food_type=batch.food_type,
                    **impact_data,
                )
                db.add(impact)

    # ─── Waste Records (for waste intelligence) ────────
    for inst_idx in range(5):
        for period in range(4):
            period_start = now - timedelta(weeks=4 - period)
            period_end = period_start + timedelta(weeks=1)
            rng = random.Random(inst_idx * 10 + period)

            wr = WasteRecord(
                institution_id=institutions[inst_idx].id,
                overproduction_kg=rng.uniform(5, 50),
                raw_material_loss_kg=rng.uniform(2, 20),
                spoilage_kg=rng.uniform(1, 15),
                storage_loss_kg=rng.uniform(1, 10),
                machine_downtime_hours=rng.uniform(0, 5),
                excess_energy_kwh=rng.uniform(10, 100),
                period_start=period_start,
                period_end=period_end,
            )
            db.add(wr)

    db.commit()

    # Count results
    alloc_count = db.query(Allocation).count()
    delivery_count = db.query(Delivery).count()
    impact_count = db.query(ImpactRecord).count()

    return {
        "message": "Database seeded successfully",
        "seeded": True,
        "data": {
            "users": len(users),
            "institutions": len(institutions),
            "receivers": len(receivers),
            "food_batches": len(food_batches),
            "allocations": alloc_count,
            "deliveries": delivery_count,
            "impact_records": impact_count,
            "waste_records": 20,
        },
    }
