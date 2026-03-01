"""Schemas for admin frontend telemetry batch ingestion."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

FrontendTelemetryEventName = Literal[
    "page_view",
    "api_request",
    "api_error",
    "frontend_error",
    "user_action",
    "servers_list_fetch",
    "servers_sync",
    "server_delete",
    "parsing_error",
    "stale_detected",
    "login_success",
    "login_failure",
    "navigation",
    "filter_change",
    "sort_change",
    "sync_action",
    "reissue_action",
    "incident_action",
    "web_vital",
]


class FrontendTelemetryEventIn(BaseModel):
    event: FrontendTelemetryEventName
    payload: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)
    ts: datetime


class FrontendTelemetryBatchIn(BaseModel):
    schema_version: str = Field(default="1.0", alias="schemaVersion")
    events: list[FrontendTelemetryEventIn] = Field(default_factory=list, max_length=200)
    sent_at: datetime | None = Field(default=None, alias="sentAt")

    model_config = {"populate_by_name": True}


class FrontendTelemetryBatchOut(BaseModel):
    accepted: int
    dropped: int
    request_id: str | None = None
