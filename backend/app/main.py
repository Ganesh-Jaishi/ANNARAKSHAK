"""
ANNARAKSHAK — FastAPI Application Entry Point

AI-Powered Food Waste Reduction, Rescue & Redistribution Platform
"""
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import init_db, get_db

# API Routers
from app.api.auth import router as auth_router
from app.api.institutions import router as institutions_router
from app.api.food_batches import router as food_batches_router
from app.api.receivers import router as receivers_router
from app.api.allocations import router as allocations_router
from app.api.admin import router as admin_router
from app.api.analytics import router as analytics_router

app = FastAPI(
    title="ANNARAKSHAK",
    description="AI-Powered Food Waste Reduction, Rescue & Redistribution Platform",
    version=settings.APP_VERSION,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(institutions_router)
app.include_router(food_batches_router)
app.include_router(receivers_router)
app.include_router(allocations_router)
app.include_router(admin_router)
app.include_router(analytics_router)


@app.on_event("startup")
def startup():
    init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@app.get("/api/health")
def health():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.post("/api/seed")
def seed(db: Session = Depends(get_db)):
    """Seed the database with demo data."""
    try:
        from app.utils.seed import seed_database
        return seed_database(db)
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


# Serve uploaded images
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
