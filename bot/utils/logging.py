"""Structured logging configuration. JSON output, no secrets."""

import logging
import os
import structlog


def _inject_correlation_id(logger, method_name, event_dict):
    """Add correlation_id from context to every log."""
    try:
        from utils.context import correlation_id_ctx
        cid = correlation_id_ctx.get()
        if cid:
            event_dict["correlation_id"] = cid
    except Exception:
        pass
    return event_dict


def _inject_service_context(logger, method_name, event_dict):
    """Add service, env to every log."""
    event_dict["service"] = "telegram-vpn-bot"
    event_dict["env"] = os.environ.get("ENVIRONMENT", "development")
    return event_dict


def _resolve_log_level() -> int:
    level = os.environ.get("LOG_LEVEL", "").strip().upper()
    if level in ("DEBUG", "INFO", "WARNING", "WARN", "ERROR"):
        return getattr(logging, "WARNING" if level == "WARN" else level)
    return logging.DEBUG if os.environ.get("ENVIRONMENT", "").lower() == "development" else logging.INFO


def setup_logging():
    """Configure structured logging for production."""
    root = logging.getLogger()
    if not root.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(message)s"))
        root.addHandler(handler)
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            _inject_service_context,
            _inject_correlation_id,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    root.setLevel(_resolve_log_level())


def get_logger(name: str):
    """Return a structured logger instance."""
    return structlog.get_logger(name)
