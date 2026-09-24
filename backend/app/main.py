from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.auth.routes import router as auth_router
from app.config.database import Base, engine , setup_timescaledb
from app.config.logging import logger
from app.config.settings import settings
from fastapi.middleware import cors
from app.edge_simulator.router import router as edge_router
from app.ingestion_pipeline.router import router as ingest_router
from app.ingestion_pipeline.consumer import pipeline_worker
from app.fusion_engine.router import router as fusion_router
from sqlalchemy import text
from app.fusion_engine.consumer import fused_consumer_daemon
from app.self_healing.router import router as self_healing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database connection...")
    
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))

    async with engine.begin() as conn:
        await setup_timescaledb()
        await conn.run_sync(Base.metadata.create_all)
        
    try:
        await pipeline_worker.start()
    except Exception as e:
        logger.warning(f"Kafka ingestion worker skipped due to network/port restriction: {e}")

    try:
        await fused_consumer_daemon.start()
    except Exception as e:
        logger.warning(f"Fused evidence consumer skipped due to network/port restriction: {e}")

    logger.info("Database schema synchronized.")
    yield
    logger.info("Disposing engine connections...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(edge_router, prefix=settings.API_V1_PREFIX)
app.include_router(ingest_router, prefix=settings.API_V1_PREFIX)
app.include_router(fusion_router, prefix=settings.API_V1_PREFIX)
app.include_router(self_healing_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}