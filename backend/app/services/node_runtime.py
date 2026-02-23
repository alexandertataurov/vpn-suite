"""Node runtime adapter abstraction — node-interface-agnostic control plane."""

from abc import ABC, abstractmethod
from typing import Any

from app.schemas.node import NodeMetadata


class PeerConfigLike:
    """Minimal peer config for add_peer (public_key required)."""

    def __init__(
        self,
        public_key: str,
        allowed_ips: str | None = None,
        preshared_key: str | None = None,
        persistent_keepalive: int = 25,
    ):
        self.public_key = public_key
        self.allowed_ips = allowed_ips
        self.preshared_key = preshared_key
        self.persistent_keepalive = persistent_keepalive


class NodeRuntimeAdapter(ABC):
    """Abstract adapter for node discovery, health, and peer operations."""

    @abstractmethod
    async def discover_nodes(self) -> list[NodeMetadata]:
        """Discover and return current nodes with runtime metadata."""
        ...

    @abstractmethod
    async def health_check(self, node_id: str) -> dict[str, Any]:
        """Run health check for one node. Return status, latency_ms, handshake_ok, etc."""
        ...

    @abstractmethod
    async def add_peer(
        self,
        node_id: str,
        peer_config: PeerConfigLike,
    ) -> None:
        """Add a peer to the node. Raise on failure."""
        ...

    @abstractmethod
    async def remove_peer(self, node_id: str, peer_public_key: str) -> None:
        """Remove a peer from the node. Raise on failure."""
        ...

    @abstractmethod
    async def list_peers(self, node_id: str) -> list[dict[str, Any]]:
        """List peers on the node (public_key, allowed_ips, last_handshake_ts, rx/tx, etc.)."""
        ...

    async def enforce_bandwidth_policies(
        self,
        node_id: str,
        *,
        policies: list[dict[str, Any]],
        peer_bindings: list[dict[str, Any]],
        dry_run: bool = False,
    ) -> dict[str, Any]:
        """Apply per-plan bandwidth policies for peers on a node. Optional per-adapter capability."""
        raise NotImplementedError(
            "Bandwidth policy enforcement is not implemented for this runtime adapter"
        )
