# Key rotation and VPN

After rotating keys, config download can fail or VPN may not connect until configs are reissued.

## Which keys affect VPN

| Key | Effect if rotated |
|-----|-------------------|
| **SECRET_KEY** (.env) | Configs already stored in DB were encrypted with the old key. Download/QR returns "Config decryption failed". New issue/reissue encrypts with the new key. |
| **Server WireGuard key** (e.g. container recreated) | DB may have old `Server.public_key`. Issued configs contain that old key → handshake fails. Sync updates DB from node; reissue builds config with current key. |
| **AGENT_SHARED_TOKEN** | Node-agent auth; rotate only if needed; reconfigure agents with new token. |

## Fix after rotation

**One command (recommended):** Re-sync server keys and reissue all devices so configs use the current SECRET_KEY and current server key:

```bash
./manage.sh fix-server-public-key
```

- **Docker mode:** Syncs all servers from nodes, then reissues every non-revoked device on every server.
- **Agent mode:** Skips sync (trigger Sync in Admin if needed); reissues every device on every server.

**Per server:**

```bash
./manage.sh fix-server-public-key <server_id>
```

**Per device (Admin or API):**  
Admin → Devices → device → Reissue, or `./scripts/call_admin_api.sh reissue <device_id>`.

## After running the fix

- Users must **download a new config** (old download links are one-time and replaced by reissue).
- Existing VPN connections may drop; reconnect with the new config.
