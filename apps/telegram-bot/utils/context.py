"""Context vars for request-scoped correlation (e.g. per Telegram update)."""

from contextvars import ContextVar

correlation_id_ctx: ContextVar[str | None] = ContextVar("correlation_id", default=None)
