"""Cluster API: topology, nodes, drain, resync."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.constants import PERM_CLUSTER_READ, PERM_CLUSTER_WRITE
from app.core.rbac import require_permission

router = APIRouter(prefix="/cluster", tags=["cluster"])


@router.get("/topology")
async def get_cluster_topology(
    request: Request,
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Return current cluster topology (cached)."""
    adapter = request.app.state.node_runtime_adapter
    from app.services.topology_engine import TopologyEngine

    engine = TopologyEngine(adapter)
    topo = await engine.get_topology()
    return {
        "timestamp": topo.timestamp.isoformat(),
        "nodes": [n.model_dump(mode="json") for n in topo.nodes],
        "total_capacity": topo.total_capacity,
        "current_load": topo.current_load,
        "load_factor": topo.load_factor,
        "load_index": topo.load_index,
        "health_score": topo.health_score,
        "health_index": topo.health_index,
        "capacity_score": topo.capacity_score,
        "topology_version": topo.topology_version,
    }


@router.get("/nodes")
async def get_cluster_nodes(
    request: Request,
    status_filter: str | None = Query(None, alias="status"),
    min_health: float | None = Query(None, ge=0, le=1),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """List nodes (from topology). Filter by status and/or min_health."""
    adapter = request.app.state.node_runtime_adapter
    from app.services.topology_engine import TopologyEngine

    engine = TopologyEngine(adapter)
    topo = await engine.get_topology()
    nodes = topo.nodes
    if status_filter:
        nodes = [n for n in nodes if n.status == status_filter]
    if min_health is not None:
        nodes = [n for n in nodes if (n.health_score or 0) >= min_health]
    return {"nodes": [n.model_dump(mode="json") for n in nodes], "total": len(nodes)}


@router.get("/health")
async def get_cluster_health(
    request: Request,
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Return aggregate cluster health from topology (spec: GET /cluster/health)."""
    adapter = request.app.state.node_runtime_adapter
    from app.services.topology_engine import TopologyEngine

    engine = TopologyEngine(adapter)
    topo = await engine.get_topology()
    status_counts: dict[str, int] = {}
    for n in topo.nodes:
        st = n.status or "unknown"
        status_counts[st] = status_counts.get(st, 0) + 1
    return {
        "timestamp": topo.timestamp.isoformat(),
        "health_score": topo.health_score,
        "health_index": topo.health_index,
        "nodes_total": len(topo.nodes),
        "status_counts": status_counts,
        "current_load": topo.current_load,
        "total_capacity": topo.total_capacity,
        "load_factor": topo.load_factor,
        "load_index": topo.load_index,
        "capacity_score": topo.capacity_score,
    }


class DrainBody(BaseModel):
    reason: str | None = None
    migrate_peers: bool = False
    deadline: str | None = None


@router.post("/nodes/{node_id}/drain")
async def drain_node(
    request: Request,
    node_id: str,
    body: DrainBody | None = None,
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    """Mark node as draining (no new peers). Load balancer excludes draining nodes."""
    from sqlalchemy import select

    from app.core.database import async_session_factory
    from app.models import Server

    async with async_session_factory() as session:
        r = await session.execute(select(Server).where(Server.id == node_id))
        server = r.scalar_one_or_none()
        if not server:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="node not found")
        server.is_draining = True
        await session.commit()
    return {"status": "ok", "node_id": node_id, "is_draining": True}


@router.post("/nodes/{node_id}/undrain")
async def undrain_node(
    request: Request,
    node_id: str,
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    """Clear draining flag so the node can receive new peers again."""
    from sqlalchemy import select

    from app.core.database import async_session_factory
    from app.models import Server

    async with async_session_factory() as session:
        r = await session.execute(select(Server).where(Server.id == node_id))
        server = r.scalar_one_or_none()
        if not server:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="node not found")
        server.is_draining = False
        await session.commit()
    return {"status": "ok", "node_id": node_id, "is_draining": False}


class ResyncBody(BaseModel):
    node_id: str | None = None
    force: bool = False


@router.post("/scan")
async def cluster_scan(
    request: Request,
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    """Trigger one discovery cycle and synchronize discovered nodes into control-plane state."""
    if settings.node_discovery == "agent" or settings.node_mode == "agent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "AGENT_MODE_UNSUPPORTED",
                "message": "Cluster scan is disabled in agent mode. Manage Server registry explicitly.",
            },
        )
    from app.core.node_scan_task import run_node_scan_once

    added = await run_node_scan_once(lambda: request.app.state.node_runtime_adapter)
    return {"status": "ok", "servers_added": added}


@router.post("/resync")
async def cluster_resync(
    request: Request,
    body: ResyncBody | None = None,
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    """Trigger reconciliation once. Optional node_id to reconcile single node."""
    if settings.node_discovery == "agent" or settings.node_mode == "agent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "AGENT_MODE_UNSUPPORTED",
                "message": "Control-plane reconciliation is disabled in agent mode. Node-agent performs reconciliation.",
            },
        )
    from app.services.reconciliation_engine import reconcile_all_nodes, reconcile_node

    adapter = request.app.state.node_runtime_adapter
    body = body or ResyncBody()

    if body.node_id:
        from app.services.topology_engine import TopologyEngine

        engine = TopologyEngine(adapter)
        topo = await engine.get_topology()
        node_ids = {node.node_id for node in topo.nodes}
        if body.node_id not in node_ids:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="node not found")
        result = await reconcile_node(body.node_id, adapter)
        return {
            "status": "ok",
            "node_id": body.node_id,
            "peers_added": result.peers_added,
            "peers_removed": result.peers_removed,
            "peers_updated": result.peers_updated,
            "errors": result.errors,
            "duration_ms": result.duration_ms,
        }

    results = await reconcile_all_nodes(adapter)
    return {
        "status": "ok",
        "nodes_reconciled": len(results),
        "results": [
            {
                "node_id": nid,
                "peers_added": r.peers_added,
                "peers_removed": r.peers_removed,
                "peers_updated": r.peers_updated,
                "errors": r.errors[:3],
            }
            for nid, r in results
        ],
    }
