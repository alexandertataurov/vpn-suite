"""Middleware: log audit for requests that set request.state.audit_*.
Failures are logged and not re-raised so client response is not turned into 500.
Optionally emits audit.written to stdout for Loki aggregation.
"""

import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.database import async_session_factory
from app.core.logging_config import extra_for_event
from app.services.audit_service import log_audit

_log = logging.getLogger(__name__)
_audit_log = logging.getLogger("app.audit")


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        aid = getattr(request.state, "audit_admin_id", None)
        if not aid:
            return response
        action = (getattr(request.state, "audit_action", request.method) or request.method)[:64]
        resource_type = (getattr(request.state, "audit_resource_type", "api") or "api")[:64]
        resource_id = getattr(request.state, "audit_resource_id", None)
        if resource_id and len(str(resource_id)) > 128:
            resource_id = str(resource_id)[:128]
        old_new = getattr(request.state, "audit_old_new", None)
        request_id = getattr(request.state, "request_id", None)
        if request_id and len(str(request_id)) > 64:
            request_id = str(request_id)[:64]
        try:
            async with async_session_factory() as session:
                await log_audit(
                    session,
                    admin_id=aid,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    old_new=old_new,
                    request_id=request_id,
                )
                await session.commit()
            _audit_log.info(
                "audit written",
                extra=extra_for_event(
                    event="audit.written",
                    entity_id=resource_id,
                    actor_id=aid,
                ),
            )
        except Exception as e:
            # Do not re-raise: response already built; avoid turning success into 500
            _log.exception("Audit log write failed (admin_id=%s): %s", aid, e)
        return response
