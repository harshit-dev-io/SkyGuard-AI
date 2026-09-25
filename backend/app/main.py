from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.auth.routes import router as auth_router
from app.config.database import Base, engine, setup_timescaledb
from app.config.logging import logger
from app.config.settings import settings
from app.edge_simulator.router import router as edge_router
from app.fusion_engine.consumer import fused_consumer_daemon
from app.fusion_engine.router import router as fusion_router
from app.ingestion_pipeline.consumer import pipeline_worker
from app.ingestion_pipeline.router import router as ingest_router
from app.geospatial.router import router as geospatial_router
from app.self_healing.router import router as self_healing_router
from app.wis2_adapter.router import router as wis2_router
from app.background_jobs.router import router as background_jobs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SkyGuard AI Core Services...")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))

        async with engine.begin() as conn:
            await setup_timescaledb()
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema synchronized.")
    except Exception as exc:
        logger.warning(f"Database initialization deferred (Postgres offline or unavailable): {exc}")

    try:
        await pipeline_worker.start()
    except Exception as e:
        logger.warning(f"Kafka ingestion worker skipped: {e}")

    try:
        await fused_consumer_daemon.start()
    except Exception as e:
        logger.warning(f"Fused evidence consumer skipped: {e}")

    yield
    logger.info("Shutting down SkyGuard AI Services...")
    try:
        await pipeline_worker.stop()
        await fused_consumer_daemon.stop()
        await engine.dispose()
    except Exception:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_tracing_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-SkyGuard-Trace-ID"] = request.headers.get("X-Request-ID", "sg-trace-default")
    return response


# Register Sub-Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(ingest_router, prefix=settings.API_V1_PREFIX)
app.include_router(edge_router, prefix=settings.API_V1_PREFIX)
app.include_router(geospatial_router, prefix=settings.API_V1_PREFIX)
app.include_router(geospatial_router, prefix="/api")
app.include_router(fusion_router, prefix=settings.API_V1_PREFIX)
app.include_router(self_healing_router, prefix=settings.API_V1_PREFIX)
app.include_router(background_jobs_router, prefix=settings.API_V1_PREFIX)
app.include_router(wis2_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}
