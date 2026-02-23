"""Control-plane API: automation planning, resource governance, and analytics."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import PERM_CLUSTER_READ, PERM_CLUSTER_WRITE
from app.core.database import async_session_factory, get_db
from app.core.error_responses import not_found_404
from app.core.rbac import require_permission
from app.core.security import decode_token
from app.models import (
    AdminUser,
    ControlPlaneEvent,
    IpPool,
    Plan,
    PlanBandwidthPolicy,
    PortAllocation,
    Role,
    Server,
)
from app.schemas.control_plane import (
    AnomalyMetricsOut,
    AutomationRunOut,
    AutomationRunRequest,
    AutomationStatusOut,
    BusinessMetricsOut,
    ControlPlaneEventListOut,
    FailoverEvaluateOut,
    IpPoolCreate,
    IpPoolListOut,
    IpPoolOut,
    IpPoolUpdate,
    LatencyProbeBatchIn,
    LatencyProbeIngestOut,
    LatencyProbeListOut,
    PlacementSimulateRequest,
    PlacementSimulationOut,
    PlanBandwidthPolicyListOut,
    PlanBandwidthPolicyOut,
    PlanBandwidthPolicyUpsert,
    PortAllocationCreate,
    PortAllocationListOut,
    PortAllocationOut,
    PortAllocationUpdate,
    RebalancePlanOut,
    RebalancePlanRequest,
    SecurityMetricsOut,
    ThrottlingApplyOut,
    ThrottlingApplyRequest,
    TopologyGraphOut,
    TopologySummaryOut,
)
from app.services.control_plane_service import (
    anomaly_metrics,
    apply_plan_bandwidth_policies,
    automation_status,
    build_topology_graph,
    build_topology_summary,
    business_metrics,
    evaluate_failover,
    ingest_latency_probes,
    list_latency_probes,
    list_plan_bandwidth_policies,
    map_event,
    map_plan_bandwidth_policy,
    plan_rebalance,
    run_automation_cycle,
    security_metrics,
    simulate_placement,
)
from app.services.topology_engine import TopologyEngine

router = APIRouter(prefix="/control-plane", tags=["control-plane"])
logger = logging.getLogger(__name__)

EVENTS_PAGE_SIZE = 200


def _require_runtime_write_ops() -> None:
    if settings.node_mode == "agent" or settings.node_discovery == "agent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "AGENT_MODE_UNSUPPORTED",
                "message": "This operation requires direct runtime access and is disabled in agent mode.",
            },
        )


def _event_payload(data) -> dict:
    if hasattr(data, "model_dump"):
        return data.model_dump(mode="json")  # type: ignore[no-any-return]
    if isinstance(data, dict):
        return data
    return {"value": str(data)}


async def _authorize_ws_cluster_read(token: str | None) -> tuple[str | None, str | None]:
    if not token:
        return None, "unauthorized"
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None, "unauthorized"
    sub = str(payload.get("sub") or "")
    if not sub:
        return None, "unauthorized"
    async with async_session_factory() as db:
        admin = (
            await db.execute(select(AdminUser).where(AdminUser.id == sub))
        ).scalar_one_or_none()
        if not admin:
            return None, "unauthorized"
        role = (await db.execute(select(Role).where(Role.id == admin.role_id))).scalar_one_or_none()
        if not role:
            return None, "forbidden"
        perms: list = role.permissions if isinstance(role.permissions, list) else []
        if "*" not in perms and "cluster:read" not in perms:
            return None, "forbidden"
        return admin.id, None


@router.get("/topology/summary", response_model=TopologySummaryOut)
async def topology_summary(
    request: Request,
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    adapter = request.app.state.node_runtime_adapter
    topo = await TopologyEngine(adapter).get_topology()
    return build_topology_summary(topo)


@router.get("/topology/graph", response_model=TopologyGraphOut)
async def topology_graph(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    adapter = request.app.state.node_runtime_adapter
    topo = await TopologyEngine(adapter).get_topology()
    return await build_topology_graph(db, topo)


@router.post("/placement/simulate", response_model=PlacementSimulationOut)
async def placement_simulate(
    request: Request,
    body: PlacementSimulateRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    adapter = request.app.state.node_runtime_adapter
    topo = await TopologyEngine(adapter).get_topology()
    result = await simulate_placement(db, topo, body)
    db.add(
        ControlPlaneEvent(
            event_type="placement.simulated",
            severity="info",
            server_id=result.selected_node_id,
            payload={
                "preferred_region": body.preferred_region,
                "source_region": body.source_region,
                "use_latency_probes": body.use_latency_probes,
                "required_capabilities": body.required_capabilities or [],
                "result": _event_payload(result),
            },
        )
    )
    await db.commit()
    return result


@router.post(
    "/latency-probes", response_model=LatencyProbeIngestOut, status_code=status.HTTP_202_ACCEPTED
)
async def ingest_probes(
    body: LatencyProbeBatchIn,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    ingested = await ingest_latency_probes(db, body.items)
    await db.commit()
    return LatencyProbeIngestOut(ingested=ingested, generated_at=datetime.now(timezone.utc))


@router.get("/latency-probes", response_model=LatencyProbeListOut)
async def get_latency_probes(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
    source_region: str | None = Query(None),
    server_id: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    items, total = await list_latency_probes(
        db,
        source_region=source_region,
        server_id=server_id,
        limit=limit,
    )
    return LatencyProbeListOut(items=items, total=total)


@router.post("/rebalance/plan", response_model=RebalancePlanOut)
async def rebalance_plan(
    request: Request,
    body: RebalancePlanRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    adapter = request.app.state.node_runtime_adapter
    topo = await TopologyEngine(adapter).get_topology()
    try:
        result = await plan_rebalance(db, topo, body)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    await db.commit()
    return result


@router.post("/failover/evaluate", response_model=FailoverEvaluateOut)
async def failover_evaluate(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    adapter = request.app.state.node_runtime_adapter
    topo = await TopologyEngine(adapter).get_topology()
    result = await evaluate_failover(db, topo)
    await db.commit()
    return result


@router.get("/ip-pools", response_model=IpPoolListOut)
async def list_ip_pools(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    server_id: str | None = Query(None),
):
    stmt = select(IpPool)
    count_stmt = select(func.count()).select_from(IpPool)
    if server_id:
        stmt = stmt.where(IpPool.server_id == server_id)
        count_stmt = count_stmt.where(IpPool.server_id == server_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    rows = (
        (await db.execute(stmt.order_by(IpPool.created_at.desc()).limit(limit).offset(offset)))
        .scalars()
        .all()
    )
    return IpPoolListOut(items=rows, total=total)  # type: ignore[arg-type]


@router.post("/ip-pools", response_model=IpPoolOut, status_code=status.HTTP_201_CREATED)
async def create_ip_pool(
    body: IpPoolCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    exists = await db.execute(select(Server.id).where(Server.id == body.server_id))
    if not exists.scalar_one_or_none():
        raise not_found_404("server", body.server_id)
    obj = IpPool(**body.model_dump())
    db.add(obj)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="ip pool already exists"
        ) from exc
    await db.refresh(obj)
    return obj


@router.patch("/ip-pools/{pool_id}", response_model=IpPoolOut)
async def update_ip_pool(
    pool_id: str,
    body: IpPoolUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    row = await db.execute(select(IpPool).where(IpPool.id == pool_id))
    obj = row.scalar_one_or_none()
    if not obj:
        raise not_found_404("ip pool", pool_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/port-allocations", response_model=PortAllocationListOut)
async def list_port_allocations(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    server_id: str | None = Query(None),
):
    stmt = select(PortAllocation)
    count_stmt = select(func.count()).select_from(PortAllocation)
    if server_id:
        stmt = stmt.where(PortAllocation.server_id == server_id)
        count_stmt = count_stmt.where(PortAllocation.server_id == server_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    rows = (
        (await db.execute(stmt.order_by(PortAllocation.port.asc()).limit(limit).offset(offset)))
        .scalars()
        .all()
    )
    return PortAllocationListOut(items=rows, total=total)  # type: ignore[arg-type]


@router.post(
    "/port-allocations", response_model=PortAllocationOut, status_code=status.HTTP_201_CREATED
)
async def create_port_allocation(
    body: PortAllocationCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    exists = await db.execute(select(Server.id).where(Server.id == body.server_id))
    if not exists.scalar_one_or_none():
        raise not_found_404("server", body.server_id)
    obj = PortAllocation(**body.model_dump())
    db.add(obj)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="port/protocol already allocated on this server",
        ) from exc
    await db.refresh(obj)
    return obj


@router.patch("/port-allocations/{allocation_id}", response_model=PortAllocationOut)
async def update_port_allocation(
    allocation_id: str,
    body: PortAllocationUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    row = await db.execute(select(PortAllocation).where(PortAllocation.id == allocation_id))
    obj = row.scalar_one_or_none()
    if not obj:
        raise not_found_404("port allocation", allocation_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/throttling/policies", response_model=PlanBandwidthPolicyListOut)
async def get_throttling_policies(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    items = await list_plan_bandwidth_policies(db)
    return PlanBandwidthPolicyListOut(items=items, total=len(items))


@router.put("/throttling/policies/{plan_id}", response_model=PlanBandwidthPolicyOut)
async def upsert_throttling_policy(
    plan_id: str,
    body: PlanBandwidthPolicyUpsert,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    if body.ceil_mbps is not None and body.ceil_mbps < body.rate_mbps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="ceil_mbps must be >= rate_mbps"
        )
    plan_row = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = plan_row.scalar_one_or_none()
    if not plan:
        raise not_found_404("plan", plan_id)
    row = await db.execute(
        select(PlanBandwidthPolicy).where(PlanBandwidthPolicy.plan_id == plan_id)
    )
    policy = row.scalar_one_or_none()
    if policy is None:
        policy = PlanBandwidthPolicy(plan_id=plan_id, **body.model_dump())
        db.add(policy)
    else:
        for key, value in body.model_dump().items():
            setattr(policy, key, value)
    await db.commit()
    await db.refresh(policy)
    return map_plan_bandwidth_policy(policy, plan.name or plan.id)


@router.post("/throttling/apply", response_model=ThrottlingApplyOut)
async def apply_throttling_now(
    request: Request,
    body: ThrottlingApplyRequest | None = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    _require_runtime_write_ops()
    body = body or ThrottlingApplyRequest()
    adapter = request.app.state.node_runtime_adapter
    topo = await TopologyEngine(adapter).get_topology()
    result = await apply_plan_bandwidth_policies(
        db,
        topo,
        runtime_adapter=adapter,
        server_id=body.server_id,
        dry_run=body.dry_run,
    )
    await db.commit()
    return result


@router.get("/metrics/business", response_model=BusinessMetricsOut)
async def get_business_metrics(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    return await business_metrics(db)


@router.get("/metrics/security", response_model=SecurityMetricsOut)
async def get_security_metrics(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    _require_runtime_write_ops()
    adapter = request.app.state.node_runtime_adapter
    topo = await TopologyEngine(adapter).get_topology()
    return await security_metrics(db, topo, adapter)


@router.get("/metrics/anomaly", response_model=AnomalyMetricsOut)
async def get_anomaly_metrics(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    _require_runtime_write_ops()
    adapter = request.app.state.node_runtime_adapter
    topo = await TopologyEngine(adapter).get_topology()
    result = await anomaly_metrics(db, topo, adapter)
    await db.commit()
    return result


@router.get("/events", response_model=ControlPlaneEventListOut)
async def get_control_plane_events(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
    limit: int = Query(50, ge=1, le=500),
):
    try:
        rows = (
            (
                await db.execute(
                    select(ControlPlaneEvent)
                    .order_by(ControlPlaneEvent.created_at.desc())
                    .limit(limit)
                )
            )
            .scalars()
            .all()
        )
        return ControlPlaneEventListOut(
            items=[map_event(row) for row in rows],
            total=len(rows),
        )
    except (OperationalError, ProgrammingError):
        logger.exception("Control-plane events DB error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Control-plane events unavailable (migrations may not have run)",
        ) from None
    except Exception:
        logger.exception("Control-plane events error")
        return ControlPlaneEventListOut(items=[], total=0)


@router.websocket("/events/ws")
async def stream_control_plane_events(websocket: WebSocket):
    admin_id, auth_error = await _authorize_ws_cluster_read(websocket.query_params.get("token"))
    if auth_error == "forbidden":
        await websocket.close(code=4403)
        return
    if not admin_id:
        await websocket.close(code=4401)
        return
    await websocket.accept()
    last_created_at: datetime | None = None
    same_ts_ids: set[str] = set()
    try:
        await websocket.send_json(
            {
                "type": "ready",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        async with async_session_factory() as db:
            initial_rows = (
                (
                    await db.execute(
                        select(ControlPlaneEvent)
                        .order_by(ControlPlaneEvent.created_at.desc())
                        .limit(settings.control_plane_events_ws_initial_limit)
                    )
                )
                .scalars()
                .all()
            )
        for row in reversed(initial_rows):
            event = map_event(row)
            created_at = event.created_at
            await websocket.send_json(
                {"type": "control_plane_event", "event": event.model_dump(mode="json")}
            )
            if last_created_at is None or created_at > last_created_at:
                last_created_at = created_at
                same_ts_ids = {event.id}
            elif created_at == last_created_at:
                same_ts_ids.add(event.id)
        while True:
            await asyncio.sleep(settings.control_plane_events_ws_poll_seconds)
            async with async_session_factory() as db:
                stmt = select(ControlPlaneEvent)
                if last_created_at is not None:
                    stmt = stmt.where(ControlPlaneEvent.created_at >= last_created_at)
                rows = (
                    (
                        await db.execute(
                            stmt.order_by(ControlPlaneEvent.created_at.asc()).limit(
                                EVENTS_PAGE_SIZE
                            )
                        )
                    )
                    .scalars()
                    .all()
                )
            for row in rows:
                event = map_event(row)
                created_at = event.created_at
                if last_created_at is not None:
                    if created_at < last_created_at:
                        continue
                    if created_at == last_created_at and event.id in same_ts_ids:
                        continue
                await websocket.send_json(
                    {"type": "control_plane_event", "event": event.model_dump(mode="json")}
                )
                if last_created_at is None or created_at > last_created_at:
                    last_created_at = created_at
                    same_ts_ids = {event.id}
                else:
                    same_ts_ids.add(event.id)
    except WebSocketDisconnect:
        return
    except Exception:
        logger.exception("Control plane events WebSocket error")
        await websocket.close(code=1011)


@router.get("/automation/status", response_model=AutomationStatusOut)
async def get_automation_status(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    try:
        return await automation_status(db)
    except HTTPException:
        raise
    except (OperationalError, ProgrammingError):
        logger.exception("Automation status DB error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Automation status unavailable (migrations may not have run)",
        ) from None
    except Exception:
        logger.exception("Automation status error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Automation status temporarily unavailable",
        ) from None


@router.post("/automation/run", response_model=AutomationRunOut)
async def run_automation_now(
    request: Request,
    body: AutomationRunRequest | None = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    _require_runtime_write_ops()
    from app.core.config import settings

    adapter = request.app.state.node_runtime_adapter
    topo = await TopologyEngine(adapter).get_topology()
    body = body or AutomationRunRequest()
    execute_rebalance = (
        body.execute_rebalance
        if body.execute_rebalance is not None
        else settings.control_plane_rebalance_execute_enabled
    )
    batch_size = body.batch_size or settings.control_plane_rebalance_batch_size
    max_executions = (
        body.max_executions or settings.control_plane_rebalance_max_executions_per_cycle
    )
    result = await run_automation_cycle(
        db,
        topo,
        high_watermark=settings.control_plane_rebalance_high_watermark,
        target_watermark=settings.control_plane_rebalance_target_watermark,
        max_moves_per_node=settings.control_plane_rebalance_max_moves_per_node,
        unhealthy_health_threshold=settings.control_plane_unhealthy_health_threshold,
        execute_rebalance=execute_rebalance,
        rebalance_batch_size=batch_size,
        rebalance_max_executions_per_cycle=max_executions,
        rebalance_stop_on_error=settings.control_plane_rebalance_stop_on_error,
        rebalance_rollback_on_error=settings.control_plane_rebalance_rollback_on_error,
        runtime_adapter=adapter,
        sync_server_state=True,
    )
    await db.commit()
    return result
