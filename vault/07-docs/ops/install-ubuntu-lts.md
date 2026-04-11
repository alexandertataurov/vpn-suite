# First Install Guide — Ubuntu LTS (Single-Node Control Plane)

This guide walks a homelab / small-ops user through a **fresh install** of the VPN Suite control plane on a single Ubuntu LTS host.

- Target OS: **Ubuntu Server 22.04 / 24.04 LTS**
- Topology: one host for control plane; AmneziaWG nodes configured separately.

⚠️ **Production:** combine this with the [[07-docs/ops/hardening-reference-ubuntu|Hardening Reference]] before exposing the system to the internet.

---

## 1. Prepare the Host

Log in as a sudo-capable user.

```bash
sudo apt-get update
sudo apt-get install -y \
  ca-certificates curl git \
  docker.io docker-compose-v2

sudo systemctl enable --now docker

# Optional but recommended: allow your user to run docker without sudo
sudo usermod -aG docker "$USER"
newgrp docker
```

Verify Docker:

```bash
docker ps
docker compose version
```

---

## 2. Clone the Repository

```bash
cd /opt
sudo mkdir -p vpn-suite
sudo chown "$USER":"$USER" vpn-suite
cd vpn-suite

git clone https://github.com/alexandertataurov/vpn-suite.git .
```

Optionally, check out a tagged release:

```bash
git fetch --tags
git checkout v0.1.0-rc.1  # example
```

---

## 3. Configure Environment (.env)

Start from the example:

```bash
cp .env.example .env
chmod 600 .env
```

Edit `.env` and set at minimum:

- `ENVIRONMENT=production` (or `staging` while testing).
- `PUBLIC_DOMAIN=your.vpn-domain.example`.
- `SECRET_KEY` — random ≥32 chars (e.g. `openssl rand -base64 32`).
- `POSTGRES_PASSWORD` — strong password.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` — admin UI login.
- `NODE_MODE=agent` and `NODE_DISCOVERY=agent` for production.
- `AGENT_SHARED_TOKEN` — random ≥32 chars, shared with node-agent.

For the full list, see [[07-docs/ops/required-secrets|ops/required-secrets.md]].

---

## 4. Bring Up the Core Stack

From `/opt/vpn-suite`:

```bash
./manage.sh verify          # lint + migrations + frontend checks + config-validate
./manage.sh up-core         # admin-api, postgres, redis, reverse-proxy, bot
./manage.sh migrate         # apply DB migrations
./manage.sh seed            # create initial admin user
```

Optional monitoring:

```bash
./manage.sh up-monitoring  # Prometheus, Grafana, Loki, etc.
```

For a **one-command bootstrap** on a fresh lab/staging host, you can also use:

```bash
./manage.sh bootstrap
```

This wraps verification, migrations, seeding, and agent-mode setup. For production, prefer the explicit step-by-step flow above plus the [[07-docs/ops/hardening-reference-ubuntu|Hardening Reference]].

Validation (on the host):

```bash
curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1:8000/health/ready || true
docker compose ps
```

---

## 5. Access the Admin Panel

From your laptop:

- Admin UI: `https://<PUBLIC_DOMAIN>/admin`
- API: `https://<PUBLIC_DOMAIN>/api/v1`

Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

In Admin:

1. Confirm `Overview` shows cluster status.
2. Create at least one **Server** record pointing at an AmneziaWG node.
3. Create at least one **Plan** for device issuance/billing.

---

## 6. Attach a Node (Agent Mode)

On each VPN node (AmneziaWG host), follow the agent-mode guide:

- [[07-docs/ops/agent-mode-one-server|ops/agent-mode-one-server.md]]

Key points:

- Install docker and node-agent.
- Configure `AGENT_SHARED_TOKEN`, `SERVER_ID`, and control-plane URL.
- Start node-agent and confirm heartbeats appear in `/admin/servers`.

---

## 7. Issue a Test Device

With at least one Server and an active Plan:

1. In Admin UI, create a test user.
2. Issue a device for that user (or via Telegram bot if configured).
3. Download AmneziaWG config or use the Amnezia key.
4. Import into AmneziaWG client and connect.

Verification:

- Device appears as **active**.
- Handshake and traffic visible in `/admin/servers` and `/admin/telemetry`.

---

## 8. Common Pitfalls & Where to Look

- **502 / 500 on Admin UI** → see [[07-docs/ops/runbook#troubleshooting|ops/runbook.md]].
- **No traffic but handshake OK** → [[07-docs/ops/no-traffic-troubleshooting|no-traffic-troubleshooting.md]].
- **Configs not working / missing** → [[07-docs/ops/config-not-working-checklist|config-not-working-checklist.md]] and [[07-docs/ops/config-not-found-deep-dive|config-not-found-deep-dive.md]].
- **Telemetry missing/stale** → [[07-docs/ops/telemetry-degraded-troubleshooting|telemetry-degraded-troubleshooting.md]].

✨ **Next step (recommended):** once the basic flow works, apply the [[07-docs/ops/hardening-reference-ubuntu|hardening reference]] on this host and rehearse backup/restore using `./manage.sh backup-db` and `./manage.sh restore-db`.

