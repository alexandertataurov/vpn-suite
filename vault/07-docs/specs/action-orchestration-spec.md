# Action Orchestration Spec

Spec for queued control-plane actions and agent-executed mutations.

## Goal

Formalize the current action model so retries, visibility, and failure handling are deterministic.

## Current as-built primitives

- Persistent action rows in `agent_actions`.
- Per-action logs in `agent_action_logs`.
- Agent-facing action poll and report endpoints in `app/api/v1/agent.py`.
- Operator-facing action-related flows in cluster/server/control-plane APIs.

## Lifecycle model

Recommended lifecycle for next release:

| State | Meaning |
|-------|---------|
| `queued` | Accepted by control plane and waiting for execution |
| `executing` | Agent has started work |
| `succeeded` | Desired mutation applied successfully |
| `failed` | Terminal failure, no retry scheduled |
| `timed_out` | Execution window elapsed without terminal report |
| `cancelled` | Operator or control plane cancelled before successful completion |
| `compensated` | Original action failed or was superseded and follow-up cleanup completed |

### Mapping note

Current DB state values may not yet match the target vocabulary exactly. The target lifecycle above is the contract to converge on.

## Retry rules

- Retry only idempotent actions.
- Backoff should be exponential with a bounded retry window.
- Retry eligibility depends on failure class:
  - transport or temporary runtime error: retry
  - validation, policy, or unsupported capability error: do not retry
  - stale action superseded by newer desired state: cancel or compensate

## Timeout semantics

- Every action type must define a max execution window.
- If the window expires without success/failure report, mark `timed_out`.
- Timed-out actions must remain operator-visible and must not be silently dropped.

## Compensation rules

- Compensation is required when an action partially mutates runtime or allocates state but the overall operation fails.
- Examples:
  - peer add succeeded but config persistence failed
  - revoke queued after superseding issue action
  - stale desired-state entry remains after a new placement decision

## Operator visibility

Required UI/API visibility:

- action type
- target server/node
- current lifecycle state
- requested_at, started_at, finished_at
- correlation/request id
- error summary
- retry count or retry eligibility

## Safety requirements

- Actions must be idempotent by correlation key or operation identity.
- Newer desired state supersedes stale pending actions.
- Destructive actions require explicit visibility and audit linkage.
- No action may log private keys or raw config payloads.
