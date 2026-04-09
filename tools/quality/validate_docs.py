#!/usr/bin/env python3
"""Validate key markdown links and a small set of doc-structure guardrails."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MARKDOWN_LINK_RE = re.compile(r"\[[^\]]+\]\(([^)#]+)")

TARGET_FILES = [
    Path("README.md"),
    Path("docs/README.md"),
    Path("docs/frontend/README.md"),
    Path("docs/guides/development-guide.md"),
    Path("docs/guides/operations-guide.md"),
    Path("docs/guides/observability-guide.md"),
    Path("docs/spec-pack/README.md"),
    Path("docs/frontend/admin-design-system/README.md"),
    Path("docs/frontend/miniapp-app.md"),
    Path("docs/frontend/miniapp-design-system-overview.md"),
    Path("docs/frontend/miniapp-design-system/README.md"),
]

LEGACY_ACTIVE_DIRS = [
    Path("docs/audit"),
    Path("docs/design"),
]


def iter_missing_links() -> list[str]:
    errors: list[str] = []
    for rel_path in TARGET_FILES:
        path = ROOT / rel_path
        if not path.exists():
            errors.append(f"missing validation target: {rel_path}")
            continue

        text = path.read_text(encoding="utf-8")
        for raw_target in MARKDOWN_LINK_RE.findall(text):
            if "://" in raw_target or raw_target.startswith("#") or raw_target.startswith("mailto:"):
                continue
            target = (path.parent / raw_target).resolve()
            if not target.exists():
                errors.append(f"{rel_path}: missing link target {raw_target}")
    return errors


DISALLOWED_ACTIVE_DIRS = [
    Path("docs/audit"),
    Path("docs/design"),
]


def iter_disallowed_dir_errors() -> list[str]:
    errors: list[str] = []
    for rel_path in DISALLOWED_ACTIVE_DIRS:
        path = ROOT / rel_path
        if path.exists() and any(path.iterdir()):
            errors.append(
                f"disallowed docs namespace still populated: {rel_path} "
                f"(move contents under canonical docs/ paths)"
            )
    return errors


def main() -> int:
    errors = [*iter_missing_links(), *iter_disallowed_dir_errors()]
    if errors:
        print("Documentation validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Documentation validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
