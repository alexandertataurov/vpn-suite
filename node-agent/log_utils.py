"""Minimal JSON logger for node-agent. No extra deps."""

import json
import os
from datetime import datetime, timezone
from typing import Any


def _payload(
    level: str,
    message: str,
    event: str | None = None,
    correlation_id: str | None = None,
    **kw: Any,
) -> dict[str, Any]:
    out: dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "level": level.lower(),
        "message": message,
        "service": "node-agent",
        "env": os.environ.get("ENVIRONMENT", "development"),
    }
    if event:
        out["event"] = event
    if correlation_id:
        out["correlation_id"] = correlation_id
    for k, v in kw.items():
        if v is not None:
            out[k] = v
    return out


def log_info(message: str, event: str | None = None, correlation_id: str | None = None, **kw: Any) -> None:
    print(json.dumps(_payload("info", message, event, correlation_id, **kw), default=str))


def log_warning(message: str, event: str | None = None, correlation_id: str | None = None, **kw: Any) -> None:
    print(json.dumps(_payload("warn", message, event, correlation_id, **kw), default=str), file=__import__("sys").stderr)


def log_error(message: str, event: str | None = None, correlation_id: str | None = None, **kw: Any) -> None:
    print(json.dumps(_payload("error", message, event, correlation_id, **kw), default=str), file=__import__("sys").stderr)
