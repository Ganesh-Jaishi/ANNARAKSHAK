"""
ANNARAKSHAK Database Setup
SQLAlchemy engine, session, and Base for models.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# For SQLite, need check_same_thread=False
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Called on startup."""
    import app.models  # noqa: F401 — ensure all models are imported
    Base.metadata.create_all(bind=engine)
