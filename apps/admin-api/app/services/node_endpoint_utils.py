"""Shared helpers to derive VPN endpoint from live node runtime."""

from app.schemas.node import NodeMetadata
from app.services.node_runtime import NodeRuntimeAdapter


def _is_private_ip(ip: str) -> bool:
    """Return True if IP is private (not routable from internet)."""
    try:
        addr = ip.strip().split("/")[0].split(":")[0]
        if not addr or addr == "localhost":
            return True
        import ipaddress

        return ipaddress.ip_address(addr).is_private
    except Exception:
        return True


def is_endpoint_private(endpoint: str | None) -> bool:
    """Return True if endpoint is host:port with a private IP (remote clients will fail)."""
    if not endpoint or not isinstance(endpoint, str):
        return False
    host = endpoint.strip().split(":")[0]
    if not host:
        return False
    return _is_private_ip(host)


async def get_endpoint_from_runtime(
    adapter: NodeRuntimeAdapter,
    server_id: str,
    *,
    default_host: str | None = None,
) -> str | None:
    """Derive vpn_endpoint from live node. Priority: public endpoint_ip:port, else default_host:listen_port."""
    node: NodeMetadata | None = None
    if hasattr(adapter, "get_node_for_sync"):
        node = await adapter.get_node_for_sync(server_id)
    if node is None:
        try:
            nodes = await adapter.discover_nodes()
            node = next((n for n in nodes if n.node_id == server_id), None)
        except Exception:
            pass
    if not node or not node.listen_port:
        return None
    if node.endpoint_ip and not _is_private_ip(node.endpoint_ip):
        return f"{node.endpoint_ip}:{node.listen_port}"
    if default_host and (h := str(default_host).strip()):
        return f"{h}:{node.listen_port}"
    return None
