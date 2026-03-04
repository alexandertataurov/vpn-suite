# Operations Guide

Consolidated ops reference for VPN Suite control plane and AmneziaWG nodes.

---

## Quick reference


| Task                                                  | Command / Doc                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Start core stack                                      | `./manage.sh up-core`                                                                  |
| Agent mode bootstrap                                  | `./manage.sh bootstrap` or [agent-mode-one-server.md](../ops/agent-mode-one-server.md) |
| Prod bootstrap                                        | `./ops/bootstrap-prod.sh`                                                              |
| Backup DB                                             | `./manage.sh backup-db`                                                                |
| Restore DB                                            | `./manage.sh restore-db --force <dump>`                                                |
| Rotate agent token                                    | `./ops/rotate-agent-token.sh`                                                          |
| First install (Ubuntu LTS, single-node control plane) | [ops/install-ubuntu-lts.md](../ops/install-ubuntu-lts.md)                              |


---

## 1. Environment & secrets

- **Config:** `.env` (chmod 600)
- **mTLS:** `secrets/agent_ca.pem`, `secrets/pki/agent_ca.key`
- **Node:** `amnezia/amnezia-awg2/secrets/node.env` (0600)

→ Full list: [ops/required-secrets.md](../ops/required-secrets.md)

---

## 2. Infrastructure

- **Topology:** [ops/infrastructure-map.md](../ops/infrastructure-map.md)
- **Network segmentation:** [ops/network-segmentation-map.md](../ops/network-segmentation-map.md)
- **Docker cleanup:** [ops/docker-ops.md](../ops/docker-ops.md)

---

## 3. Runbook (troubleshooting, backups)

→ [ops/runbook.md](../ops/runbook.md)

- Start/stop, env, secrets
- Backups (Postgres, Redis)
- Troubleshooting: 502, 500, DNS, control-plane 503, alerts
- Restart/rotate keys, host isolation

---

## 4. AmneziaWG

- **Integration (NODE_MODE real vs agent):** [ops/amneziawg-integration.md](../ops/amneziawg-integration.md)
- **Obfuscation (S1, S2, H1–H4):** [ops/amneziawg-obfuscation-runbook.md](../ops/amneziawg-obfuscation-runbook.md)
- **No traffic (handshake OK, no data):** [ops/no-traffic-troubleshooting.md](../ops/no-traffic-troubleshooting.md)

---

## 5. Release & quality gates

- [ops/release-checklist.md](../ops/release-checklist.md)
- [ops/quality-gates.md](../ops/quality-gates.md)

---

## 6. Public Beta — Launch Day Checklist

Owner is the operator running the control plane unless noted otherwise.

1. **Docs and install guide up-to-date**
   - Owner: docs/ops.
   - Commands/docs:
     - Confirm `git status` clean on `main` and tagged release created.
     - Re-run [docs/ops/install-ubuntu-lts.md](../ops/install-ubuntu-lts.md) on a fresh VM and update if anything changed.
2. **Quality gates green**
   - Owner: backend/frontend.
   - Command: `./manage.sh check` (lint/tests/build) and `./manage.sh verify` (migrate integrity + config-validate).
   - Expected: both commands exit 0.
3. **Reference deployment hardened under light real traffic**
   - Owner: ops.
   - Docs:
     - [docs/ops/hardening-reference-ubuntu.md](../ops/hardening-reference-ubuntu.md)
     - [docs/ops/runbook.md](../ops/runbook.md) (backups + restore).
   - Manual test:
     - At least one AmneziaWG node attached via agent mode.
     - At least one real device connected and passing traffic.
4. **Grafana dashboards and alerts sane**
   - Owner: ops/observability.
   - Commands/docs:
     - `./manage.sh up-monitoring`
     - Validate [docs/observability/validation.md](../observability/validation.md) and [docs/observability/launch-kpis.md](../observability/launch-kpis.md).
   - Manual test:
     - Dashboards show:
       - Control plane healthy.
       - Telemetry pipeline running (poll runs and snapshot staleness acceptable).
     - Minimal launch alerts:
       - Fire when you intentionally stop admin-api or Postgres.
       - Stay quiet under normal light traffic (no constant noise).
5. **Announcement assets ready**
   - Owner: marketing/maintainer.
   - Docs:
     - [docs/marketing/public-beta-announcement.md](../marketing/public-beta-announcement.md)
     - [docs/marketing/public-beta-launch-outline.md](../marketing/public-beta-launch-outline.md)
   - Manual check:
     - Post text proofread.
     - Links to README, install, hardening, and docs verified.
6. **Demo video recorded**
   - Owner: maintainer.
   - Script: [docs/marketing/public-beta-demo-script.md](../marketing/public-beta-demo-script.md).
   - Manual check:
     - Video uploaded (unlisted or public).
     - URLs added to README/docs where appropriate.
7. **Support surfaces ready**
   - Owner: ops/maintainer.
   - Manual check:
     - GitHub Issues templates/labels in place.
     - Telegram operator channel (and optional support chat) created, with links documented in `README.md` and marketing docs.

