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

