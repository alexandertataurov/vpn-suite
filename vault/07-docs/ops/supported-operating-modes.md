# Supported Operating Modes

Supported deployment modes for VPN Suite, with support level and operational constraints.

## Mode summary

| Mode | Settings | Support level | Intended use |
|------|----------|---------------|--------------|
| Agent mode | `NODE_DISCOVERY=agent`, `NODE_MODE=agent` | Supported production baseline | Real deployments, one or many VPN hosts |
| Docker mode | `NODE_DISCOVERY=docker`, `NODE_MODE=real` | Supported for local development and single-host only | Local dev, demos, single-box experiments |
| Mock mode | `NODE_MODE=mock` | Test/bootstrap only | CI, bootstrap, dry-run style flows |

## Agent mode

### Characteristics

- Control plane stores desired state in Postgres.
- Node-agent applies local runtime mutations on the VPN host.
- Agent uses mTLS plus `X-Agent-Token`.
- Control plane does not require remote docker socket access.
- Reconciliation is asynchronous by design.

### Operational rules

- Treat this as the only production posture for serious deployment.
- Roll out protocol changes with backward-compatibility rules.
- Expect issuance to return before peer application is confirmed.
- Use node health, agent heartbeat, and reconcile state as operator signals.

## Docker mode

### Characteristics

- Runtime control uses docker-backed adapters and `docker exec`.
- Useful for local or single-host environments where control plane and node runtime share a trust boundary.
- Current code includes node scan and topology sync loops for this mode.

### Constraints

- Not acceptable as the main production architecture for multi-node fleets.
- Keep docker socket local and never expose it publicly.
- Do not treat container naming as the contract.
- Do not hardcode interface names in new work.

## Mock mode

### Characteristics

- Exists to support bootstrap, tests, and partial flows without mutating real peers.
- Useful for UI, API, and contract validation.

### Constraints

- Not a runtime accuracy signal for real provisioning behavior.
- Any success semantics documented for mock mode must be labeled as non-runtime.

## Mode-specific rollout guidance

| Change type | Agent mode rollout | Docker mode rollout |
|-------------|--------------------|---------------------|
| Agent protocol change | Control-plane compatible first, then staged agent rollout | Not applicable |
| Reconciliation change | Validate desired-state compatibility and heartbeat visibility | Validate local docker adapter behavior |
| Placement or drain logic | Validate against agent-reported health and desired state | Validate against docker-discovered topology only |
| Config delivery change | Validate issuance states and token lifecycle | Validate same API behavior, but do not promote docker mode to production |

## Production defaults

- Use `agent mode` for production readiness checklists.
- Treat docker mode validation as secondary and explicitly non-production.
- Keep release gates, smoke tests, and runbooks biased toward agent mode.
