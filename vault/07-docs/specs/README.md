# Specs Index

Design and architecture specifications for VPN Suite.

---

## Core Specs

| Spec | Purpose |
|------|---------|
| [[07-docs/specs/as-built-architecture|as-built-architecture.md]] | Current repo-aligned control-plane, execution-plane, trust boundaries, and loops |
| [[07-docs/specs/target-architecture|target-architecture.md]] | Target-state evolution for multi-node/operator-grade architecture |
| [[07-docs/specs/ultra-spec-control-plane|ultra-spec-control-plane.md]] | Control-plane architecture, endpoints, node modes |
| [[07-docs/specs/action-orchestration-spec|action-orchestration-spec.md]] | Action lifecycle, retries, compensation, operator visibility |
| [[07-docs/specs/reconciliation-spec|reconciliation-spec.md]] | Desired-state convergence, drift, and precedence rules |
| [[07-docs/specs/agent-protocol-spec|agent-protocol-spec.md]] | Versioned node-agent HTTP contract and runtime boundary |
| [[07-docs/specs/placement-failover-spec|placement-failover-spec.md]] | Placement inputs, drain semantics, and bounded failover scope |
| [[07-docs/specs/config-delivery-spec|config-delivery-spec.md]] | One-time token, QR, and issuance-state delivery contract |
| [[07-docs/specs/config-generation-contract|config-generation-contract.md]] | WireGuard/AmneziaWG config builder, profiles, validation |
| [[07-docs/specs/telemetry-spec|telemetry-spec.md]] | Metric → source → refresh → UI mapping |

---

## Operator Dashboard

| Spec | Purpose |
|------|---------|
| [[07-docs/specs/operator-dashboard-spec|operator-dashboard-spec.md]] | Bloomberg-style dashboard, metrics inventory, PromQL, layout |
| [[07-docs/specs/operator-ui-spec|operator-ui-spec.md]] | Top bar, sidebar, UX patterns, tokens, refinement plan |
