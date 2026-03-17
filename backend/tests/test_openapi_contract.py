"""Contract test: OpenAPI spec must match FastAPI routes (normalized path params)."""

from __future__ import annotations

import re
from pathlib import Path

import pytest
import yaml
from fastapi.routing import APIRoute

from app.main import app

# Backend root (parent of tests/); openapi may live in backend/docs or repo root docs/
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
ROOT = _BACKEND_ROOT.parent


def _openapi_spec_path() -> Path | None:
    for base in (ROOT / "openapi", ROOT / "docs", _BACKEND_ROOT / "docs"):
        p = base / "openapi.yaml" if base.name == "openapi" else base / "api" / "openapi.yaml"
        if p.exists():
            return p
    return None


def _norm_path(path: str) -> str:
    return re.sub(r"\{[^}]+\}", "{}", path)


def _spec_paths() -> set[tuple[str, str]]:
    path = _openapi_spec_path()
    if not path:
        pytest.skip("openapi/openapi.yaml not found (run ./manage.sh openapi from repo root)")
    spec = yaml.safe_load(path.read_text())
    out: set[tuple[str, str]] = set()
    for path, ops in (spec.get("paths") or {}).items():
        for method in ops.keys():
            if method.lower() in {"get", "post", "put", "patch", "delete", "options", "head"}:
                out.add((method.upper(), _norm_path(path)))
    return out


def _code_paths() -> set[tuple[str, str]]:
    out: set[tuple[str, str]] = set()
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        if getattr(route, "include_in_schema", True) is False:
            continue  # Exclude compatibility aliases (e.g. /api/telemetry without /v1)
        methods = [m for m in route.methods if m not in {"HEAD", "OPTIONS"}]
        for m in methods:
            out.add((m, _norm_path(route.path)))
    return out


def test_openapi_matches_routes() -> None:
    spec_paths = _spec_paths()
    code_paths = _code_paths()

    missing_in_spec = code_paths - spec_paths
    stale_in_spec = spec_paths - code_paths

    assert not missing_in_spec, f"Missing in OpenAPI: {sorted(missing_in_spec)}"
    assert not stale_in_spec, f"Stale in OpenAPI: {sorted(stale_in_spec)}"
