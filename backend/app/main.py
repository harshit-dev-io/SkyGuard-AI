from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.auth.routes import router as auth_router
from app.config.database import Base, engine
from app.config.logging import logger
from app.config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database connection...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema synchronized.")
    yield
    logger.info("Disposing engine connections...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Register Sub-Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}