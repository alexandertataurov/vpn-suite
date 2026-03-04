# Launch KPIs & Observability Map

This document maps the **Day 1 / Week 1 / Month 1** launch KPIs from the release plan to concrete signals in the existing metrics and logs.

It assumes a single-tenant, self-hosted deployment with Prometheus + Grafana already configured via `docker-compose.observability.yml`.

---

## 1. Day 1 — Launch Day

### 1.1 Interest & Awareness

- **Signals**
  - GitHub: stars, watches, issue volume/tags.
  - Website / landing: HTTP access logs and analytics (if enabled).
  - Community: number of posts/threads in target channels (manual).

These are **outside** the control plane. Track them via:

- GitHub Insights / CLI.
- Web analytics on your landing page (if you enable any).

### 1.2 Activation & Install Success

Goal: “How many operators got from `git clone` to a working control plane with at least one device?”

- **Signals (per deployment)**
  - `vpn_suite_info{version="<tag>"}` == 1 — build/version marker.
  - `http_errors_total{path_template="/health/ready", error_type="INTERNAL_ERROR"}` — readiness failures.
  - Admin UI:
    - Successful login (HTTP 200 on `/api/v1/auth/login`).
    - At least one `Device` record and `Server` record in DB.
  - Optional: dashboard traffic:
    - `vpn_node_traffic_rx_bytes`, `vpn_node_traffic_tx_bytes`.

**How to instrument:**

- Add a simple Grafana panel:
  - “Control planes by version” — `sum by (version) (vpn_suite_info)`.
  - “Readiness failures” — `rate(http_errors_total{path_template="/health/ready"}[5m])`.
- Use the existing admin dashboard and `Overview` to verify that:
  - At least one Server is healthy/degraded.
  - At least one Device has been issued and connected.

---

## 2. Week 1 — Usage & Onboarding

### 2.1 Operator Activity

Questions:

- Are operators logging into Admin regularly?
- Are they issuing/revoking devices and rotating configs?

**Metrics (from `app/core/metrics.py`):**

- `vpn_admin_issue_total{status="success"}` — admin-issued peers.
- `vpn_admin_revoke_total{status="success"}` — admin revocations.
- `vpn_admin_rotate_total{status="success"}` — admin key rotations.
- `payment_webhook_total{status="processed"}` — payment events.
- `funnel_events_total{event_type=~"start|payment|issue"}` — funnel steps (bot/webapp).

Example Grafana panels:

- “Admin actions (issue / revoke / rotate)”:

  - Query: `sum by (status) (increase(vpn_admin_issue_total[1d]))`, etc.

- “Funnel events (starts vs issues)”:

  - `increase(funnel_events_total{event_type="start"}[1d])`
  - `increase(funnel_events_total{event_type="issue"}[1d])`

### 2.2 Device & Tunnel Health

**Metrics:**

- `vpn_peer_last_handshake_age_seconds{device_id=...,server_id=...}`
- `vpn_node_traffic_rx_bytes{server_id=...}`, `vpn_node_traffic_tx_bytes{server_id=...}`
- `vpn_server_snapshot_staleness_seconds{server_id=...}`

Example questions to answer from dashboards:

- For a given server, are peers actually sending traffic?
- Are telemetry and snapshots fresh (staleness not growing unbounded)?

---

## 3. Month 1 — Retention, Stability, Revenue

### 3.1 Retention & Stability

Retention at the level of *peers / subscriptions* rather than SaaS accounts:

- **Metrics:**
  - `vpn_revenue_subscriptions_active`
  - `vpn_revenue_mrr`
  - `vpn_revenue_arr`
  - `vpn_revenue_churn_total{reason=...}`
  - `vpn_revenue_renewal_total`
  - `vpn_revenue_payment_total{plan_id=...}`

Use these for:

- “Active subscriptions (timeseries)” — `vpn_revenue_subscriptions_active`.
- “Payments by plan” — `increase(vpn_revenue_payment_total[30d]) by (plan_id)`.
- “Churn reasons (30d)” — `increase(vpn_revenue_churn_total[30d]) by (reason)`.

### 3.2 Errors & Incidents

**Metrics:**

- `http_errors_total{error_type=~"INTERNAL_ERROR|VALIDATION_ERROR"}` — API failures.
- `telemetry_poll_runs_total`, `telemetry_poll_server_failures_total` — polling loop health.
- `health_check_failures_total{server_id=...}` — server health issues.
- `vpn_config_issue_blocked_total{reason=...}` — issuance blocked (e.g., server key not verified).

**Dashboards:**

- “Error budget”:
  - 500-rate on key endpoints (e.g., `/api/v1/servers`, `/api/v1/overview`).
- “Telemetry health”:
  - Success vs failure counts for telemetry poll.
  - Snapshot staleness heatmap per server.

---

## 4. Minimal Alert Set for Launch

To avoid alert fatigue, start with a very small set:

1. **Control-plane down / degraded**
   - Based on `/health/ready` failures (existing alert rules already reference this).
2. **DB / Redis unavailable**
   - Derived from readiness checks and existing Prometheus rules.
3. **No schedulable nodes**
   - Uses `vpn_nodes_total` and scheduler-specific metrics; already wired into `alert_rules.yml`.
4. **Telemetry pipeline stalled**
   - Based on `telemetry_poll_runs_total` and `server_snapshot_staleness_seconds`.

Details and example PromQL are already in:

- `config/monitoring/alert_rules.yml`
- [observability/validation.md](validation.md)

---

## 5. Optional: Operator Feedback (NPS-style)

Surveys and NPS are best done **outside** of the control plane to avoid tracking personal data.

Recommended approach:

- Periodically ask early operators (e.g., in Telegram or via email):
  - “How disappointed would you be if you could no longer use VPN Suite?”
  - “What’s most painful right now?”
  - “What would you miss the least?”

Track responses in your own tooling and correlate them with:

- Error/incident history from Prometheus.
- Adoption metrics (issues, devices, nodes).

