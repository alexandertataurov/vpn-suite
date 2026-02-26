"""Async database engine and session for Postgres."""

from collections.abc import AsyncGenerator

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
)


def _before_cursor(conn, cursor, statement, parameters, context, executemany):
    from app.core.db_metrics import before_cursor_execute

    before_cursor_execute()


def _after_cursor(conn, cursor, statement, parameters, context, executemany):
    from app.core.db_metrics import after_cursor_execute

    after_cursor_execute()


try:
    event.listen(engine.sync_engine, "before_cursor_execute", _before_cursor)
    event.listen(engine.sync_engine, "after_cursor_execute", _after_cursor)
except Exception:
    pass  # sync_engine may not exist on all drivers

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_db() -> bool:
    """Return True if DB is reachable. Logs and returns False on error (no silent fail)."""
    import logging

    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logging.getLogger(__name__).warning("DB health check failed: %s", type(e).__name__)
        return False
