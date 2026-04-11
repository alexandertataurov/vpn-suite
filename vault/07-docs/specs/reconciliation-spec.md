# Desired-State and Reconciliation Spec

Spec for desired-state persistence, convergence semantics, and drift handling.

## Model

- Postgres stores desired state.
- Runtime state can drift.
- Node-agent or docker adapter observes runtime and applies mutations.
- Operator-facing APIs expose current control-plane and node health summaries.

## Provisioning semantics

### At request return time

For agent mode, a successful issue response means:

- device and related issuance records are persisted;
- desired peer state has been accepted by the control plane;
- config generation and tokenized delivery artifacts may already exist;
- runtime peer application may still be pending.

It does not guarantee:

- that the peer is already active on the node;
- that a handshake has already happened;
- that telemetry has caught up.

### At convergence

Successful convergence means:

- runtime peer exists with expected key and addressing;
- device apply status is no longer in a blocked failure state;
- downstream delivery endpoints are consistent with current issuance state.

## Revoke semantics

Successful revoke request means:

- desired state no longer wants the peer active;
- revoke intent is durable even if the node is degraded or temporarily unreachable;
- runtime cleanup may complete asynchronously.

## Drift classes

| Drift | Meaning | Resolution direction |
|-------|---------|----------------------|
| Runtime extra peer | Peer exists in runtime but not in desired state | Remove or quarantine based on policy |
| Runtime missing peer | Peer exists in desired state but not in runtime | Reapply desired state |
| Runtime mismatch | Key, allowed IPs, endpoint, or profile differs | Reconcile toward desired state |
| Node unreachable | No fresh runtime observation | Preserve desired state, mark operational degradation |

## Precedence rules

1. Desired state in DB is the source of truth for intent.
2. Runtime observations describe reality, not intent.
3. Agent reports can update operational status, but they do not replace desired state ownership.
4. Operator drain/disable actions override placement for new allocations.

## Stale desired-state handling

- Pending desired state tied to superseded issuance should be marked stale.
- Duplicate requests must resolve through idempotency or correlation semantics.
- Cleanup of stale desired state must be auditable.

## Required client-visible state vocabulary

At minimum, client surfaces need a vocabulary that distinguishes:

- desired state accepted
- runtime apply pending
- runtime apply failed
- active or verified
- revoked

Current device `apply_status` values can be mapped into this vocabulary without exposing internal implementation details directly.
