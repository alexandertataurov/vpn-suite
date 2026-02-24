# Alert Policy

**Purpose:** Define thresholds and escalation for enterprise-grade observability.

---

## Thresholds

### CPU & Memory

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| CPU sustained >80% (5m) | 5 min avg | Warning | Scale or investigate |
| CPU sustained >95% (5m) | 5 min avg | Critical | Immediate investigation |
| Memory >85% | Node | Warning | Add RAM or tune |
| Memory >95% | Node | Critical | OOM risk; evacuate load |

### Control-Plane

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Reconciliation failure rate >5% | 15 min | Warning | Check agent connectivity |
| Reconciliation failure rate >20% | 15 min | Critical | Control-plane degraded |
| Agent heartbeat stale >10 min | Per agent | Warning | Node unreachable |
| Rebalance failures | Any | Warning | Load balancer issue |

### Auth & Abuse

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Login failures >50/min (global) | 1 min | Warning | Possible brute force |
| Login failures >200/min (global) | 1 min | Critical | DDoS or credential stuffing |
| Rate limit hits >100/min | 1 min | Warning | Abuse or misconfiguration |
| JWT validation failures spike | 5 min | Warning | Token abuse or misconfig |

### Payments

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Payment failure rate >10% | 1 hour | Warning | Provider or config issue |
| Webhook signature failures | Any | Critical | Possible tampering |

### VPN / Reconnect

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Reconnect burst >500 in 5 min | Cluster | Warning | DDoS or network event |
| Peer count anomaly (>2σ) | Per node | Warning | Abuse or leak |

### Infrastructure

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Postgres connections >80% of max | Connection pool | Warning | Connection leak |
| Redis hit rate <70% | 15 min | Warning | Cache ineffective |
| Redis memory >maxmemory | Redis | Critical | Eviction or OOM |
| Disk >85% | Node | Warning | Cleanup or expand |

---

## Alert Channels

| Severity | Channel | Response SLA |
|----------|---------|--------------|
| Critical | Pager / SMS | 15 min |
| Warning | Slack / Email | 1 hour |
| Info | Dashboard only | — |

---

## Prometheus Rules

Rules are defined in `config/monitoring/alert_rules.yml`. Ensure Alertmanager is configured to route to the above channels.

---

## Runbooks

Link alerts to runbooks:

- `incident-response-runbook.md` — Compromise scenarios
- `../ops/runbook.md` — Operational procedures
