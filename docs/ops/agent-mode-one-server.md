# Agent mode: one server and node-agent setup

When using **NODE_DISCOVERY=agent**, the admin UI shows only servers that have an active heartbeat in Redis. So you need exactly one Server row in the DB whose `id` matches the `SERVER_ID` that the node-agent sends.

## 1. Restart admin-api with Docker socket (for Telemetry tab)

So that the **Telemetry > Docker Services** tab can work:

```bash
cd /opt/vpn-suite
docker compose up -d admin-api
```

The compose file mounts `/var/run/docker.sock` into admin-api. If you use a custom compose, add:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

## 2. Create the single Server and get SERVER_ID

**Option A – Using manage.sh (recommended)**

```bash
./manage.sh seed-agent-server
```

This creates a server with id `vpn-node-1` (or `AGENT_SERVER_ID` if you set it). The command prints the id. Then set that in your node-agent environment:

```bash
# Example: custom id
AGENT_SERVER_ID=amnezia-awg ./manage.sh seed-agent-server
# → Set in your node-agent env: SERVER_ID=amnezia-awg
```

**Option B – Using Admin UI**

1. Open **Servers** → **Add Server**.
2. Fill name, region, API endpoint. For **ID** (if the UI supports it), enter a fixed id (e.g. `vpn-node-1`). If the UI does not show ID, use Option A or the API below.

**Option C – Using API with optional id**

```bash
curl -s -X POST "https://YOUR_DOMAIN/api/v1/servers" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"id":"vpn-node-1","name":"VPN node (agent)","region":"docker","api_endpoint":"https://localhost"}'
```

The response includes `"id":"vpn-node-1"`. Use that as `SERVER_ID` in the node-agent.

## 3. Configure node-agent

Set in the node-agent environment (container env, systemd, or host):

- **SERVER_ID** = the server id from step 2 (e.g. `vpn-node-1` or `amnezia-awg`).
- **AGENT_SHARED_TOKEN** = same value as in control-plane `.env`.
- **CONTROL_PLANE_URL** = `https://$PUBLIC_DOMAIN:8443` (mTLS port; agent API).

The node-agent **must send the server’s WireGuard public key** in each heartbeat (`public_key` in the payload). The control-plane persists it on the Server row so that **issue/reissue** can verify the key (and so device creation works even when Redis TTL has expired, using the key from DB). If the agent does not send `public_key`, create device will fail with “Server key not verified” until the key is set (e.g. by running Sync once so the agent reports it, or by setting it manually in the DB).

After the agent starts and sends heartbeats (with `public_key`), only this server will appear in the Servers list and its telemetry will come from the heartbeat.

## 4. Verify

- Open **Servers**: you should see one server, with **Last seen** updating and status **Active** when the agent is running.
- **Telemetry** for that server (peers, traffic) comes from the heartbeat.
- **Telemetry > Docker Services** works if admin-api has the Docker socket mounted and `DOCKER_TELEMETRY_HOSTS_JSON` is set.
