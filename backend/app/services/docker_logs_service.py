"""Container log parsing and redaction helpers."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Literal

from app.core.redaction import redact_for_log
from app.schemas.docker_telemetry import ContainerLogLine

_ERR_RE = re.compile(r"\b(error|exception|fatal|panic|traceback)\b", re.I)
_WARN_RE = re.compile(r"\b(warn|warning|degraded|retry|timeout)\b", re.I)


def classify_log_severity(message: str) -> Literal["error", "warn", "info"]:
    if _ERR_RE.search(message):
        return "error"
    if _WARN_RE.search(message):
        return "warn"
    return "info"


def to_log_line(ts: datetime, stream: str, message: str) -> ContainerLogLine:
    cleaned = redact_for_log(message)
    return ContainerLogLine(
        ts=ts,
        stream="stderr" if stream == "stderr" else "stdout",
        severity=classify_log_severity(cleaned),
        message=cleaned,
    )
