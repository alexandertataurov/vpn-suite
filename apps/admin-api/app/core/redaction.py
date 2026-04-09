"""Redact secrets from strings before logging. Never log raw passwords, tokens, or keys."""

import re
from typing import Any

# Patterns to redact (case-insensitive); value replaced with REDACTED
_SECRET_KEYS = re.compile(
    r"\b(password|secret_key|secret|api_key|authorization|bearer|token|refresh_token|access_token|private_key|privatekey|confirm_token|telegram_token|bot_token)\s*[:=]\s*[\"']?([^\"'\s,}\]]+)[\"']?",
    re.I,
)
_BEARER = re.compile(r"Bearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", re.I)
# WireGuard PrivateKey line (config or JSON)
_PRIVATEKEY_LINE = re.compile(r"(PrivateKey|private_key)\s*[=:]\s*[A-Za-z0-9+/=]{40,}", re.I)
# Config download URL token: .../configs/{token}/download or /config/{token}/download
_CONFIG_TOKEN_URL = re.compile(r"(/configs?/)[A-Za-z0-9_-]{10,}(/download)", re.I)
_CONFIG_TOKEN_QUERY = re.compile(r"token=[A-Za-z0-9_-]{10,}", re.I)


def redact_for_log(s: str | None) -> str:
    """Return string safe for logging: secrets, Bearer tokens, private keys, config tokens replaced with REDACTED."""
    if s is None or not isinstance(s, str):
        return ""
    out = _BEARER.sub("Bearer REDACTED", s)
    out = _SECRET_KEYS.sub(r"\1=REDACTED", out)
    out = _PRIVATEKEY_LINE.sub(r"\1=REDACTED", out)
    out = _CONFIG_TOKEN_URL.sub(r"\1REDACTED\2", out)
    out = _CONFIG_TOKEN_QUERY.sub("token=REDACTED", out)
    return out


def redact_dict(d: dict[str, Any] | None, keys: list[str]) -> dict[str, Any]:
    """Return copy of dict with sensitive keys masked. Keys matched case-insensitively."""
    if d is None:
        return {}
    out = dict(d)
    keys_lower = {k.lower() for k in keys}
    for k in list(out.keys()):
        if k.lower() in keys_lower:
            out[k] = "REDACTED"
    return out


def mask_sensitive(value: str | None, pattern: str = "*") -> str:
    """Mask a value for ad-hoc logging. Returns REDACTED if value looks sensitive else value."""
    if value is None or not value:
        return ""
    if redact_for_log(value) != value:
        return "REDACTED"
    if value.strip().lower().startswith("bearer "):
        return "REDACTED"
    return value
