from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.config.settings import settings
from sqlalchemy import text


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()

async def setup_timescaledb() -> None:
    """Executes table creation and TimescaleDB hypertable conversion."""
    async with engine.begin() as conn:
        # 1. Ensure TimescaleDB extension exists
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))

        # 2. Create raw relational schemas
        await conn.run_sync(Base.metadata.create_all)

        # 3. Create hypertable on (timestamp, 1 day chunks) if not already created
        hypertable_sql = text("""
            SELECT create_hypertable(
                'raw_observations',
                by_range('timestamp', INTERVAL '1 day'),
                if_not_exists => TRUE,
                migrate_data => TRUE
            );
        """)
        await conn.execute(hypertable_sql)