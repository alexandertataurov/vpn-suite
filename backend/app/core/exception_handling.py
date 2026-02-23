"""Map control-plane exceptions to HTTP responses (unified status + detail shape)."""

from fastapi import HTTPException, status

from app.core.exceptions import LoadBalancerError, WireGuardCommandError


def raise_http_for_control_plane_exception(exc: Exception) -> None:
    """Raise HTTPException with status and detail matching current router behavior.

    LoadBalancerError -> 503, detail=str(e)
    WireGuardCommandError -> 502, detail=str(e)
    Other -> re-raise.
    """
    if isinstance(exc, LoadBalancerError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    if isinstance(exc, WireGuardCommandError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    raise exc
