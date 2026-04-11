# Config Delivery Spec

Spec for tokenized config delivery, QR payload handling, and issuance state exposure.

## Canonical generation rule

All emitted `.conf` content must be generated through the canonical config builder described in [[07-docs/specs/config-generation-contract|config-generation-contract.md]].

## Delivery artifacts in the current repo

- `issued_configs` stores encrypted issued config content and delivery metadata.
- `one_time_download_tokens` stores hashed opaque tokens for single-use delivery.
- Admin tokenized endpoints expose download and QR access.
- Public opaque token download path exists for single-use AWG delivery.

## Token lifecycle

### Creation

- Token creation must be tied to a real device/issued-config lifecycle event.
- Persist only token hash, never the raw token.
- Tokens require explicit TTL.

### Consumption

- Single-use download tokens must be marked consumed atomically on successful verification.
- Replay after consume must fail.
- Expired tokens must fail closed.

### Audit and metrics

- Tokenized delivery must emit audit or operational signals.
- Metrics should distinguish success, expired, replayed, decrypt failure, and peer-not-applied outcomes.

## QR lifecycle

- QR endpoints may return payload for frontend rendering rather than binary image generation.
- QR delivery must still obey expiry and permission rules.
- If QR is not single-use in a specific path, that distinction must be documented explicitly.

## Issuance state gating

Current repo already gates some delivery endpoints on runtime apply state.

Required client-visible distinction:

- desired state accepted
- peer not yet applied
- applied or verified
- failed apply
- revoked or superseded

## Error model

Stable machine-readable outcomes should cover:

- token invalid or expired
- token already used
- config not found
- decrypt failed
- peer not applied
- device revoked or superseded

## File naming and compatibility notes

- Canonical admin download path uses `client.conf`.
- Public opaque download path currently uses an AWG-specific filename format.
- This difference is an as-built compatibility detail and should not bypass the single validated config contract.
