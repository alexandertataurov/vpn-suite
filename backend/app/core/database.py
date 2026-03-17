"""Async database engine and session for Postgres."""

import asyncio
from collections.abc import AsyncGenerator

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# Engines and session makers are keyed by the current event loop.
# This ensures each asyncpg connection pool is only ever used from the
# event loop that created it, preventing "Future attached to a different loop" errors.
_engines_by_loop: dict[int, AsyncEngine] = {}
_session_makers_by_loop: dict[int, async_sessionmaker[AsyncSession]] = {}


def _current_loop_key() -> int:
    """Return a stable key for the currently running event loop."""
    loop = asyncio.get_running_loop()
    return id(loop)


def _ensure_session_maker() -> async_sessionmaker[AsyncSession]:
    """Lazily initialize the async engine and session maker for the current event loop."""
    loop_key = _current_loop_key()

    session_maker = _session_makers_by_loop.get(loop_key)
    engine = _engines_by_loop.get(loop_key)
    if session_maker is not None and engine is not None:
        return session_maker

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
        # sync_engine may not exist on all drivers
        pass

    session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    _engines_by_loop[loop_key] = engine
    _session_makers_by_loop[loop_key] = session_maker

    return session_maker


def async_session_factory() -> AsyncSession:
    """Return a new AsyncSession bound to the lazily-initialized engine."""
    return _ensure_session_maker()()


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
