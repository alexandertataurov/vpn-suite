"""Peer list schemas (peers API = alias over devices)."""

from datetime import datetime

from pydantic import BaseModel


class PeerListItemOut(BaseModel):
    """Single peer in list (device as peer)."""

    peer_id: str
    node_id: str
    user_id: int
    subscription_id: str
    public_key: str
    client_name: str | None
    status: str  # active | revoked
    issued_at: datetime
    revoked_at: datetime | None


class PeerListOut(BaseModel):
    """Peers list response."""

    peers: list[PeerListItemOut]
    total: int
