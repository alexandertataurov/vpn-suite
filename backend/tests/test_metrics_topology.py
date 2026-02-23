"""Tests for topology metric updates."""

from datetime import datetime, timezone

from app.core.metrics import (
    update_topology_metrics,
    vpn_node_health,
    vpn_node_interface_info,
    vpn_node_peers,
    vpn_nodes_total,
)
from app.schemas.node import ClusterTopology, NodeMetadata


def _metric_labels(metric, sample_name: str) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for family in metric.collect():
        for sample in family.samples:
            if sample.name == sample_name:
                out.append(dict(sample.labels))
    return out


def _node(
    node_id: str,
    container_name: str,
    interface_name: str,
    status: str,
    health_score: float,
    peer_count: int,
) -> NodeMetadata:
    return NodeMetadata(
        node_id=node_id,
        container_name=container_name,
        interface_name=interface_name,
        status=status,
        health_score=health_score,
        peer_count=peer_count,
        max_peers=1000,
        listen_port=51820,
        last_seen=datetime.now(timezone.utc),
    )


def _topology(nodes: list[NodeMetadata]) -> ClusterTopology:
    return ClusterTopology(
        timestamp=datetime.now(timezone.utc),
        nodes=nodes,
        total_capacity=1000 * len(nodes),
        current_load=sum(n.peer_count for n in nodes),
        load_factor=0.0,
        load_index=0.0,
        health_score=sum(n.health_score for n in nodes) / len(nodes) if nodes else 0.0,
        health_index=0.0,
        capacity_score=0.0,
        topology_version=1,
    )


def test_update_topology_metrics_clears_stale_label_series():
    vpn_nodes_total.clear()
    vpn_node_health.clear()
    vpn_node_peers.clear()
    vpn_node_interface_info.clear()

    topo1 = _topology(
        [
            _node("n1", "amnezia-awg", "wg0", "degraded", 0.7, 3),
            _node("n2", "amnezia-awg2", "awg0", "healthy", 0.95, 1),
        ]
    )
    update_topology_metrics(topo1)

    labels_1 = _metric_labels(vpn_nodes_total, "vpn_nodes_total")
    assert {"status": "degraded"} in labels_1
    assert {"status": "healthy"} in labels_1

    topo2 = _topology([_node("n2", "amnezia-awg2", "awg0", "healthy", 0.97, 0)])
    update_topology_metrics(topo2)

    labels_2 = _metric_labels(vpn_nodes_total, "vpn_nodes_total")
    assert {"status": "healthy"} in labels_2
    assert {"status": "degraded"} not in labels_2

    node_health_labels = _metric_labels(vpn_node_health, "vpn_node_health")
    assert {"node_id": "n2", "container_name": "amnezia-awg2"} in node_health_labels
    assert {"node_id": "n1", "container_name": "amnezia-awg"} not in node_health_labels

    iface_labels = _metric_labels(vpn_node_interface_info, "vpn_node_interface_info")
    assert {
        "node_id": "n2",
        "container_name": "amnezia-awg2",
        "interface_name": "awg0",
    } in iface_labels
