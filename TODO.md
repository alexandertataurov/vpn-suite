# TODO

Execution task list for the current spec-driven backlog. Source of truth for scope and acceptance is the spec set added under `docs/`.

## Primary references

- Backlog program: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- As-built architecture: [docs/specs/as-built-architecture.md](docs/specs/as-built-architecture.md)
- Target architecture: [docs/specs/target-architecture.md](docs/specs/target-architecture.md)
- As-built API: [docs/api/as-built-api-spec.md](docs/api/as-built-api-spec.md)
- DB schema: [docs/api/db-schema-spec.md](docs/api/db-schema-spec.md)
- Supported modes: [docs/ops/supported-operating-modes.md](docs/ops/supported-operating-modes.md)

## Milestone 1: Spec stabilization

- [ ] Finalize the architecture baseline split between as-built and target-state.
  Reference: [docs/specs/as-built-architecture.md](docs/specs/as-built-architecture.md), [docs/specs/target-architecture.md](docs/specs/target-architecture.md)
- [ ] Review and complete the as-built API inventory against the current routers and auth domains.
  Reference: [docs/api/as-built-api-spec.md](docs/api/as-built-api-spec.md)
- [ ] Review and complete the DB schema spec against current models and migrations.
  Reference: [docs/api/db-schema-spec.md](docs/api/db-schema-spec.md)
- [ ] Lock supported operating modes and production baseline wording.
  Reference: [docs/ops/supported-operating-modes.md](docs/ops/supported-operating-modes.md)
- [ ] Formalize action lifecycle, retry, timeout, and compensation rules.
  Reference: [docs/specs/action-orchestration-spec.md](docs/specs/action-orchestration-spec.md)
- [ ] Formalize desired-state guarantees for issue and revoke flows.
  Reference: [docs/specs/reconciliation-spec.md](docs/specs/reconciliation-spec.md)
- [ ] Publish the current agent protocol contract from live endpoints and payloads.
  Reference: [docs/specs/agent-protocol-spec.md](docs/specs/agent-protocol-spec.md)
- [ ] Define the canonical issuance flow across admin, bot, miniapp, and raw WG endpoints.
  Reference: [docs/specs/config-delivery-spec.md](docs/specs/config-delivery-spec.md), [docs/specs/config-generation-contract.md](docs/specs/config-generation-contract.md)

## Milestone 2: Control-plane semantics

- [ ] Define precedence rules between DB desired state, runtime drift, and agent reports.
  Reference: [docs/specs/reconciliation-spec.md](docs/specs/reconciliation-spec.md)
- [ ] Specify operator visibility for action history, retries, and stuck actions.
  Reference: [docs/specs/action-orchestration-spec.md](docs/specs/action-orchestration-spec.md)
- [ ] Define stale desired-state cleanup and replay/idempotency rules.
  Reference: [docs/specs/reconciliation-spec.md](docs/specs/reconciliation-spec.md)
- [ ] Define agent protocol versioning and mixed-version rollout behavior.
  Reference: [docs/specs/agent-protocol-spec.md](docs/specs/agent-protocol-spec.md)
- [ ] Standardize the runtime adapter contract for agent and docker modes.
  Reference: [docs/specs/agent-protocol-spec.md](docs/specs/agent-protocol-spec.md), [docs/ops/supported-operating-modes.md](docs/ops/supported-operating-modes.md)
- [ ] Lock node lifecycle states and health-scoring inputs.
  Reference: [docs/specs/agent-protocol-spec.md](docs/specs/agent-protocol-spec.md)
- [ ] Lock secure runtime rules: no public node API, no hardcoded interface name, no key logging.
  Reference: [docs/specs/agent-protocol-spec.md](docs/specs/agent-protocol-spec.md)
- [ ] Formalize placement scoring and hard exclusions.
  Reference: [docs/specs/placement-failover-spec.md](docs/specs/placement-failover-spec.md)
- [ ] Formalize drain behavior for placement and reconcile loops.
  Reference: [docs/specs/placement-failover-spec.md](docs/specs/placement-failover-spec.md)

## Milestone 3: Delivery surfaces

- [ ] Specify one-time token lifecycle, replay rejection, and audit behavior.
  Reference: [docs/specs/config-delivery-spec.md](docs/specs/config-delivery-spec.md)
- [ ] Specify QR payload lifecycle and expiry semantics.
  Reference: [docs/specs/config-delivery-spec.md](docs/specs/config-delivery-spec.md)
- [ ] Define the client-visible issuance state vocabulary.
  Reference: [docs/specs/reconciliation-spec.md](docs/specs/reconciliation-spec.md), [docs/specs/config-delivery-spec.md](docs/specs/config-delivery-spec.md)
- [ ] Define a stable error model for provisioning partial success and retryable failures.
  Reference: [docs/specs/config-delivery-spec.md](docs/specs/config-delivery-spec.md), [docs/specs/action-orchestration-spec.md](docs/specs/action-orchestration-spec.md)
- [ ] Map each admin-web surface to backend contracts and missing states.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- [ ] Define operator UX requirements for topology, health, drain, actions, and reconcile state.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- [ ] Define bot and miniapp issuance states and retry behavior.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- [ ] Normalize analytics event names and payload contract across bot and miniapp.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- [ ] Define next-release frontend acceptance slices by app.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)

## Milestone 4: Production readiness

- [ ] Define the required metric set and explicit owners.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md), [docs/observability/ALERT_SPEC.md](docs/observability/ALERT_SPEC.md)
- [ ] Define alert conditions for stale heartbeats, reconcile failure, provisioning failure, and unreachable nodes.
  Reference: [docs/observability/ALERT_SPEC.md](docs/observability/ALERT_SPEC.md), [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- [ ] Document the security delta from beta posture to production baseline.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md), [docs/security/hardening.md](docs/security/hardening.md)
- [ ] Add rollout and rollback templates for control-plane and agent changes.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- [ ] Add runbook/support requirements for topology drift and failed issuance.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md), [docs/ops/runbook.md](docs/ops/runbook.md)
- [ ] Define contract-test coverage for agent protocol and provisioning semantics.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- [ ] Define backend test coverage for placement, drain, reconcile, and token lifecycle.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- [ ] Define frontend test coverage for operator views and self-service issuance states.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- [ ] Add release gates tied to `./manage.sh check` and `./manage.sh verify`.
  Reference: [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md), [docs/ops/quality-gates.md](docs/ops/quality-gates.md)
- [ ] Make agent mode the required smoke-test path and keep docker mode explicitly non-production.
  Reference: [docs/ops/supported-operating-modes.md](docs/ops/supported-operating-modes.md), [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)

## Required validation scenarios

- [ ] Provision peer in agent mode returns success before runtime apply completes.
- [ ] Revoke peer while node is degraded or unreachable.
- [ ] Runtime peer exists but DB desired state does not.
- [ ] DB desired peer exists but runtime is missing it.
- [ ] Node transitions from healthy to draining to unavailable.
- [ ] Placement excludes drained or otherwise ineligible nodes.
- [ ] One-time config token replay is rejected.
- [ ] QR delivery expires before use.
- [ ] Agent heartbeat with stale protocol version is handled explicitly.
- [ ] Action execution retries after transient runtime failure.
- [ ] Operator can see stuck action and failure reason.
- [ ] Bot and miniapp expose the same issuance state vocabulary.
- [ ] Metrics and alerts fire for stale heartbeats and provisioning failures.
