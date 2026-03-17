from __future__ import annotations

from collections.abc import Mapping
from typing import Any


def assert_error_response(
    body: Mapping[str, Any],
    code: str,
    message_substring: str | None = None,
) -> None:
    """
    Assert unified error envelope produced by error_body().

    Expected shape:
    {
        "success": False,
        "error": {"code": "...", "message": "...", ...},
        "meta": {"request_id": "...", ...},
        ...
    }
    """
    if "success" in body:
        assert body["success"] is False
    error = body.get("error") or {}
    assert error.get("code") == code
    if message_substring is not None:
        assert message_substring in (error.get("message") or "")
    meta = body.get("meta") or {}
    assert "request_id" in meta

