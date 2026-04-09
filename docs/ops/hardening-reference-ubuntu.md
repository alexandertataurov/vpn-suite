# Production Hardening Reference — Ubuntu LTS (Control Plane Host)

**Scope:** opinionated, minimal hardening baseline for a *single* Ubuntu LTS host running the VPN Suite **control plane only** (admin-api, reverse-proxy, Postgres, Redis, bot, observability stack).  
**Out of scope:** VPN data-plane nodes, multi-tenant hosting, full compliance frameworks.

⚠️ **Treat this as a reference, not a complete security review.** Always adapt to your environment and policies.

---

## 1. Assumptions & Prerequisites

- OS: Ubuntu Server 22.04 LTS or 24.04 LTS (fresh or dedicated VM).
- Host dedicated to vpn-suite-* containers (no unrelated apps).
- SSH access with sudo.
- Control-plane deployed at `/opt/vpn-suite` via git clone.

Before applying hardening:

- Control plane already runs and passes:
  - `./manage.sh verify`
  - `./manage.sh up-core`

---

## 2. Secrets & Auth Baseline

Follow the main [Hardening Guide](../security/hardening.md#1-secrets--auth), then apply on the reference host:

```bash
cd /opt/vpn-suite

# 1) Ensure .env and secrets/ exist and are correct for this host
ls -l .env secrets/

# 2) Lock down file permissions
./infra/scripts/ops/harden-secrets.sh
```

Checklist (control-plane host):

- `.env` and everything under `secrets/` have mode `600` and owned by the service user.
- In `.env`:
  - `SECRET_KEY` ≥ 32 chars, non-default.
  - `ADMIN_PASSWORD` strong, unique for this environment.
  - `POSTGRES_PASSWORD` strong, not reused elsewhere.
  - `AGENT_SHARED_TOKEN` ≥ 32 chars (if `NODE_MODE=agent` or `NODE_DISCOVERY=agent`).
  - All confirm tokens (`BAN_CONFIRM_TOKEN`, `BLOCK_CONFIRM_TOKEN`, `RESTART_CONFIRM_TOKEN`, `REVOKE_CONFIRM_TOKEN`) non-default.

---

## 3. Network Hardening (UFW + Metadata Blocking)

Goal: expose **only** SSH + HTTPS endpoints; keep internals on localhost.

From [Hardening Guide — Network](../security/hardening.md#2-network):

```bash
cd /opt/vpn-suite

# 1) Remove legacy 8000 exposure, if any
sudo ./infra/scripts/ops/ufw-remove-8000.sh

# 2) Block cloud metadata endpoints (IMDS) from containers and host
sudo ./infra/scripts/ops/block-metadata-endpoints.sh
```

Then, enforce a minimal UFW policy (adapt if you use a different firewall):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH from your management IP ranges (example: office + VPN)
sudo ufw allow from <your_admin_cidr> to any port 22 proto tcp

# HTTPS for admin/API (Caddy reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Optional: agent mTLS port if external nodes connect via 8443
sudo ufw allow 8443/tcp

sudo ufw enable
sudo ufw status verbose
```

Validation:

- From your laptop: `curl -v https://<PUBLIC_DOMAIN>/health` returns 200.
- Ports 22/80/443(/8443) are reachable; Postgres/Redis are **not** exposed on host ports.
- `ufw status` shows no stray `allow 8000` rules.

Rollback (if locked out or misconfigured):

- Use provider console/VNC/DRAC to access the host.
- Run: `sudo ufw reset` to clear rules, then re-apply with corrected CIDRs.

---

## 4. Host OS Hardening (Baseline)

From [Hardening Guide — Host OS](../security/hardening.md#3-host-os):

```bash
cd /opt/vpn-suite

# 1) nf_conntrack & kernel tuning
sudo sysctl -p infra/scripts/ops/sysctl-hardening.conf

# 2) Install and configure fail2ban for sshd
sudo ./infra/scripts/ops/setup-fail2ban.sh
```

Manual SSH hygiene (edit `/etc/ssh/sshd_config` and restart sshd):

- `PasswordAuthentication no`
- `PermitRootLogin no`

Then:

```bash
sudo systemctl restart ssh
```

Enable unattended security updates:

```bash
sudo apt-get update
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Validation:

- SSH key-only login works from your admin workstation(s).
- Fail2ban is active: `sudo systemctl status fail2ban`.
- `sysctl -a | grep nf_conntrack` reflects values from `infra/scripts/ops/sysctl-hardening.conf`.

---

## 5. Control Plane Validation After Hardening

On the hardened host:

```bash
cd /opt/vpn-suite

./manage.sh verify
./manage.sh up-core

curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1:8000/health/ready || true
```

External checks (from operator workstation):

- `curl -v https://<PUBLIC_DOMAIN>/health`
- `curl -v https://<PUBLIC_DOMAIN>/api/v1/servers?limit=1&offset=0`
- Log into Admin UI at `https://<PUBLIC_DOMAIN>/admin` and confirm:
  - Overview dashboard loads.
  - At least one Server is visible and healthy/degraded.

Smoke checklist:

- Database and Redis reachable only from containers.
- Bot HTTP port (8090) is not directly exposed to the public internet.
- Monitoring stack, if enabled, is reachable only from the control-plane host (127.0.0.1 bindings).

---

## 6. Reference Runbook Snippet

**When provisioning a new Ubuntu LTS control-plane host:**

1. Install Docker + docker compose plugin, clone repo to `/opt/vpn-suite`.
2. Configure `.env` and secrets per [required-secrets.md](required-secrets.md), then run `./infra/scripts/ops/harden-secrets.sh`.
3. Apply UFW + metadata blocking as above.
4. Apply host hardening (sysctl, fail2ban, SSH key-only).
5. Deploy stack via `./manage.sh verify` → `./manage.sh up-core` → `./manage.sh migrate` → `./manage.sh seed`.
6. Run basic health/smoke checks (health endpoints, Admin UI, at least one test device).
7. Establish a **reference backup & rollback rehearsal**:
   - Take a fresh DB backup: `./manage.sh backup-db` (see [runbook.md](runbook.md) and [postgres-safeguards.md](postgres-safeguards.md)).
   - On a staging or throwaway host, restore from that dump using `./manage.sh restore-db --force <dump>` and re-run health checks.
   - Document the exact rollback path for this host: which git tag/commit to roll back to, which backup file to restore, and how to re-verify (`./manage.sh verify`, health endpoints, Admin UI login, at least one test device).

✨ **Stretch goal:** capture these steps (including backup/restore screenshots and exact CIDRs) in your internal runbook, and rehearse them on a staging host before applying to production.
