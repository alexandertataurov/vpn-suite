# Operations Guide

Consolidated ops reference for VPN Suite control plane and AmneziaWG nodes.

---

## Quick reference


| Task                                                  | Command / Doc                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Start core stack                                      | `./manage.sh up-core`                                                                  |
| Agent mode bootstrap                                  | `./manage.sh bootstrap` or [[07-docs/ops/agent-mode-one-server|agent-mode-one-server.md]] |
| Prod bootstrap                                        | `./infra/scripts/ops/bootstrap-prod.sh`                                                |
| Backup DB                                             | `./manage.sh backup-db`                                                                |
| Restore DB                                            | `./manage.sh restore-db --force <dump>`                                                |
| Rotate agent token                                    | `./infra/scripts/ops/rotate-agent-token.sh`                                            |
| First install (Ubuntu LTS, single-node control plane) | [[07-docs/ops/install-ubuntu-lts|ops/install-ubuntu-lts.md]]                              |


---

## 1. Environment & secrets

- **Config:** `.env` (chmod 600)
- **mTLS:** `secrets/agent_ca.pem`, `secrets/pki/agent_ca.key`
- **Node:** `amnezia/amnezia-awg2/secrets/node.env` (0600)

→ Full list: [[07-docs/ops/required-secrets|ops/required-secrets.md]]

---

## 2. Infrastructure

- **Topology:** [[07-docs/ops/infrastructure-map|ops/infrastructure-map.md]]
- **Network segmentation:** [[07-docs/ops/network-segmentation-map|ops/network-segmentation-map.md]]
- **Docker cleanup:** [[07-docs/ops/docker-ops|ops/docker-ops.md]]

---

## 3. Runbook (troubleshooting, backups)

→ [[07-docs/ops/runbook|ops/runbook.md]]

- Start/stop, env, secrets
- Backups (Postgres, Redis)
- Troubleshooting: 502, 500, DNS, control-plane 503, alerts
- Restart/rotate keys, host isolation

---

## 4. AmneziaWG

- **Integration (NODE_MODE real vs agent):** [[07-docs/ops/amneziawg-integration|ops/amneziawg-integration.md]]
- **Obfuscation (S1, S2, H1–H4):** [[07-docs/ops/amneziawg-obfuscation-runbook|ops/amneziawg-obfuscation-runbook.md]]
- **No traffic (handshake OK, no data):** [[07-docs/ops/no-traffic-troubleshooting|ops/no-traffic-troubleshooting.md]]

---

## 5. Release & quality gates

- [[07-docs/ops/release-checklist|ops/release-checklist.md]]
- [[07-docs/ops/quality-gates|ops/quality-gates.md]]
- [[07-docs/ops/pre-deploy-checklist|ops/pre-deploy-checklist.md]] — pre-commit, smoke, UI test plan

---

## 6. Local development

- [[07-docs/ops/local-dev-environment|ops/local-dev-environment.md]] — WSL2, Docker, Node, Python setup
- [[07-docs/ops/local-dev-modes|ops/local-dev-modes.md]] — full-stack vs beta API vs deployed
- [[07-docs/ops/local-first-data-sync|ops/local-first-data-sync.md]] — dump, restore, sanitize from VPS

---

## 7. Public Beta — Launch Day Checklist

Owner is the operator running the control plane unless noted otherwise.

1. **Docs and install guide up-to-date**
   - Owner: docs/ops.
   - Commands/docs:
     - Confirm `git status` clean on `main` and tagged release created.
     - Re-run [[07-docs/ops/install-ubuntu-lts|docs/ops/install-ubuntu-lts.md]] on a fresh VM and update if anything changed.
2. **Quality gates green**
   - Owner: backend/frontend.
   - Command: `./manage.sh check` (lint/tests/build) and `./manage.sh verify` (migrate integrity + config-validate).
   - Expected: both commands exit 0.
3. **Reference deployment hardened under light real traffic**
   - Owner: ops.
   - Docs:
     - [[07-docs/ops/hardening-reference-ubuntu|docs/ops/hardening-reference-ubuntu.md]]
     - [[07-docs/ops/runbook|docs/ops/runbook.md]] (backups + restore).
   - Manual test:
     - At least one AmneziaWG node attached via agent mode.
     - At least one real device connected and passing traffic.
4. **Grafana dashboards and alerts sane**
   - Owner: ops/observability.
   - Commands/docs:
     - `./manage.sh up-monitoring`
     - Validate [[07-docs/observability/validation|docs/observability/validation.md]] and [[07-docs/observability/launch-kpis|docs/observability/launch-kpis.md]].
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
     - [[07-docs/marketing/public-beta-announcement|docs/marketing/public-beta-announcement.md]]
     - [[07-docs/marketing/public-beta-launch-outline|docs/marketing/public-beta-launch-outline.md]]
   - Manual check:
     - Post text proofread.
     - Links to README, install, hardening, and docs verified.
6. **Demo video recorded**
   - Owner: maintainer.
   - Script: [[07-docs/marketing/public-beta-demo-script|docs/marketing/public-beta-demo-script.md]].
   - Manual check:
     - Video uploaded (unlisted or public).
     - URLs added to README/docs where appropriate.
7. **Support surfaces ready**
   - Owner: ops/maintainer.
   - Manual check:
     - GitHub Issues templates/labels in place.
     - Telegram operator channel (and optional support chat) created, with links documented in `README.md` and marketing docs.
