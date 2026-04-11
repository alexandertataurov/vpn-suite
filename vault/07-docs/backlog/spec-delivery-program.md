# VPN Suite Spec Delivery Program

Execution-ready backlog for the next 1-2 releases, using the current repository as the source of truth.

## Scope and defaults

- Planning lens: repo-first.
- Horizon: next 1-2 releases.
- Granularity: PR-sized increments.
- Production baseline: `agent mode`.
- Docker mode remains supported for dev and single-host only.
- Automatic multi-node migration is out of scope until action orchestration, convergence semantics, and agent protocol rules are formalized.

## Streams

### Stream 1. Architecture and spec baseline

| ID | Task | Owner | Depends on | Acceptance |
|----|------|-------|------------|------------|
| S1-1 | Split architecture into as-built and target-state docs | Backend/Docs | None | Current supported behavior is clearly separated from future architecture |
| S1-2 | Publish as-built API spec | Backend/Docs | S1-1 | Admin, bot, webapp, agent, webhooks, health, and metrics surfaces are listed with auth and purpose |
| S1-3 | Publish DB schema spec | Backend/Docs | S1-1 | Core entities, ownership, and lifecycle relationships are documented from models/migrations |
| S1-4 | Publish supported operating modes doc | Ops/Docs | S1-1 | Agent, docker, and mock modes have explicit support levels, constraints, and rollout guidance |
| S1-5 | Add control-plane, execution-plane, and trust-boundary diagrams | Backend/Docs | S1-1 | Diagrams match repo entrypoints and current background loops |

### Stream 2. Action orchestration and convergence

| ID | Task | Owner | Depends on | Acceptance |
|----|------|-------|------------|------------|
| S2-1 | Specify action lifecycle, retries, timeout semantics, and compensation rules | Backend | S1-2 | Status machine covers queued, executing, succeeded, failed, timed_out, cancelled, compensated |
| S2-2 | Define desired-state convergence semantics for provision/revoke | Backend | S1-2, S1-3 | API responses state what is guaranteed immediately vs eventually |
| S2-3 | Document conflict resolution between DB desired state, runtime drift, and agent reports | Backend | S2-2 | Source-of-truth precedence is explicit |
| S2-4 | Define operator visibility for action history and stuck actions | Backend/Frontend | S2-1 | API/UI requirements exist for viewing pending, failed, and compensating actions |
| S2-5 | Define stale desired-state cleanup and replay/idempotency safety | Backend | S2-2 | Stale desired state, duplicate requests, and safe retries are covered |

### Stream 3. Node-agent protocol and runtime boundary

| ID | Task | Owner | Depends on | Acceptance |
|----|------|-------|------------|------------|
| S3-1 | Publish agent protocol spec from current endpoints/payloads | Backend/Docs | S1-2 | Heartbeat, desired-state, actions, telemetry, peers, auth, and version fields are documented |
| S3-2 | Define protocol versioning and backward-compat rules | Backend | S3-1 | Mixed-version rollout behavior is specified |
| S3-3 | Standardize runtime adapter contract for agent vs docker modes | Backend | S3-1, S1-4 | Capabilities, timeouts, and failure classes are enumerated |
| S3-4 | Specify node lifecycle and health scoring inputs | Backend | S3-1 | healthy, degraded, unreachable, draining, maintenance, disabled are operationally meaningful |
| S3-5 | Document secure runtime rules | Backend/Security | S3-3 | No hardcoded `wg0`, no node HTTP API, no key logging, docker exec scope remains explicit |

### Stream 4. Placement, scheduling, and failover

| ID | Task | Owner | Depends on | Acceptance |
|----|------|-------|------------|------------|
| S4-1 | Formalize placement scoring formula | Backend | S1-3, S3-4 | Health, capacity, draining, and optional latency inputs are deterministic |
| S4-2 | Define hard constraints for region/profile/plan compatibility | Backend | S4-1 | Ineligible nodes are excluded before scoring |
| S4-3 | Specify drain behavior across placement and reconcile loops | Backend | S2-2, S4-1 | Draining nodes stop receiving new peers and surface clear operator status |
| S4-4 | Define failover evaluation rules for current release horizon | Backend | S4-3 | Only soft failover planning is committed |
| S4-5 | Capture future rollout rules for multi-node failover | Backend/Docs | S4-4 | Marked as target-state, not a current release promise |

### Stream 5. Provisioning and config delivery

| ID | Task | Owner | Depends on | Acceptance |
|----|------|-------|------------|------------|
| S5-1 | Define canonical issuance flow across admin, bot, miniapp, and raw WG endpoints | Backend | S1-2, S1-3 | All issuance flows use the canonical config builder and persistence model |
| S5-2 | Specify config download token lifecycle | Backend | S5-1 | Issue, expiry, single-use, replay rejection, and audit requirements are documented |
| S5-3 | Specify QR delivery lifecycle and revocation behavior | Backend | S5-2 | QR payload behavior is bounded and auditable |
| S5-4 | Define issuance status model exposed to clients | Backend | S2-2, S5-1 | Clients can distinguish desired state persisted vs peer confirmed active |
| S5-5 | Define error model for provisioning failures and partial success | Backend | S5-4 | Stable machine-readable states exist for partial success and retry cases |

### Stream 6. Admin web, miniapp, and bot delivery surfaces

| ID | Task | Owner | Depends on | Acceptance |
|----|------|-------|------------|------------|
| S6-1 | Map each frontend surface to backend contracts and missing states | Frontend/Backend | S1-2, S5-4 | Dashboard, telemetry, automation, devices, billing, and self-service views have API dependencies listed |
| S6-2 | Define operator UX for topology, health, drain, action queue, and reconcile status | Frontend | S2-4, S4-3 | Admin web backlog is split into views, data dependencies, and state handling |
| S6-3 | Define user-facing issuance state requirements for bot and miniapp | Frontend/Backend | S5-4, S5-5 | Async provisioning, config delivery, renew/revoke, and retry behavior are explicit |
| S6-4 | Normalize analytics event contract | Backend/Frontend | S6-3 | `user_started`, `plan_viewed`, `payment_started`, `payment_success`, `config_issued`, `subscription_expired` are defined consistently |
| S6-5 | Define frontend acceptance slices by app | Frontend | S6-1, S6-2, S6-3 | Each app has a bounded next-release screen/flow list |

### Stream 7. Observability, security, and ops

| ID | Task | Owner | Depends on | Acceptance |
|----|------|-------|------------|------------|
| S7-1 | Define required metric set and owner map | Observability/Backend | S2-2, S3-1, S5-4 | Cluster, provisioning, agent, funnel, and docker exec metrics are assigned |
| S7-2 | Define alert conditions for node unreachable, reconcile failure, provisioning failure, stale heartbeats | Observability | S7-1 | Thresholds, sources, and routing are explicit |
| S7-3 | Publish security delta from beta to production baseline | Security/Ops | S1-4 | Backup encryption, hardening gaps, and docker-mode caveats are enumerated |
| S7-4 | Publish rollout and rollback templates for control-plane and agent changes | Ops | S3-2, S5-4 | Upgrade order and rollback triggers exist |
| S7-5 | Add support/runbook requirements for topology drift and failed issuance | Ops/Docs | S2-3, S5-5 | Playbooks reference current `manage.sh` workflows |

### Stream 8. Testing and release gates

| ID | Task | Owner | Depends on | Acceptance |
|----|------|-------|------------|------------|
| S8-1 | Define contract-test coverage for agent protocol and provisioning semantics | Backend | S3-1, S5-4 | Request/response schema and idempotency cases are listed |
| S8-2 | Define backend test matrix for placement, drain, reconcile, token lifecycle | Backend | S4-3, S5-5 | Success, timeout, duplicate, drift, and partial-failure cases are covered |
| S8-3 | Define frontend test matrix for operator views and issuance states | Frontend | S6-5 | Lint, typecheck, unit, and key flow coverage are mapped by app |
| S8-4 | Add release gate checklist tied to `./manage.sh check` and `./manage.sh verify` | Docs/Ops | S8-1, S8-2, S8-3 | Every stream has a verification path |
| S8-5 | Define smoke tests with agent mode as the required production path | Ops/Backend | S7-4 | Docker mode smoke tests are clearly labeled non-production |

## Milestones

### Milestone 1. Spec stabilization

- Complete Stream 1.
- Complete S2-1, S2-2, S3-1, S5-1.
- Output: docs that remove ambiguity around the current platform contracts.

### Milestone 2. Control-plane semantics

- Complete S2-3 through S2-5.
- Complete S3-2 through S3-5.
- Complete S4-1 through S4-3.
- Output: decision-complete orchestration, reconciliation, scheduling, and node lifecycle rules.

### Milestone 3. Delivery surfaces

- Complete Stream 5.
- Complete Stream 6.
- Output: delivery-ready backlog for admin web, miniapp, bot, and provisioning UX.

### Milestone 4. Production readiness

- Complete Stream 7.
- Complete Stream 8.
- Output: release gates, observability, rollout, rollback, and support readiness.

## Cross-boundary handoff rules

- Backend owns API, persistence, node protocol, reconciliation, placement, and token lifecycle.
- Frontend owns admin web and miniapp views, state handling, and acceptance slices.
- Observability owns metric naming, alert rules, dashboards, and runbooks.
- Ops/docs owns supported modes, rollout/rollback, hardening delta, release gates, and support procedures.
- Bot work that changes user-visible API contracts requires a backend contract update first.

## Required validation scenarios

- Provision peer in agent mode returns success before runtime apply completes.
- Revoke peer while node is degraded or unreachable.
- Drift: runtime peer exists but DB desired state does not.
- Drift: DB desired peer is missing from runtime.
- Node transitions from healthy to draining to unavailable.
- Placement excludes drained or ineligible nodes.
- One-time download token replay is rejected.
- QR token or payload expires before use.
- Agent heartbeat arrives with stale protocol version.
- Action execution retries after transient runtime failure.
- Operator can see stuck action and failure reason.
- Bot and miniapp use a shared issuance state vocabulary.
- Metrics and alerts fire for stale heartbeats and provisioning failures.

## Definition of done for this program

- The new spec documents are linked from the main docs indexes.
- Every stream has explicit owner, dependency chain, and acceptance criteria.
- Release sequencing is clear enough that another engineer can execute the backlog without inventing missing decisions.
