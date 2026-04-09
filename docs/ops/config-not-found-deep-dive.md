# Deep dive: "Config not found" (404) on config content

## Summary

**Symptom:** User clicks "View config" (e.g. "Config: wg • pending • 26.02.2026") and sees:  
*"Config not found. It may have been reissued or removed. Open the device and use the current config link."*

**Root cause:** The `issued_config_id` sent to `GET /admin/configs/issued/{id}/content` no longer exists in the DB. The most common cause is **reissue**: reissue deletes old `IssuedConfig` rows and creates new ones, but the **devices list cache was not invalidated** after reissue, so the UI could still show and use stale config IDs.

---

## Flow

### 1. Where config IDs come from

- **GET /devices** (list) returns `DeviceList` with `items: DeviceOut[]`. Each `DeviceOut` includes `issued_configs: IssuedConfigOut[]` (id, profile_type, consumed_at, created_at).
- List is **cached in Redis** (key pattern `REDIS_KEY_DEVICES_LIST*`, TTL from `DEVICES_LIST_CACHE_TTL_SECONDS`).
- **GET /devices/{id}** (single device) also returns `DeviceOut` with `issued_configs` (no list cache; direct DB + optional device cache).

### 2. When IssuedConfig rows are deleted

- **Reissue** (`reissue_config_for_device`): deletes all `IssuedConfig` for that device and server, then inserts three new rows (awg, wg_obf, wg). So every reissue replaces config IDs.
- **Device delete**: cascade deletes `IssuedConfig` (FK `ondelete=CASCADE`).
- **Server delete**: cascade deletes `IssuedConfig`.

### 3. When cache was invalidated (before fix)

- Device create (issue, admin issue), revoke, bulk revoke, delete → `invalidate_devices_list_cache()` was called.
- **Reissue did NOT call** `invalidate_devices_list_cache()`.

So after a reissue:

1. Backend still had a cached list entry containing the **old** `issued_configs` (with deleted IDs).
2. Any request that matched the same list cache key (same filters, pagination, etc.) received that stale list.
3. User clicked "View configs" or a config chip → frontend sent the old `issued_config_id` → backend 404.

### 4. Content endpoint behaviour

- **GET /admin/configs/issued/{issued_config_id}/content**
  1. Load `IssuedConfig` by id. If missing → **404** "Config not found…".
  2. Load `Device` by `issued_config.device_id`. If `apply_status` not in (APPLIED, VERIFIED) → **503** "Peer not yet applied on server; try again shortly."
  3. Else return decrypted content.

So "Config not found" is **only** 404 (id not in DB). The 503 (peer not applied) shows a different message.

---

## Fix applied

1. **Backend** ([`devices.py`](../../apps/admin-api/app/api/v1/devices.py)): After successful `POST /devices/{id}/reissue`, call `invalidate_devices_summary_cache()` and `invalidate_devices_list_cache()`. So the next list request after reissue hits the DB and returns the new `issued_configs` with new IDs.
2. **Error message** ([`admin_configs.py`](../../apps/admin-api/app/api/v1/admin_configs.py)): 404 message updated to: *"Refresh the device page and use the latest config link, or reissue the config."*

---

## Remaining edge cases

- **Two tabs:** Tab A has list open; tab B reissues the device. Tab A’s React Query cache still has old config IDs until tab A refetches (e.g. change filters, refresh, or reissue success in the same tab invalidates). Backend cache is now invalidated on reissue, so when tab A refetches it gets fresh data from DB.
- **503 (peer not applied):** If the device was never applied or apply failed, config content returns 503. User should use "Reconcile peer" or wait for reconcile, then try again. Config download/QR endpoints also gate on `apply_status` (APPLIED/VERIFIED).

---

## Invariants (no-drift)

- Config is not deliverable (content, download, QR) until the device’s peer is present on the node and `apply_status` is APPLIED or VERIFIED.
- Reissue replaces IssuedConfig rows; list and summary caches are invalidated so the UI can show the new config links after reissue.

---

## Why issued configs had wrong server PublicKey

**Symptom:** Client config has `[Peer] PublicKey = UMGAV6qsU/...` but the real server has a different key (e.g. `w6IIb324/...`) → handshake never completes.

**Cause:** Configs use `server.public_key` from the DB. Server sync updates that from the node, but when building the snapshot the code used `public_key=server.public_key or node.public_key`, so the **DB value was preferred** over the live key from the node. A wrong or stale DB value was never corrected by sync.

**Fix:** (1) In `server_sync_service.build_snapshot_from_node`, prefer the node (runtime) key so sync corrects the DB. (2) In **agent mode**, reissue/issue can still read a stale `Server.public_key` because sync is queued and does not run in-process. So we also **prefer the live key from the agent heartbeat** when building configs: `_server_public_key_for_config(server_id, server.public_key)` reads Redis `agent:hb:{server_id}` and uses `public_key` from the heartbeat when present. That way the first reissue after the fix uses the correct key even before the DB is updated, and we persist the key to `Server` when it comes from heartbeat so the DB is corrected.

**Next steps (run these after deploying the fix and rebuilding admin-api):**
1. Rebuild so the script is in the image: `./manage.sh build`
2. **Refresh DB key:** Run sync so `Server.public_key` is updated from the node:
   - **Docker mode:** `./manage.sh fix-server-public-key` (syncs all active servers).
   - **Agent mode:** Trigger sync from Admin (Servers → server → Sync) or `POST /api/v1/servers/<server_id>/sync`.
3. **Reissue affected devices:** So they get a config with the correct server key:
   - **One server:** `./manage.sh fix-server-public-key <server_id>` (syncs that server then reissues all its devices).
   - **Or manually:** Admin → Devices → each device → Reissue.
