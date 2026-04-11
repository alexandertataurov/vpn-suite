---
type: tech-spec
title: VPN Suite — Updated Tech Spec (Repo-Aligned)
spec_version: 2026-04-09
imported: 2026-04-11
source: user Downloads (see git history / task 007)
---

# VPN Suite — Updated Tech Spec (Repo-Aligned)

Version: 2026-04-09  
Basis: as-built analysis of `alexandertataurov/vpn-suite` on `main`

> **Vault note:** §6.1 lists generic paths (`backend/app/main.py`, …). This repo uses **`apps/admin-api`**, **`apps/admin-web`**, **`apps/miniapp`**, **`apps/telegram-bot`**, **`infra/compose/docker-compose.yml`**, etc. Treat §6.1 as conceptual; verify paths against the tree.

---

## 1. Purpose

This document updates the VPN Suite technical specification to match the current repository reality, not just the target architecture.

It separates:

- **As-built / code truth** — what the repo currently implements
- **Target / forward architecture** — where the platform should evolve next

This matters because the repository is currently positioned as a **Public Beta for homelab / small-ops operators**, not yet as a fully hardened mass-scale commercial control plane.

---

## 2. Product Positioning

## 2.1 Current scope

VPN Suite is a self-hosted control plane for AmneziaWG / WireGuard clusters with:

- Admin API
- Admin SPA
- Telegram bot
- Telegram Mini App
- Node-agent
- Observability stack
- Billing / plans / subscriptions / referrals
- Runbooks and operational tooling

## 2.2 Current target persona

Current repo positioning is:

- technically capable homelab / small-ops operator
- comfortable with Docker and Linux
- wants one control plane for servers, devices, telemetry, and subscriptions

## 2.3 Implication for architecture decisions

The spec must reflect two operating envelopes:

### Current supported envelope
- beta
- small-ops / homelab
- one or a few nodes
- production recommended only in agent mode

### Future target envelope
- multi-node operator-grade commercial VPN
- stronger HA and reconciliation guarantees
- more formal scheduling, failover, and policy enforcement
- better fit for larger fleets and stricter compliance

---

## 3. System Overview

VPN Suite is split into control-plane and execution-plane responsibilities.

### Control plane
- FastAPI admin backend
- Postgres source of truth
- Redis for cache / rate limiting / ephemeral state
- Admin SPA
- Telegram bot
- Telegram Mini App
- orchestration, issuance, billing, audit, telemetry aggregation

### Execution plane
- AmneziaWG / WireGuard nodes
- node-agent on VPN hosts in production
- optional docker-exec runtime adapter for single-host/dev only

### Core principle
Production ownership of peer mutations belongs to **node-agent**, not to direct remote docker control from the control plane.

---

## 4. Operating Modes

## 4.1 Agent mode — supported production mode

Recommended and required for serious deployment:

- `NODE_DISCOVERY=agent`
- `NODE_MODE=agent`

Characteristics:

- control plane stores desired state
- node-agent applies peer state locally on VPN host
- node-agent reports heartbeat and telemetry
- control plane does not need docker socket access to remote nodes
- mTLS + `X-Agent-Token` boundary is used for agent API

## 4.2 Docker mode — single-host / development only

Supported for local development and single-host setups:

- `NODE_DISCOVERY=docker`
- `NODE_MODE=real`

Characteristics:

- control plane uses docker runtime adapter
- peer operations can go through `docker exec ... wg ...`
- not acceptable as the main production posture for multi-node deployments

## 4.3 Mock mode

Exists for testing and bootstrap workflows.

---

## 5. Major Components

## 5.1 Admin API

Stack:
- Python 3.12
- FastAPI
- SQLAlchemy async
- Alembic
- Redis
- Pydantic schemas

Responsibilities:
- auth and RBAC
- user, device, plan, subscription, payment management
- issue / revoke / reset flows
- server registration and sync
- cluster / topology / control-plane operations
- audit logging
- webhook handling
- Mini App / bot APIs
- agent APIs
- telemetry aggregation

## 5.2 Admin SPA

Stack:
- React 18
- TypeScript
- Vite 6
- TanStack Query 5

Routes currently include:
- Dashboard
- Telemetry
- Automation / Control Plane
- Servers
- Users
- Billing
- Devices
- Audit
- Settings
- Styleguide

## 5.3 Telegram bot

Stack:
- Python
- aiogram 3

Responsibilities:
- onboarding
- plans and subscriptions
- status and devices
- support links
- referral flows
- config issuance via admin API only

## 5.4 Telegram Mini App

Responsibilities:
- user auth via Telegram WebApp session
- plan browsing and checkout
- device issuance / revoke
- referral and profile flows

## 5.5 Node-agent

Responsibilities:
- local node reconciliation
- heartbeat
- telemetry
- desired-state pull
- action polling/reporting
- peer application on VPN host

## 5.6 Reverse proxy

Caddy terminates:
- public HTTPS for admin/api/webapp
- mTLS boundary on `:8443` for agent traffic

---

## 6. Repository-Aligned Architecture

## 6.1 Current entry points

- `backend/app/main.py` — admin API
- `frontend/admin/` — admin SPA
- `frontend/miniapp/` — Mini App
- `bot/main.py` — Telegram bot
- `node-agent/agent.py` — node-agent
- `manage.sh` — unified ops CLI
- `docker-compose.yml` — core stack

## 6.2 Background loops already present

Current repo includes background/control tasks for:
- node scan
- server sync
- health checks
- limits checks
- telemetry polling
- docker alert polling
- control-plane automation

This means the spec should explicitly treat VPN Suite as a **continuous reconciliation system**, not a request/response-only app.

---

## 7. Auth and Trust Boundaries

## 7.1 Admin auth
- JWT access token
- refresh token rotation
- RBAC
- TOTP setup / disable endpoints exist

## 7.2 Bot auth
- bot-facing API can use `X-API-Key`

## 7.3 WebApp auth
- Telegram `initData` bootstrap
- separate WebApp bearer session

## 7.4 Agent auth
- mTLS
- `X-Agent-Token`
- optional CIDR restriction

## 7.5 Webhook auth
- provider-specific webhook secret validation
- idempotency requirements on payment ingestion

---

## 8. API Surface (Current Reality)

The repo already exposes five API families:

1. **Admin JWT API**
2. **Bot API**
3. **WebApp API**
4. **Agent API**
5. **Webhook endpoints**

Additionally:
- `/health`
- `/health/ready`
- `/metrics`

### Important correction versus generic spec
The API surface is substantially broader than a basic CRUD control plane. It already includes:
- control-plane automation
- IP pools
- port allocations
- throttling policies
- placement simulation
- failover evaluation
- topology graph / summary
- server actions queue
- config download / QR endpoints
- streaming / telemetry endpoints

---

## 9. Domain Model (Repo-Aligned)

Current data model is richer than the earlier generic draft.

## 9.1 Core entities
- roles
- admin_users
- audit_logs
- users
- servers
- server_profiles
- server_ips
- server_health_logs
- server_snapshots
- sync_jobs
- plans
- plan_bandwidth_policies
- subscriptions
- devices
- issued_configs
- profile_issues
- payments
- payment_events
- promo_codes
- promo_redemptions
- referrals
- funnel_events
- control_plane_events
- docker_alerts
- latency_probes
- ip_pools
- port_allocations

## 9.2 Key design implications

### Servers are no longer just “metadata only”
The repo stores more operational state than the original abstract spec assumed, including:
- server IPs
- snapshots
- health history
- sync jobs
- capabilities / cert / telemetry views

### Devices are not just peer bindings
There is also:
- issued config history
- download / QR delivery path
- profile issue history
- limit / suspend / resume / block states

### Network control-plane state exists explicitly
The existence of:
- IP pools
- port allocations
- latency probes
- bandwidth policies

means the product is already evolving into a real network control plane rather than a simple config issuer.

---

## 10. Device Issuance and Config Lifecycle

## 10.1 Issuance path

The repo supports multiple issuance entry points:
- admin issue flow
- user issue flow
- webapp issue flow
- raw WG peer provisioning endpoints

## 10.2 Important repo behavior

In agent mode:
- issue response may complete before runtime peer is fully applied
- response includes `node_mode`
- response includes `peer_created`
- desired state may be persisted before node-agent finishes applying

This must be reflected in the spec as an **asynchronous convergence model**, not as a guaranteed synchronous peer creation model.

## 10.3 Config delivery

Repo includes:
- issued config storage/records
- one-time download token endpoints
- QR endpoints
- admin config retrieval

## 10.4 Required config-generation contract

All `.conf` generation must go through the canonical builder.

Supported profiles already include:
- `wireguard_universal`
- `awg_legacy_or_basic`
- `awg_2_0_asc`
- `mobile_optimized`
- `wg_obf`

Strict validation already exists for:
- PrivateKey
- Address
- PublicKey
- Endpoint
- AllowedIPs
- AWG profile-gated keys
- output normalization

### Design consequence
The spec must define config generation as a **strictly validated contract**, not a string-template convenience function.

---

## 11. Node Management and Reconciliation

## 11.1 Current node interfaces

Current node-facing contract includes:
- desired state
- heartbeat
- action execute / poll / report
- peers listing
- status
- telemetry

## 11.2 Reconciliation model

Repo already assumes:
- control-plane desired state in DB
- runtime drift can happen
- sync / reconcile / drift detection are first-class flows
- drain / undrain are operator actions
- topology and health are aggregated control-plane views

## 11.3 Required lifecycle states

At minimum, the spec should model:
- healthy
- unhealthy / degraded
- unreachable
- draining
- maintenance
- disabled

## 11.4 Action model

The repo includes:
- server actions list/create
- action status endpoint
- agent execute/poll/report flow

This implies the platform is moving toward a **command queue / action orchestration** model.
That should be formalized in the updated spec.

---

## 12. Telemetry and Observability

## 12.1 Current telemetry sources
- agent heartbeat
- Prometheus
- Docker telemetry
- server telemetry endpoints
- peers endpoints
- logs endpoints
- alert pipeline

## 12.2 Metrics already modeled
- CPU / RAM / Disk / Net
- peer count
- handshake status
- rx / tx
- restart count
- service/container health
- alerts
- business metrics
- anomaly/security metrics
- funnel/conversion metrics

## 12.3 UI implications
Telemetry is not a side panel. It is a first-class product surface:
- Dashboard
- Telemetry page
- Server detail
- Docker service views
- alerts panels
- operator views

## 12.4 Streams / freshness
The repo already uses:
- polling
- server summary endpoints
- server streams / SSE-style paths
- dashboard timeseries

The updated spec should define refresh classes:
- real-time / near-real-time
- operator polling
- historical analytics

---

## 13. Security Model

## 13.1 Current hardening posture
The repo already codifies:
- TLS 1.2/1.3
- HSTS
- localhost binding for internal services
- Redis password in production
- mTLS for agent boundary
- secret validation
- confirmation tokens for destructive actions
- webhook secret checks
- redaction policy
- gitleaks / Trivy / CI validation

## 13.2 Threats explicitly modeled
- brute-force login
- token replay
- subscription bypass
- peer/key reuse
- resource exhaustion
- agent API abuse
- DDoS baseline risks

## 13.3 Gaps / residual risks already acknowledged by repo docs
- fail2ban not guaranteed until configured
- backup encryption still a gap
- docker mode remains riskier than agent mode
- some production items remain checklist-driven rather than automatically enforced

---

## 14. Deployment Topology

## 14.1 Public surface
- 80 / 443 through Caddy
- 8443 for agent mTLS
- VPN UDP listener(s)
- Telegram webhook path through proxy

## 14.2 Internal-only services
- admin-api on localhost/internal
- Postgres
- Redis
- Prometheus
- monitoring internals

## 14.3 Monitoring profile
Repo includes optional monitoring stack:
- Prometheus
- Grafana
- cAdvisor
- node-exporter
- Loki
- Promtail
- Tempo / OTEL pieces in docs and compose variants

## 14.4 Operations tooling
`manage.sh` already acts as the operator control surface for:
- bootstrap
- migrate
- seed
- check / verify
- smoke
- backup / restore
- sync / reconcile
- support bundle
- openapi export

This should be treated as part of the product’s operational spec, not merely convenience scripts.

---

## 15. Release and Quality Gates

## 15.1 Repo maturity reality
The repo is not just code-first; it already has release governance:
- CI
- lint
- tests
- build
- e2e
- smoke
- pre-release validation
- release checklist
- staging HA smoke

## 15.2 Beta reality
As-built positioning remains:
- Public Beta
- homelab / small-ops
- known limitations documented
- production recommended in agent mode only

## 15.3 Important implementation truth
Issue/apply are not always fully synchronous in agent mode.
That means release gates must test:
- eventual convergence
- desired-state correctness
- heartbeat freshness
- retry safety
- drift repair

not just HTTP 200 responses.

---

## 16. Updated Functional Requirements

## 16.1 Required platform capabilities
1. Admin auth with RBAC and TOTP support
2. User / plan / subscription / payment lifecycle
3. Device issuance / reset / revoke / suspend / block / resume
4. Server CRUD plus health, limits, sync, telemetry, capabilities
5. Cluster topology / scan / drain / undrain / resync
6. Control-plane automation resources
7. Agent heartbeat / desired-state protocol
8. Config generation with strict validation
9. One-time config download / QR delivery
10. Promo / referral / funnel analytics
11. Logs, metrics, audit, and support bundle generation

## 16.2 Production-required constraints
1. Production must prefer agent mode
2. Agent API must stay behind mTLS + token
3. No remote arbitrary shell from control plane in production
4. Config issuance must remain idempotent
5. Payment webhook processing must remain idempotent
6. Audit coverage must include all control-plane mutations
7. Destructive actions must require explicit permissions and confirmation tokens

---

## 17. Updated Non-Functional Requirements

## 17.1 Current realistic target
For the current repo stage, realistic SLO language should be:
- operator-grade beta reliability
- safe single-host and small-cluster operation
- recoverable drift
- good operational visibility
- production posture available with disciplined setup

## 17.2 Future scale target
The earlier “100k users / 50+ nodes” aspiration can remain as a forward target, but it should be marked as **target-state, not code-truth**.

## 17.3 Required NFRs now
- strict secrets validation
- no secret leakage in logs
- bounded support bundle collection
- convergence after partial node failure
- rate limiting
- token replay resistance
- observability-first operations
- compatibility between admin, bot, webapp, and agent surfaces

---

## 18. Spec Corrections vs Previous Generic Draft

## 18.1 Correction: external-node black-box model
Previous generic draft was too absolute.

### Updated truth
- production intent is black-box-ish via node-agent
- but repo still supports direct docker runtime control in dev/single-host mode
- spec must model both, while clearly marking docker mode as non-production

## 18.2 Correction: synchronous issue flow
Previous draft implied “peer created, then config returned”.

### Updated truth
- in agent mode, desired state may be written first
- actual peer creation may lag
- API response can indicate `peer_created=false`
- eventual convergence is part of the contract

## 18.3 Correction: metadata-only server model
Previous draft under-modeled operational state.

### Updated truth
Server-related persistent state now includes:
- IP inventory
- snapshots
- health logs
- sync jobs
- cert status
- telemetry summaries
- capabilities

## 18.4 Correction: simple API surface
Previous draft undercounted real system breadth.

### Updated truth
The platform already includes:
- automation
- placement simulation
- IP pools
- port allocations
- throttling policy
- latency probes
- anomaly/security metrics
- action queue semantics

## 18.5 Correction: current market posture
Previous draft leaned enterprise-commercial first.

### Updated truth
The repo is presently a public beta for serious self-hosters.
That does not reduce ambition; it simply means the spec must separate present from target.

---

## 19. Recommended Spec Structure Going Forward

The best way to maintain this repo is to split the specification into two layers.

## 19.1 Layer A — As-built spec
Documents current repo truth:
- actual endpoints
- actual schemas
- actual operating modes
- actual release gates
- actual known limitations

## 19.2 Layer B — Target architecture spec
Documents where the platform is going:
- enterprise hardening
- scheduler evolution
- multi-node failover
- stronger policy enforcement
- higher-scale tenancy and HA
- stricter operational SLOs

This split prevents the spec from becoming fiction with excellent formatting.

---

## 20. Immediate Gaps to Close

Based on repo state, the biggest high-value spec gaps are:

1. **Formal action orchestration spec**
   - action lifecycle
   - retries
   - compensation
   - operator visibility

2. **Desired-state convergence spec**
   - what is guaranteed at issue time
   - timeout semantics
   - stale desired state handling
   - conflict resolution

3. **Placement / scheduling spec**
   - exact scoring formula
   - drain behavior
   - failover behavior
   - plan / region / health constraints

4. **Agent protocol spec**
   - heartbeat schema
   - desired-state schema
   - action execution/reporting
   - telemetry contract
   - versioning

5. **Config-delivery spec**
   - one-time token lifecycle
   - QR token lifecycle
   - expiry / replay protection
   - audit requirements

6. **Enterprise delta spec**
   - what must change to move from public beta / homelab to serious commercial fleet scale

---

## 21. Recommended Next Documents

After this repo-aligned spec, the next documents should be:

1. **As-Built API Spec**
2. **DB Schema Spec**
3. **Agent Protocol Spec**
4. **Desired-State / Reconciliation Spec**
5. **Placement and Failover Spec**
6. **Config Delivery & Token Lifecycle Spec**
7. **Enterprise Hardening Delta Spec**

---

## 22. Final Position

VPN Suite is no longer “just a bot that issues configs”.

As of the current repository, it is a real control-plane platform with:
- multiple auth domains
- node-agent boundary
- desired-state thinking
- reconciliation loops
- telemetry and audit surfaces
- plan/payment/referral logic
- release and ops discipline

But it is also still clearly in a **Public Beta / small-ops stage**.

So the correct spec is:

- honest about current implementation
- explicit about supported production posture
- strict about security boundaries
- realistic about asynchronous convergence
- ambitious about the next enterprise-grade evolution

