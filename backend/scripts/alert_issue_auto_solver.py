#!/usr/bin/env python3
"""
Generate suggested GitHub issues from AlphaBot Telegram alert logs.

Input format is the AlphaBot log style used in `ERRORS_TG.md`, e.g.:

    [03.03.2026 05:38] AlphaBot: [P2] VpnHandshakeFreshnessCollapse

Usage:
    python backend/scripts/alert_issue_auto_solver.py ERRORS_TG.md > issues.md

The script is intentionally simple and read-only: it parses alerts, groups them
by type, and prints markdown issue stubs you can paste into your tracker.
"""

from __future__ import annotations

import re
import sys
from collections import Counter
from collections.abc import Iterable, Mapping
from pathlib import Path
from typing import TypedDict


class ParsedAlert(TypedDict):
    timestamp: str
    severity: str
    alert: str


_LINE_RE = re.compile(
    r"""
    \[
      (?P<timestamp>\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2})
    \]\s+AlphaBot:\s+
    \[
      (?P<severity>P[12])
    \]\s+
    (?P<alert>[A-Za-z0-9]+)
    """,
    re.VERBOSE,
)


_ALERT_TEMPLATES: Mapping[str, Mapping[str, str]] = {
    "VpnNoSchedulableNodes": {
        "title": "[P1] No schedulable VPN nodes (scheduler blocked)",
        "body": """\
**Context**

- Alert: `VpnNoSchedulableNodes` (P1) fired {count} time(s) in AlphaBot.
- Scheduler cannot place new peers because no healthy/degraded nodes are schedulable.

**Proposed actions (see `docs/ops/runbook.md#vpn-cluster` and `ERRORS_TG.md` Phase 2)**

- Ensure at least one node is correctly configured and schedulable (public key, `vpn_endpoint`, discovery source).
- Verify node-agent or docker-based nodes are running and heartbeating; fix network / mTLS / allowlists so control-plane sees them.
- Rebuild topology and confirm `vpn_nodes_total{{status=~"healthy|degraded"}} >= 1` in Prometheus and `/admin/servers` shows at least one healthy/degraded node.

**Acceptance criteria**

- `VpnNoSchedulableNodes` does not fire during normal traffic for at least 24 hours.
""",
    },
    "VpnNodeUnhealthy": {
        "title": "[P2] VPN node unhealthy (fix reachability and health score)",
        "body": """\
**Context**

- Alert: `VpnNodeUnhealthy` (P2) fired {count} time(s) in AlphaBot.
- At least one VPN node has status `unhealthy` (health score below floor).

**Proposed actions (see `ERRORS_TG.md` Phase 3)**

- For each unhealthy node, check reachability from control-plane (agent API, docker container, firewall rules, network paths).
- Inspect health score inputs: node health checks and handshake ratio; confirm whether peers on that node are expected to be active.
- Fix underlying issues (agent process, connectivity, misconfigured endpoints) rather than relaxing thresholds.

**Acceptance criteria**

- Unhealthy node count returns to zero for nodes that should be serving peers; `VpnNodeUnhealthy` stops firing in steady state.
""",
    },
    "VpnNodeHealthLow": {
        "title": "[P2] VPN node health below threshold",
        "body": """\
**Context**

- Alert: `VpnNodeHealthLow` (P2) fired {count} time(s) in AlphaBot.
- `vpn_node_health` dropped below the configured threshold, indicating degraded nodes.

**Proposed actions (see `ERRORS_TG.md` Phase 3)**

- Correlate low health scores with node reachability, handshake freshness, and peer activity.
- For nodes that should be in rotation, fix connectivity and reconcile peers so health_score rises above the floor.
- Optionally revisit the threshold only after confirming the current value is too strict for intended idle/active mix.

**Acceptance criteria**

- Nodes that should be schedulable have health scores above the floor; `VpnNodeHealthLow` only fires when there is a genuine degradation.
""",
    },
    "VpnHandshakeFreshnessCollapse": {
        "title": "[P2] VPN handshake max age > 2h (freshness collapse)",
        "body": """\
**Context**

- Alert: `VpnHandshakeFreshnessCollapse` (P2) fired {count} time(s) in AlphaBot.
- `agent_last_handshake_max_age_seconds` exceeded the 2h threshold, meaning peers may appear offline.

**Proposed actions (see `ERRORS_TG.md` Phase 4)**

- Decide whether the affected peers are expected to be active or idle.
- If active: fix connectivity/NAT so clients send traffic, or enable PersistentKeepalive so idle clients still refresh handshakes.
- If intentionally idle: consider relaxing the threshold further (e.g. 4h) in `config/monitoring/alert_rules.yml` and reload Prometheus.

**Acceptance criteria**

- For active peers, handshake age remains within acceptable bounds; for idle-only clusters, alert thresholds and expectations are documented and agreed.
""",
    },
    "VpnHandshakeAgeHigh": {
        "title": "[P2] VPN handshake age high (>30m)",
        "body": """\
**Context**

- Alert: `VpnHandshakeAgeHigh` (P2) fired {count} time(s) in AlphaBot.
- Max WireGuard handshake age exceeded the 30m warning threshold.

**Proposed actions (see `ERRORS_TG.md` Phase 4)**

- If peers should be active, treat this as a connectivity issue: verify endpoints, firewall, and NAT so traffic flows and handshakes refresh.
- If peers are intentionally idle, treat this as informational or consider increasing the threshold to reduce noise.

**Acceptance criteria**

- For active usage periods, handshake age stays below the warning threshold; during idle periods, alert noise is acceptable or thresholds are tuned.
""",
    },
    "HighLatency": {
        "title": "[P2] Admin API high latency on critical paths",
        "body": """\
**Context**

- Alert: `HighLatency` (P2) fired {count} time(s) in AlphaBot.
- p95 latency exceeded 2s for admin-api critical paths (servers, health, cluster).

**Proposed actions (see `ERRORS_TG.md` Phase 5 and `config/monitoring/alert_rules.yml`)**

- Use Grafana/Prometheus to identify which `path_template` drives high latency on critical endpoints.
- Investigate slow endpoints (DB, external dependencies, N+1 queries) and ship targeted optimizations.
- If a single heavy endpoint is expected to be slow, narrow the alert expression to the truly critical paths or raise the threshold.

**Acceptance criteria**

- p95 latency for critical paths remains under 2s during normal load; alert only fires on genuine regressions.
""",
    },
}


def parse_alerts(lines: Iterable[str]) -> list[ParsedAlert]:
    alerts: list[ParsedAlert] = []
    for line in lines:
        m = _LINE_RE.search(line)
        if not m:
            continue
        alerts.append(
            {
                "timestamp": m.group("timestamp"),
                "severity": m.group("severity"),
                "alert": m.group("alert"),
            }
        )
    return alerts


def _print_issue_summaries(alerts: Iterable[ParsedAlert]) -> None:
    counts = Counter(a["alert"] for a in alerts)
    if not counts:
        print("# No AlphaBot alerts found in input.")
        return

    print("# Suggested issues from AlphaBot alerts\n")
    for alert_name, count in counts.most_common():
        template = _ALERT_TEMPLATES.get(alert_name)
        if not template:
            # Unknown or unsupported alert; skip quietly.
            continue
        title = template["title"]
        body_template = template["body"]
        body = body_template.format(count=count)

        print(f"## {title} (x{count})\n")
        print(body.rstrip())
        print()  # Blank line between issues


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(
            "Usage: python backend/scripts/alert_issue_auto_solver.py ERRORS_TG.md",
            file=sys.stderr,
        )
        return 1

    path = Path(argv[1])
    if not path.exists():
        print(f"Input file not found: {path}", file=sys.stderr)
        return 1

    with path.open(encoding="utf-8") as f:
        alerts = parse_alerts(f)

    _print_issue_summaries(alerts)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
