"""POST /api/v1/webapp/referral/attach: idempotent attach, self-referral block, ref/referral_code body."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_webapp_session_token
from app.main import app
from app.models import Referral, User
from tests.utils_asserts import assert_error_response


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


@pytest.mark.asyncio
async def test_webapp_referral_attach_requires_auth(client: AsyncClient):
    """POST /webapp/referral/attach without Bearer returns 401."""
    r = await client.post(
        "/api/v1/webapp/referral/attach",
        json={"ref": "1"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_webapp_referral_attach_valid_attach(
    client: AsyncClient, async_session: AsyncSession
):
    """Valid attach → 200 attached with referrer_user_id."""
    # Clean up any existing rows for idempotent re-runs.
    await async_session.execute(delete(Referral).where(Referral.referee_user_id == 100002))
    await async_session.execute(delete(User).where(User.tg_id.in_([100001, 100002])))
    await async_session.flush()
    referrer = User(tg_id=100001)
    referee = User(tg_id=100002)
    async_session.add(referrer)
    async_session.add(referee)
    await async_session.flush()
    await async_session.commit()

    token = create_webapp_session_token(100002)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        r = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"ref": str(referrer.id)},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "attached"
        assert data["referrer_user_id"] == referrer.id

        result = await async_session.execute(
            select(Referral).where(Referral.referee_user_id == referee.id)
        )
        row = result.scalar_one_or_none()
        assert row is not None
        assert row.referrer_user_id == referrer.id
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_referral_attach_duplicate_returns_already_attached(
    client: AsyncClient, async_session: AsyncSession
):
    """Duplicate attach → 200 already_attached with referrer_user_id."""
    # Clean up any existing rows for idempotent re-runs.
    await async_session.execute(delete(Referral).where(Referral.referee_user_id == 200002))
    await async_session.execute(delete(User).where(User.tg_id.in_([200001, 200002])))
    await async_session.flush()
    referrer = User(tg_id=200001)
    referee = User(tg_id=200002)
    async_session.add(referrer)
    async_session.add(referee)
    await async_session.flush()
    async_session.add(
        Referral(
            referrer_user_id=referrer.id,
            referee_user_id=referee.id,
            referral_code=str(referrer.id),
            status="pending",
        )
    )
    await async_session.commit()

    token = create_webapp_session_token(200002)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        r = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"ref": str(referrer.id)},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "already_attached"
        assert data["referrer_user_id"] == referrer.id
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_referral_attach_self_referral_blocked(
    client: AsyncClient, async_session: AsyncSession
):
    """Self-referral (ref = referee id) → 400 self_referral_blocked."""
    await async_session.execute(delete(User).where(User.tg_id == 300001))
    await async_session.flush()
    referee = User(tg_id=300001)
    async_session.add(referee)
    await async_session.flush()
    await async_session.commit()

    token = create_webapp_session_token(300001)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        r = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"ref": str(referee.id)},
        )
        assert r.status_code == 400, r.text
        data = r.json()
        # API returns unified error body with BAD_REQUEST code and message.
        assert_error_response(data, "BAD_REQUEST", "Cannot refer self")
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_referral_attach_invalid_ref(client: AsyncClient, async_session: AsyncSession):
    """Invalid ref (non-numeric, referrer not found) → 400 invalid_ref."""
    await async_session.execute(delete(User).where(User.tg_id == 400001))
    await async_session.flush()
    referee = User(tg_id=400001)
    async_session.add(referee)
    await async_session.commit()

    token = create_webapp_session_token(400001)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        r = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"ref": "nonnumeric"},
        )
        assert r.status_code == 400, r.text
        data1 = r.json()
        assert_error_response(data1, "BAD_REQUEST", "Invalid referral code")

        r2 = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"ref": "999999999"},
        )
        assert r2.status_code == 400, r2.text
        data2 = r2.json()
        # When ref is numeric but referrer not found, backend returns NOT_FOUND code.
        assert_error_response(data2, "NOT_FOUND", "Referrer not found")
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_referral_attach_accepts_ref_and_referral_code(
    client: AsyncClient, async_session: AsyncSession
):
    """Both ref and referral_code body keys work."""
    await async_session.execute(delete(Referral).where(Referral.referee_user_id == 500002))
    await async_session.execute(delete(User).where(User.tg_id.in_([500001, 500002])))
    await async_session.flush()
    referrer = User(tg_id=500001)
    referee = User(tg_id=500002)
    async_session.add(referrer)
    async_session.add(referee)
    await async_session.flush()
    await async_session.commit()

    token = create_webapp_session_token(500002)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        r = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"referral_code": str(referrer.id)},
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "attached"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_referral_attach_no_overwrite(
    client: AsyncClient, async_session: AsyncSession
):
    """Referee with referrer A, attach B → already_attached with referrer A."""
    await async_session.execute(delete(Referral).where(Referral.referee_user_id == 600003))
    await async_session.execute(
        delete(User).where(User.tg_id.in_([600001, 600002, 600003]))
    )
    await async_session.flush()
    referrer_a = User(tg_id=600001)
    referrer_b = User(tg_id=600002)
    referee = User(tg_id=600003)
    async_session.add(referrer_a)
    async_session.add(referrer_b)
    async_session.add(referee)
    await async_session.flush()
    async_session.add(
        Referral(
            referrer_user_id=referrer_a.id,
            referee_user_id=referee.id,
            referral_code=str(referrer_a.id),
            status="pending",
        )
    )
    await async_session.commit()

    token = create_webapp_session_token(600003)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        r = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"ref": str(referrer_b.id)},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "already_attached"
        assert data["referrer_user_id"] == referrer_a.id

        result = await async_session.execute(
            select(Referral).where(Referral.referee_user_id == referee.id)
        )
        row = result.scalar_one_or_none()
        assert row.referrer_user_id == referrer_a.id
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_referral_attach_double_call_idempotent(
    client: AsyncClient, async_session: AsyncSession
):
    """Two sequential attach calls for same referrer/referee → attached then already_attached; single DB row."""
    await async_session.execute(delete(Referral).where(Referral.referee_user_id == 800002))
    await async_session.execute(delete(User).where(User.tg_id.in_([800001, 800002])))
    await async_session.flush()
    referrer = User(tg_id=800001)
    referee = User(tg_id=800002)
    async_session.add(referrer)
    async_session.add(referee)
    await async_session.flush()
    await async_session.commit()

    token = create_webapp_session_token(800002)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        # First attach should succeed.
        r1 = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"ref": str(referrer.id)},
        )
        assert r1.status_code == 200, r1.text
        data1 = r1.json()
        assert data1["status"] == "attached"
        assert data1["referrer_user_id"] == referrer.id

        # Second attach with same body should be idempotent.
        r2 = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"ref": str(referrer.id)},
        )
        assert r2.status_code == 200, r2.text
        data2 = r2.json()
        assert data2["status"] == "already_attached"
        assert data2["referrer_user_id"] == referrer.id

        result = await async_session.execute(
            select(Referral).where(Referral.referee_user_id == referee.id)
        )
        rows = result.scalars().all()
        assert len(rows) == 1
        assert rows[0].referrer_user_id == referrer.id
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_referral_attach_ref_prefix_normalized(
    client: AsyncClient, async_session: AsyncSession
):
    """Body ref_XXX is normalized to XXX."""
    await async_session.execute(delete(Referral).where(Referral.referee_user_id == 700002))
    await async_session.execute(delete(User).where(User.tg_id.in_([700001, 700002])))
    await async_session.flush()
    referrer = User(tg_id=700001)
    referee = User(tg_id=700002)
    async_session.add(referrer)
    async_session.add(referee)
    await async_session.flush()
    await async_session.commit()

    token = create_webapp_session_token(700002)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        r = await client.post(
            "/api/v1/webapp/referral/attach",
            headers={"Authorization": f"Bearer {token}"},
            json={"ref": f"ref_{referrer.id}"},
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "attached"
    finally:
        app.dependency_overrides.pop(get_db, None)
