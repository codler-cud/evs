"""EcoSort FastAPI application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.database.seed import seed_database
from app.database.session import Base, SessionLocal, engine
from app.routes import admin, auth, awareness, centres, challenges, records, waste

settings = get_settings()


def init_db_and_seed() -> None:
    """Create tables if needed and populate initial demo/reference data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db, include_demo_users=settings.SEED_DEMO_DATA)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seed()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "EcoSort REST API — Waste Segregation, AI-Assisted Classification, "
        "Collection Centre Discovery, Disposal Activity Tracking, and Environmental Education."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(waste.router, prefix="/api")
app.include_router(centres.router, prefix="/api")
app.include_router(records.router, prefix="/api")
app.include_router(challenges.router, prefix="/api")
app.include_router(awareness.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health_check():
    """Lightweight health check endpoint for monitoring and local verification."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ai_provider": settings.AI_PROVIDER,
    }
