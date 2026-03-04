## Announcing VPN Suite Public Beta — AmneziaWG Control Plane for Homelab Operators

### Why we built this

Running a serious VPN stack today usually means stitching together AmneziaWG/WireGuard nodes, billing, and observability by hand. One host runs configs, another runs a bot, a third runs metrics — and every incident turns into SSH archaeology across half a dozen terminals.

VPN Suite exists so a single operator can run **one control plane** for servers, devices, telemetry, and subscriptions, with a path from homelab to “small but real business” without rewriting everything.

### What VPN Suite is

- **Admin API + dashboard (FastAPI + React)** for servers, devices, plans, subscriptions, and telemetry.
- **Telegram bot** for signup, Telegram Stars billing, and device lifecycle.
- **Node agent** for AmneziaWG hosts (agent mode) with reconcile/drift detection.
- **Observability bundle** (Prometheus, Grafana, Loki) plus focused runbooks for common incidents.

It’s a **self-hosted** control plane: you run it on your own Ubuntu LTS host and connect your own AmneziaWG/WireGuard nodes.

### Who this is for (and not for)

**For:**

- Homelab and small-ops operators who already run (or plan to run) AmneziaWG/WireGuard.
- People comfortable with Docker, docker-compose, and basic Linux operations.
- Operators who want a *single pane of glass* for nodes, devices, telemetry, and billing.

**Not for (yet):**

- Non-technical end users looking for a one-click consumer VPN.
- Multi-tenant, high-scale providers who need strict HA and zero-downtime migrations across dozens of regions.

### What’s ready today

In this Public Beta you get:

- Single-tenant control plane for AmneziaWG clusters.
- Admin UI for servers/devices/plans, with key rotation and reconcile flows.
- Telegram bot with Telegram Stars payments and basic referral/promo support.
- Node-agent integration for AmneziaWG hosts (agent mode) and initial observability stack (Prometheus + Grafana + Loki).
- Runbooks for install, hardening, no-traffic incidents, telemetry issues, and backups.

Known limitations (Beta):

- Single-tenant focus; multi-tenant hosting is not a supported configuration.
- Limited HA story (single control-plane host; you are expected to handle host-level redundancy).
- Payments flow is focused on Telegram Stars; other providers would require custom work.

### How to get started

1. **Read the README:** persona, scope, and caveats — `README.md`.
2. **Install on Ubuntu LTS (lab or staging):** follow [docs/ops/install-ubuntu-lts.md](../ops/install-ubuntu-lts.md).
3. **Apply the hardening baseline:** [docs/ops/hardening-reference-ubuntu.md](../ops/hardening-reference-ubuntu.md).
4. **Bring up observability:** `./manage.sh up-monitoring` and validate using [docs/observability/validation.md](../observability/validation.md) and [docs/observability/launch-kpis.md](../observability/launch-kpis.md).
5. **Attach at least one AmneziaWG node and issue a device:** use agent mode via [docs/ops/agent-mode-one-server.md](../ops/agent-mode-one-server.md), then issue a test device from the Admin UI.

Once that’s stable, rehearse backup/restore with `./manage.sh backup-db` and `./manage.sh restore-db --force <dump>` as described in [docs/ops/runbook.md](../ops/runbook.md).

### How to give feedback

- **GitHub Issues:** bugs, rough edges, and docs gaps are all welcome.
- **Telegram operator channel:** for announcements, real-time questions, and incident coordination (link in `README.md` once public).
- **Early adopter stories:** if you’re running a real cluster with non-trivial peers, we’d love anonymized metrics and “what hurt most” notes — see criteria in [docs/marketing/public-beta-launch-outline.md](public-beta-launch-outline.md).

If you try VPN Suite during this Public Beta, please assume the maintainers are listening closely: your incidents and growth stories will shape what becomes stable vs experimental in the first tagged release.

