"""Per-request DB query count and time for observability."""

import time
from contextvars import ContextVar

_db_request_context: ContextVar[dict | None] = ContextVar("db_request_context", default=None)


def set_request_context() -> None:
    """Start tracking DB metrics for this request. Call from middleware at request start."""
    _db_request_context.set({"durations": [], "starts": []})


def _get_ctx() -> dict | None:
    return _db_request_context.get()


def before_cursor_execute() -> None:
    """Call from SQLAlchemy before_cursor_execute."""
    ctx = _get_ctx()
    if ctx is not None:
        ctx["starts"].append(time.perf_counter())


def after_cursor_execute() -> None:
    """Call from SQLAlchemy after_cursor_execute."""
    ctx = _get_ctx()
    if ctx is not None and ctx["starts"]:
        start = ctx["starts"].pop()
        ctx["durations"].append(time.perf_counter() - start)


def get_and_reset() -> tuple[int, float]:
    """Return (query_count, total_seconds) and clear context. Call from middleware at request end."""
    ctx = _get_ctx()
    if ctx is None or not ctx["durations"]:
        return (0, 0.0)
    count = len(ctx["durations"])
    total = sum(ctx["durations"])
    _db_request_context.set({"durations": [], "starts": []})
    return (count, total)
