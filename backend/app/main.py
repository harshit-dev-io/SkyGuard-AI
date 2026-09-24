from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.auth.routes import router as auth_router
from app.config.database import Base, engine
from app.config.logging import logger
from app.config.settings import settings
from fastapi.middleware import cors
from app.edge_simulator.router import router as edge_router
from app.regions.router import router as regions_router
from sqlalchemy import text


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database connection...")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema synchronized.")
    except Exception as exc:
        logger.warning(f"Database initialization deferred (Postgres offline or unavailable): {exc}")
    yield
    logger.info("Disposing engine connections...")
    try:
        await engine.dispose()
    except Exception:
        pass


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
app.include_router(regions_router, prefix=settings.API_V1_PREFIX)
app.include_router(regions_router, prefix="/api")


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}