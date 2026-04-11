# VPN Admin Control Center — Comprehensive Todo

Generated from implementation audit. Order: bugs first, then high-value features, then polish.

---

## Bugs

| ID | Item | Location | Notes |
|----|------|----------|--------|
| B1 | ~~Fix list_abuse_signals: remove undefined count_q reference~~ | `apps/admin-api/app/api/v1/admin_abuse.py` | Done: line 53 referenced count_q; removed. |

---

## Backend

| ID | Item | Location | Notes |
|----|------|----------|--------|
| BE1 | Add DELETE retention rule endpoint | `admin_retention.py` | `DELETE /admin/retention/rules/{rule_id}` |
| BE2 | Abuse actions API: suspend user / revoke devices for user | `admin_abuse.py` | e.g. POST `/admin/abuse/signals/{id}/action` with body `{ "action": "revoke_devices" \| "suspend_user" }`; call existing devices revoke or user suspend |
| BE3 | Promo campaigns API | New router or under pricing | CRUD for promo_campaigns (list, create, update, delete); optional link to retention/discount flows |
| BE4 | Payment monitor: list recent webhook errors (optional) | `admin_payments_monitor.py` | GET `/admin/payments/webhook-errors` with last N PaymentEvent rows where event_type like %error% |
| BE5 | Revenue overview: ensure Redis cache value is JSON-serializable | `admin_revenue.py` | `data` from get_revenue_overview may have Decimal; use default=str or convert before json.dumps |

---

## Frontend — Abuse & Risk

| ID | Item | Location | Notes |
|----|------|----------|--------|
| FE1 | Abuse page: link to User detail from User ID | `AbuseRisk.tsx` | e.g. `<Link to={\`/users/${r.user_id}\`}>${r.user_id}</Link>` |
| FE2 | Abuse page: action buttons (Revoke devices, Suspend) when backend has BE2 | `AbuseRisk.tsx` | Call new action endpoint; confirm modal; invalidate list |
| FE3 | Abuse page: filters (resolved yes/no, user_id) | `AbuseRisk.tsx` | Query params: resolved, user_id; pass to API |

---

## Frontend — Retention

| ID | Item | Location | Notes |
|----|------|----------|--------|
| FE4 | Retention: edit rule (open modal with existing rule, PATCH on save) | `RetentionAutomation.tsx` | Reuse same form as create; populate from selected rule; call PATCH `/admin/retention/rules/{id}` |
| FE5 | Retention: delete rule (with confirm) + DELETE endpoint (BE1) | `RetentionAutomation.tsx` | Button per row; ConfirmDanger; call DELETE |

---

## Frontend — Pricing

| ID | Item | Location | Notes |
|----|------|----------|--------|
| FE6 | Pricing page: list plans + “Edit price” per plan | `PricingEngine.tsx` | GET `/plans`, show table; “Edit price” opens modal (new price, reason, optional revenue_impact); POST `/admin/pricing/plans/{plan_id}/price` |
| FE7 | Pricing page: show plan name (not only plan_id) | `PricingEngine.tsx` | Either join from plans in API or fetch plan names in frontend for display |

---

## Frontend — Revenue & Dashboard

| ID | Item | Location | Notes |
|----|------|----------|--------|
| FE8 | Revenue page: add simple time-series chart (e.g. revenue 7d/30d by day) | `Revenue.tsx` | Backend: optional endpoint for daily revenue series or derive from existing; ECharts line/bar |
| FE9 | Dashboard: optional Server telemetry strip | `Dashboard.tsx` | Summary of server health (e.g. from existing overview/telemetry API): count OK/degraded/down, link to /telemetry |

---

## Frontend — Payments & DevOps

| ID | Item | Location | Notes |
|----|------|----------|--------|
| FE10 | Payments monitor: show success/failed/pending + refund rate in cards | `PaymentsMonitor.tsx` | Already in API; ensure UI shows success_24h, failed_24h, pending_count, refund_rate_30d |
| FE11 | Payments monitor: optional table of recent webhook errors (if BE4) | `PaymentsMonitor.tsx` | Table of PaymentEvent rows |
| FE12 | DevOps: link to cluster/servers or reconciliation docs | `DevOps.tsx` | Optional “View servers” / “Cluster” link |

---

## Frontend — Settings & Security

| ID | Item | Location | Notes |
|----|------|----------|--------|
| FE13 | Settings: 2FA (TOTP) section | `Settings.tsx` | Backend has `/auth/totp/setup` and `/auth/totp/disable`. Add “Enable 2FA” (call setup, show QR or secret), “Disable 2FA” (confirm + disable) |
| FE14 | (Optional) Admin IP whitelist config UI | Settings or new page | Only if backend supports admin IP whitelist (no endpoint found in audit) |

---

## Frontend — Navigation & UX

| ID | Item | Location | Notes |
|----|------|----------|--------|
| FE15 | Command palette + nav: add Revenue, Abuse, Retention, Churn, DevOps, Cohorts | `AdminLayout.tsx` | commandItems already built from navItems; verify all new routes are in allNavItems (done) and have “Go to X” entries |
| FE16 | Pagination on list pages | Abuse, Retention, Pricing history, Cohorts | Add offset/limit controls and “total” display where missing |

---

## Optional / Later

| ID | Item | Notes |
|----|------|--------|
| O1 | Promo campaigns UI | Full CRUD when BE3 exists |
| O2 | Cohort export: Prometheus/Grafana format | Beyond CSV |
| O3 | Churn: “Apply retention campaign” bulk action | Apply selected retention rule to high-risk users |
| O4 | Audit log: ensure admin control center actions logged | Verify audit middleware logs price change, retention run, abuse resolve, etc. |
| O5 | Server telemetry panel: per-server load/CPU/peers in dashboard | Deeper than FE9 |

---

## Summary counts

- Bugs: 1 (fixed)
- Backend: 5
- Frontend Abuse/Retention/Pricing: 7
- Frontend Revenue/Dashboard/Payments/DevOps: 5
- Frontend Settings/Nav: 2
- Optional: 5
