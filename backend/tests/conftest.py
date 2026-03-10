from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory, check_db


@pytest_asyncio.fixture
async def async_session() -> AsyncGenerator[AsyncSession, None]:
    """Async DB session for tests that need real DB access.

    Skips tests cleanly when Postgres is not available (e.g., local runs without docker-compose),
    while still exercising full behavior in CI where DB is up.
    """
    if not await check_db():
        pytest.skip("DB not available for async_session fixture (requires Postgres)")
    async with async_session_factory() as session:
        yield session
