## Public Beta Demo Script — VPN Suite (5–7 minutes)

### 1. Intro (30–45s)

- Who you are and what you’re demoing.
- Problem framing:
  - “Running a serious VPN means juggling nodes, configs, billing, and observability.”
  - “VPN Suite gives you a single control plane for AmneziaWG clusters, devices, payments, and telemetry.”
- Set expectation:
  - “This is a self-hosted control plane for homelab / small-ops operators, not a consumer VPN.”

### 2. Install & Login (1–2 min)

**On terminal (host shown on screen):**

1. Show repo and env:
   - `cd /opt/vpn-suite`
   - Briefly open `.env` and point out:
     - `PUBLIC_DOMAIN`
     - `NODE_MODE=agent`, `NODE_DISCOVERY=agent`
     - `TELEMETRY_PROMETHEUS_URL`
2. Start core and monitoring (if not already running):
   - `./manage.sh up-core`
   - `./manage.sh up-monitoring`
3. Mention migrations/seed:
   - “For a fresh install you’d run `./manage.sh migrate` and `./manage.sh seed` — see `docs/ops/install-ubuntu-lts.md`.”

**In browser:**

4. Open `https://<PUBLIC_DOMAIN>/admin` and log in with the admin account created during seed.
5. Show the Overview page briefly:
   - Servers count.
   - Devices count.
   - High-level health state.

### 3. Attach Node & Issue Device (2–3 min)

**Explain node model (voice + quick diagram if desired):**

- “Each AmneziaWG host runs a node-agent that talks to the control plane over mTLS.”
- “Control plane treats those nodes as schedulable capacity; configs are issued via the API/UI/bot.”

**On terminal for a single node (brief):**

1. Mention `docs/ops/agent-mode-one-server.md` and show the key command:
   - `./manage.sh up-agent` on the node, with `AGENT_SHARED_TOKEN` matching control plane.
2. Show that the node is already attached:
   - Back in Admin UI, open Servers page.
   - Point to at least one server with `agent` discovery and healthy/degraded status.

**In Admin UI (devices flow):**

3. Create a test user:
   - Go to Users page → “New user” → fill email/name → save.
4. Issue a device:
   - Devices page → “New device” → select user and server/plan → issue.
5. Show config options:
   - Download AmneziaWG config file or copy an Amnezia VPN key.

**Optional (if you can show client):**

6. Switch to Amnezia client, import config, and connect.
7. Back in Admin UI, refresh server/device views to show:
   - Handshake present.
   - Traffic counters moving.

### 4. Telemetry & Ops (1–2 min)

**Admin UI:**

1. Open Overview / Telemetry pages:
   - Show servers list with health state.
   - Point out device counts and status.

**Grafana:**

2. Switch to Grafana (using the profile from `./manage.sh up-monitoring`):
   - Open:
     - `VPN Suite - Node Health` → show handshake age and traffic per server.
     - `VPN Suite - Executive Overview` → show MRR/ARR placeholders and cluster health.
3. Call out launch KPIs:
   - “Day 1: activation from `git clone` to first device (`vpn_suite_info`, readiness failures, first device traffic).”
   - “Week 1: admin activity (`vpn_admin_issue_total`, `vpn_admin_revoke_total`, `vpn_admin_rotate_total`).”
   - “Month 1: revenue and churn (`vpn_revenue_*` metrics).”

### 5. Closing (30–45s)

- Summarize:
  - “You’ve seen a full path from install, through node attach and device issuance, to telemetry and alerts.”
- Call out what’s production-ready vs experimental:
  - Single-tenant control plane and agent mode are the focus.
  - HA/multi-tenant are future work; payments are Telegram Stars–first.
- Point to next steps:
  - Install + hardening docs: `docs/ops/install-ubuntu-lts.md`, `docs/ops/hardening-reference-ubuntu.md`.
  - Ops runbook and incidents: `docs/ops/runbook.md`.
  - Observability and launch KPIs: `docs/observability/launch-kpis.md`.
  - Announcement and beta details: `docs/marketing/public-beta-announcement.md`.

