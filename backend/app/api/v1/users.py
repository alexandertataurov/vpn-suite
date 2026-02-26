"""Users API: search, get, update (ban with confirm), devices list and issue."""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.bot_auth import get_admin_or_bot
from app.core.config import settings
from app.core.constants import (
    PERM_USERS_READ,
    PERM_USERS_WRITE,
    REDIS_KEY_IDEMPOTENCY_ISSUE_PREFIX,
    REDIS_KEY_RATELIMIT_ISSUE_PREFIX,
)
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.exception_handling import raise_http_for_control_plane_exception
from app.core.exceptions import LoadBalancerError, WireGuardCommandError
from app.core.rbac import require_permission
from app.core.redis_client import get_redis
from app.models import Device, Server, Subscription, User
from app.schemas.device import DeviceListItemOut, IssueRequest, IssueResponse, UserDeviceList
from app.schemas.subscription import SubscriptionOut
from app.schemas.user import UserCreate, UserDetail, UserList, UserOut, UserUpdate
from app.api.v1.device_cache import invalidate_devices_list_cache, invalidate_devices_summary_cache
from app.services.funnel_service import log_funnel_event
from app.services.issue_service import issue_device
from app.services.topology_engine import TopologyEngine

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)

BAN_CONFIRM = settings.ban_confirm_token
IDEMPOTENCY_TTL = settings.idempotency_ttl_seconds


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_USERS_WRITE)),
):
    result = await db.execute(select(User).where(User.tg_id == body.tg_id))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="tg_id already exists")
    user = User(tg_id=body.tg_id, email=body.email, phone=body.phone, meta=body.meta)
    db.add(user)
    await db.flush()
    await log_funnel_event(db, event_type="start", user_id=user.id, payload={"tg_id": user.tg_id})
    request.state.audit_resource_type = "user"
    request.state.audit_resource_id = str(user.id)
    request.state.audit_old_new = {"created": {"tg_id": user.tg_id}}
    await db.commit()
    await db.refresh(user)
    return user


@router.get("", response_model=UserList)
async def list_users(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_USERS_READ)),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    tg_id: int | None = Query(None),
    email: str | None = Query(None),
    phone: str | None = Query(None),
    is_banned: bool | None = Query(None),
    plan_id: str | None = Query(None),
    region: str | None = Query(None),
):
    stmt = select(User)
    count_stmt = select(func.count()).select_from(User)
    if plan_id is not None:
        stmt = stmt.join(User.subscriptions).where(Subscription.plan_id == plan_id).distinct()
        count_stmt = (
            select(func.count(func.distinct(User.id)))
            .select_from(User)
            .join(User.subscriptions)
            .where(Subscription.plan_id == plan_id)
        )
    if is_banned is not None:
        stmt = stmt.where(User.is_banned.is_(is_banned))
        count_stmt = count_stmt.where(User.is_banned.is_(is_banned))
    if tg_id is not None:
        stmt = stmt.where(User.tg_id == tg_id)
        count_stmt = count_stmt.where(User.tg_id == tg_id)
    if email is not None:
        stmt = stmt.where(User.email.ilike(f"%{email}%"))
        count_stmt = count_stmt.where(User.email.ilike(f"%{email}%"))
    if phone is not None:
        stmt = stmt.where(User.phone.ilike(f"%{phone}%"))
        count_stmt = count_stmt.where(User.phone.ilike(f"%{phone}%"))
    if region is not None:
        stmt = stmt.join(User.devices).join(Device.server).where(Server.region == region).distinct()
        count_stmt = (
            select(func.count(func.distinct(User.id)))
            .select_from(User)
            .join(User.devices)
            .join(Device.server)
            .where(Server.region == region)
        )
        if is_banned is not None:
            count_stmt = count_stmt.where(User.is_banned.is_(is_banned))
        if tg_id is not None:
            count_stmt = count_stmt.where(User.tg_id == tg_id)
        if email is not None:
            count_stmt = count_stmt.where(User.email.ilike(f"%{email}%"))
        if phone is not None:
            count_stmt = count_stmt.where(User.phone.ilike(f"%{phone}%"))
        if plan_id is not None:
            count_stmt = count_stmt.join(User.subscriptions).where(Subscription.plan_id == plan_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    result = await db.execute(stmt.order_by(User.id.desc()).limit(limit).offset(offset))
    rows = result.scalars().all()
    return UserList(items=[UserOut.model_validate(r) for r in rows], total=total)


@router.get("/by-tg/{tg_id}", response_model=UserDetail)
async def get_user_by_tg_id(
    tg_id: int,
    db: AsyncSession = Depends(get_db),
    _principal=Depends(get_admin_or_bot),
):
    """Resolve user by Telegram id. Allowed for bot (X-API-Key) or admin (JWT)."""
    result = await db.execute(
        select(User).where(User.tg_id == tg_id).options(selectinload(User.subscriptions))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise not_found_404("User", tg_id)
    subs = [SubscriptionOut.model_validate(s) for s in user.subscriptions]
    return UserDetail(
        **UserOut.model_validate(user).model_dump(),
        subscriptions=subs,
    )


@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_USERS_READ)),
):
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.subscriptions))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise not_found_404("User", user_id)
    subs = [SubscriptionOut.model_validate(s) for s in user.subscriptions]
    return UserDetail(
        **UserOut.model_validate(user).model_dump(),
        subscriptions=subs,
    )


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    request: Request,
    user_id: int,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_USERS_WRITE)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise not_found_404("User", user_id)
    if body.is_banned is True and body.confirm_token != BAN_CONFIRM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ban requires confirm_token in body",
        )
    old_snapshot = {"email": user.email, "phone": user.phone, "is_banned": user.is_banned}
    data = body.model_dump(exclude_unset=True, exclude={"confirm_token"})
    for k, v in data.items():
        setattr(user, k, v)
    await db.flush()
    request.state.audit_resource_type = "user"
    request.state.audit_resource_id = str(user.id)
    request.state.audit_old_new = {"old": old_snapshot, "new": {**old_snapshot, **data}}
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}/devices", response_model=UserDeviceList)
async def list_user_devices(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _principal=Depends(get_admin_or_bot),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List user devices. Allowed for bot (X-API-Key) or admin (JWT). Uses DeviceListItemOut to avoid loading issued_configs."""
    result = await db.execute(select(User).where(User.id == user_id))
    if result.scalar_one_or_none() is None:
        raise not_found_404("User", user_id)
    count_stmt = select(func.count()).select_from(Device).where(Device.user_id == user_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    result = await db.execute(
        select(Device)
        .where(Device.user_id == user_id)
        .order_by(Device.issued_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.scalars().all()
    return UserDeviceList(items=[DeviceListItemOut.model_validate(r) for r in rows], total=total)


@router.post(
    "/{user_id}/devices/issue", response_model=IssueResponse, status_code=status.HTTP_201_CREATED
)
async def issue_user_device(
    request: Request,
    user_id: int,
    body: IssueRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
):
    request.state.audit_admin_id = str(principal.id) if hasattr(principal, "id") else "bot"
    request.state.audit_action = f"{request.method} {request.url.path}"
    if settings.issue_rate_limit_per_minute > 0:
        try:
            r = get_redis()
            key = f"{REDIS_KEY_RATELIMIT_ISSUE_PREFIX}{user_id}"
            n = await r.incr(key)
            if n == 1:
                await r.expire(key, settings.issue_rate_window_seconds)
            if n > settings.issue_rate_limit_per_minute:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many device issue requests. Try again later.",
                    },
                )
        except HTTPException:
            raise
        except Exception:
            logger.debug("Issue device rate limit check failed", exc_info=True)
    if idempotency_key:
        try:
            r = get_redis()
            cached = await r.get(f"{REDIS_KEY_IDEMPOTENCY_ISSUE_PREFIX}{idempotency_key}")
            if cached:
                device_id = cached.decode() if isinstance(cached, bytes) else cached
                result = await db.execute(
                    select(Device).where(Device.id == device_id, Device.user_id == user_id)
                )
                dev = result.scalar_one_or_none()
                if dev:
                    return IssueResponse(
                        device_id=dev.id,
                        issued_at=dev.issued_at,
                        config=None,
                        config_awg=None,
                        config_wg_obf=None,
                        config_wg=None,
                        server_id=dev.server_id,
                        subscription_id=dev.subscription_id,
                        node_mode=settings.node_mode,
                        peer_created=False,
                    )
        except Exception:
            logger.debug("Issue device idempotency cache get failed", exc_info=True)
    get_topology = None
    if body.server_id is None:
        adapter = request.app.state.node_runtime_adapter
        engine = TopologyEngine(adapter)
        get_topology = engine.get_topology
    try:
        runtime_adapter = request.app.state.node_runtime_adapter
        out = await issue_device(
            db,
            user_id=user_id,
            subscription_id=body.subscription_id,
            server_id=body.server_id,
            device_name=body.device_name,
            get_topology=get_topology,
            runtime_adapter=runtime_adapter,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e).replace("_", " "),
        )
    except (LoadBalancerError, WireGuardCommandError) as e:
        raise_http_for_control_plane_exception(e)
    await db.commit()
    await invalidate_devices_summary_cache()
    await invalidate_devices_list_cache()
    await db.refresh(out.device)
    if idempotency_key:
        try:
            await get_redis().setex(
                f"{REDIS_KEY_IDEMPOTENCY_ISSUE_PREFIX}{idempotency_key}",
                IDEMPOTENCY_TTL,
                out.device.id,
            )
        except Exception:
            logger.debug("Issue device idempotency cache set failed", exc_info=True)
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = out.device.id
    request.state.audit_old_new = {
        "created": {"user_id": user_id, "subscription_id": body.subscription_id}
    }
    await log_funnel_event(
        db,
        event_type="issue",
        user_id=user_id,
        payload={"device_id": out.device.id, "subscription_id": body.subscription_id},
    )
    return IssueResponse(
        device_id=out.device.id,
        issued_at=out.device.issued_at,
        config=out.config_awg,
        config_awg=out.config_awg,
        config_wg_obf=out.config_wg_obf,
        config_wg=out.config_wg,
        server_id=out.device.server_id,
        subscription_id=out.device.subscription_id,
        node_mode=settings.node_mode,
        peer_created=out.peer_created,
    )
