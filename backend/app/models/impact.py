"""
Impact models — ESG/CSR ledger and operational waste intelligence.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from app.database import Base


class ImpactRecord(Base):
    """
    Automatically generated after every completed rescue.
    Digital Rescue Record + ESG data.
    """
    __tablename__ = "impact_records"

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("allocations.id"), nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("receivers.id"), nullable=False)

    # Rescue details
    quantity_rescued_kg = Column(Float, nullable=False)
    food_type = Column(String(100), nullable=True)
    beneficiaries_served = Column(Integer, default=0)

    # Recovery metrics
    recovery_kg = Column(Float, default=0)          # Animal feed / biogas / compost input
    biogas_output_kwh = Column(Float, default=0)
    compost_output_kg = Column(Float, default=0)

    # Environmental impact
    carbon_saved_kg = Column(Float, default=0)       # kg CO2 equivalent
    water_saved_liters = Column(Float, default=0)
    energy_saved_kwh = Column(Float, default=0)

    created_at = Column(DateTime, server_default=func.now())


class WasteRecord(Base):
    """
    Operational waste intelligence for institutions.
    Tracks loss sources for Waste Fingerprint generation.
    """
    __tablename__ = "waste_records"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)

    # Loss categories (kg)
    overproduction_kg = Column(Float, default=0)
    raw_material_loss_kg = Column(Float, default=0)
    spoilage_kg = Column(Float, default=0)
    storage_loss_kg = Column(Float, default=0)

    # Operational metrics
    machine_downtime_hours = Column(Float, default=0)
    excess_energy_kwh = Column(Float, default=0)

    # Period
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
