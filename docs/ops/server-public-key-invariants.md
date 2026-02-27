# Server Public Key Invariants — Design

**Goal:** Issued configs **never** contain a stale server public key. Node = source of truth; DB = cache. Any drift is detected, blocks issue/reissue, and is fixed automatically or fails with a clear error.

---

## 1. Source of truth

| Source | Role |
|--------|------|
| **Node (live)** | Source of truth. Key obtained via: (1) `wg show <iface>` (Docker adapter), (2) agent heartbeat `public_key`, (3) Admin "Servers → Sync" (runs sync, updates DB). |
| **DB `Server.public_key`** | Valid only if `public_key_synced_at` is recent (within `server_key_validity_seconds`) and key was fetched from the same node. |

**Invariants (enforced in code):**

- Config is **never** built from DB-only; we always run **LiveKeyFetch** (or use a key that was just fetched and written in the same request).
- If LiveKeyFetch fails (node not found, discovery down) → **block issue/reissue** with `409 SERVER_NOT_SYNCED`.
- `[Peer] PublicKey` in emitted config = key returned by LiveKeyFetch in that request (or from DB only when `public_key_synced_at` is fresh and we skip fetch by policy).

---

## 2. LiveKeyFetch abstraction

**Purpose:** Get the current server public key from the node.

**Implementation:**

- **Docker mode:** `adapter.get_node_for_sync(server_id)` → `node.public_key` (from `wg show dump`). If node not in discovery → fail.
- **Agent mode:** (1) Redis `agent:hb:{server_id}` → `public_key` from heartbeat. (2) If missing or stale (no heartbeat recently) → fail or trigger sync and fail with SERVER_NOT_SYNCED.

**Returns:** `LiveKeyResult(public_key=str, node_id=str, synced_at=datetime)` or `None` / error reason.

**Used by:**

- Issue / reissue flow **before** building config (hard gate).
- Scheduled server-key sync job (updates DB).
- Event-driven: after server create/update, after sync completion.

---

## 3. Hard gate on issue / reissue

**Flow:**

1. Resolve target server (by `server_id` or device’s server).
2. **LiveKeyFetch(server_id):**
   - If fail (node not found, no heartbeat, timeout) → return **409 SERVER_NOT_SYNCED**, message: "Server key not verified; run sync or fix discovery." Log + `config_issue_blocked_total{reason="server_not_synced"}`.
3. If success:
   - Optionally compare with `Server.public_key`; if different → update DB, audit log, `server_key_mismatch_total`.
   - Build config with **live key only** (`[Peer] PublicKey = LiveKeyResult.public_key`).
4. Never build config from `Server.public_key` alone without a successful LiveKeyFetch in the same flow (or a validated cache with `public_key_synced_at` within TTL).

---

## 4. Server key status (state machine)

**Server key status (for display and gating):**

| Status | Meaning |
|-------|--------|
| `verified` | We have a live key from the node and `public_key_synced_at` is within TTL. |
| `unverified` | DB has a key but no recent successful LiveKeyFetch (or sync). |
| `not_found` | LiveKeyFetch failed (node not in discovery / no heartbeat). |

**Rule:** Issue/reissue is allowed only when LiveKeyFetch **succeeds** in the request (we do not gate on stored status alone; we always fetch live for the key used in the config). If fetch fails, we block with 409.

---

## 5. Device issue states (existing + alignment)

Existing: `apply_status` = CREATED | APPLYING | APPLIED | VERIFIED | ERROR.

**Rule:** Config **content** (download/QR) is only served when device is APPLIED or VERIFIED. For **issue/reissue response**, we return config only after we have successfully run LiveKeyFetch and built the config (no “return config with stale key”).

---

## 6. Scheduled server-key sync

- **Job:** Every N minutes (e.g. same as or half of `server_sync_interval_seconds`), for each active server:
  - Run LiveKeyFetch (or full sync which includes key).
  - On success: update `Server.public_key`, `public_key_synced_at`, set key status to verified.
  - On failure (not found): set status to not_found, do not clear `public_key` (keep last known).
- Reuse existing `run_sync_for_server` where possible; it already updates `server.public_key` and `last_snapshot_at`. Treat `last_snapshot_at` as “last time we got key from node” and add `public_key_synced_at` = `last_snapshot_at` when snapshot contains key.

---

## 7. Event-driven sync

- **After server create/update:** Trigger sync for that server (or at least LiveKeyFetch).
- **After sync completion:** Already updates `Server.public_key` and `last_snapshot_at`.
- **Before issue/reissue:** LiveKeyFetch in request (hard gate).

---

## 8. Endpoint → server_id validation

- Sync (or agent) can return endpoint list + public key + node id. DB can store `vpn_endpoint` and optionally `endpoint_fingerprint` (ip:port + node_id).
- If we later detect “this endpoint is served by a different node” (e.g. remap), we can block issue until mapping is re-synced. **Phase 2:** implement endpoint fingerprint and remap detection; for now, gate only on LiveKeyFetch success for the server’s `server_id`.

---

## 9. Observability

**Metrics:**

- `server_key_sync_success_total` — successful key fetch/sync per server.
- `server_key_sync_fail_total{reason}` — failure (not_found, timeout, error).
- `server_key_mismatch_total` — DB key differed from live key (corrected).
- `config_issue_blocked_total{reason}` — issue/reissue blocked (e.g. server_not_synced).
- `discovery_not_found_total` — server not in discovery.

**Logs:**

- On mismatch: server_id, node_id, old/new key fingerprint (first 8 chars), synced_at.
- On block: server_id, reason.

**Alerts:**

- `server_key_mismatch_total` > 0
- `config_issue_blocked_total` rising
- `discovery_not_found_total` > 0 for critical servers

---

## 10. DB schema changes

- `Server.public_key_synced_at` (DateTime, nullable) — when `public_key` was last confirmed from node. Set on successful sync or LiveKeyFetch.
- `Server.key_status` (String, nullable) — `verified` | `unverified` | `not_found`. Updated by sync job and on LiveKeyFetch fail.
- Optional: `Server.public_key_fingerprint` (String, nullable) — first 8 chars of base64 for logging/audit.

Use `last_snapshot_at` as fallback for “last sync time” where we already have it; `public_key_synced_at` is set whenever we write `public_key` from node.

---

## 11. UI (short term)

- Server list/card: badge **Verified** / **Unverified** / **Not found** from `key_status`.
- When issue/reissue returns 409: show “Server key not verified. Run sync for this server or fix discovery.” + button “Sync server” (calls POST `/servers/{id}/sync`).

---

## 12. Test plan

- **Stale DB key:** issue/reissue triggers LiveKeyFetch; if node returns different key, DB updated, config has live key; if node unreachable → 409.
- **Server key rotated on node:** next sync or next issue/reissue fetches new key, config uses new key.
- **Discovery down / server not in discovery:** LiveKeyFetch fails → 409 with correct message.
- **Endpoint remap (phase 2):** block until mapping re-synced.

## 13. Implemented (patch summary)

- **Design doc:** this file.
- **LiveKeyFetch:** `app/services/server_live_key_service.py` — `live_key_fetch(server_id, adapter)` returns `LiveKeyResult` or raises `ServerNotSyncedError`. Agent mode: key from Redis heartbeat. Docker: key from `get_node_for_sync` / `discover_nodes`.
- **Hard gate:** All issue/reissue paths (admin_issue_peer, admin_rotate_peer, issue_device) call `live_key_fetch` before building config; on `ServerNotSyncedError` API returns **409** with `code: SERVER_NOT_SYNCED`, message "Server key not verified; run sync or fix discovery."
- **DB schema:** Migration 042 adds `Server.public_key_synced_at`, `Server.key_status` (verified | not_found). Sync success sets them; sync failure (node not found) sets `key_status = not_found`.
- **Scheduled sync:** Existing `server_sync_loop` + `run_sync_for_server` already run periodically; they now set `public_key_synced_at` and `key_status`.
- **Metrics:** `config_issue_blocked_total{reason}`, `server_key_sync_success_total`, `server_key_sync_fail_total{server_id,reason}`, `server_key_mismatch_total`, `discovery_not_found_total`.
- **Tests:** `test_issue_service` mocks `live_key_fetch` to return a valid `LiveKeyResult` so tests pass without a real node.
- **UI:** Optional — show server key status badges and 409 message "Run sync for this server" (see §11).
