"""Unit tests for agent action queue: create, get, append_log, set_status, get_pending."""

import pytest
from sqlalchemy import select

from app.core.database import async_session_factory
from app.models import Server
from app.services.agent_action_service import (
    append_log,
    create_action,
    get_action,
    get_pending_action,
    set_status,
)


@pytest.mark.asyncio
async def test_create_action_and_get_pending():
    """Create action -> get_pending returns it; set_status running -> get_pending returns None. Requires Postgres."""
    try:
        async with async_session_factory() as session:
            r = await session.execute(select(Server).limit(1))
            server = r.scalar_one_or_none()
            if not server:
                pytest.fail("No server in DB")
            server_id = server.id

            action = await create_action(
                session,
                server_id=server_id,
                type="sync",
                payload={"mode": "manual"},
                requested_by=None,
                correlation_id="test-req-1",
            )
            await session.commit()
            assert action.id
            assert action.status == "pending"

            pending = await get_pending_action(session, server_id)
            assert pending is not None
            assert pending.id == action.id

            await set_status(session, action.id, "running", started_at=action.requested_at)
            await session.commit()

            pending2 = await get_pending_action(session, server_id)
            assert pending2 is None

            await append_log(session, action.id, level="info", message="done")
            await set_status(session, action.id, "completed", finished_at=action.requested_at)
            await session.commit()

            got = await get_action(session, action.id, load_logs=True)
            assert got is not None
            assert got.status == "completed"
            assert len(got.logs) >= 1
    except (ConnectionRefusedError, OSError):
        pytest.skip("Postgres not available (requires Postgres)")
    except Exception as e:
        exc_chain = [e]
        while getattr(exc_chain[-1], "__cause__", None):
            exc_chain.append(exc_chain[-1].__cause__)
        if any(
            "connection refused" in str(x).lower() or isinstance(x, ConnectionRefusedError)
            for x in exc_chain
        ):
            pytest.skip("Postgres not available (requires Postgres)")
        raise
