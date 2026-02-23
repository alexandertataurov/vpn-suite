#!/usr/bin/env bash
set -euo pipefail

# Bootstrap a production-like setup on this host:
# - create agent CA (for Caddy mTLS)
# - generate a prod env file under vpn-suite/secrets/
# - issue a node client cert and place it into amnezia/amnezia-awg2/secrets/
# - update node.env to use https://$PUBLIC_DOMAIN:8443 and the same AGENT_SHARED_TOKEN

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_DIR_DEFAULT="$(cd "$ROOT_DIR/../amnezia/amnezia-awg2" 2>/dev/null && pwd || true)"

# .env is the single source of truth; bootstrap reads and writes it.
ENV_IN="${ENV_IN:-$ROOT_DIR/.env}"
if [ ! -f "$ENV_IN" ]; then
  ENV_IN="/dev/null"
fi
ENV_OUT="${ENV_OUT:-$ROOT_DIR/.env}"
NODE_DIR="${NODE_DIR:-$NODE_DIR_DEFAULT}"
NODE_ENV="${NODE_ENV:-$NODE_DIR/secrets/node.env}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing dependency: $1" >&2; exit 1; }; }

need openssl
need python3

mkdir -p "$ROOT_DIR/secrets"

# Allow bootstrap without any existing env file. If missing, treat as empty.
if [ ! -f "$ENV_IN" ]; then
  ENV_IN="/dev/null"
fi
if [ -z "${NODE_DIR}" ] || [ ! -d "${NODE_DIR}" ]; then
  echo "NODE_DIR not found. Set NODE_DIR to your node repo dir (amnezia/amnezia-awg2)." >&2
  exit 2
fi
if [ ! -f "$NODE_ENV" ]; then
  echo "missing node env: $NODE_ENV" >&2
  exit 2
fi

AGENT_SHARED_TOKEN="$(NODE_ENV="$NODE_ENV" python3 - <<'PY'
from pathlib import Path
import os
p = Path(os.environ['NODE_ENV'])
for ln in p.read_text().splitlines():
    s = ln.strip()
    if not s or s.startswith('#') or '=' not in s:
        continue
    k, v = s.split('=', 1)
    if k.strip() == 'AGENT_SHARED_TOKEN':
        print(v.strip())
        raise SystemExit(0)
raise SystemExit(1)
PY
)" || {
  echo "AGENT_SHARED_TOKEN missing in $NODE_ENV" >&2
  exit 2
}

if [ "${#AGENT_SHARED_TOKEN}" -lt 32 ]; then
  echo "AGENT_SHARED_TOKEN in $NODE_ENV is too short (<32). Regenerate it." >&2
  exit 2
fi

PUBLIC_DOMAIN="$(ENV_IN="$ENV_IN" python3 - <<'PY'
from pathlib import Path
import os
p = Path(os.environ['ENV_IN'])
base = {}
for ln in p.read_text().splitlines():
    s = ln.strip()
    if not s or s.startswith('#') or '=' not in s:
        continue
    k, v = s.split('=', 1)
    base[k.strip()] = v.strip()
# Prefer explicit PUBLIC_DOMAIN; else derive from ADMIN_EMAIL; else empty.
if base.get('PUBLIC_DOMAIN'):
    print(base['PUBLIC_DOMAIN'])
    raise SystemExit(0)
email = base.get('ADMIN_EMAIL', '')
if '@' in email:
    print(email.split('@', 1)[1])
    raise SystemExit(0)
print('')
PY
)"
if [ -z "$PUBLIC_DOMAIN" ]; then
  PUBLIC_DOMAIN="vpn.vega.llc"
fi

# Normalize to hostname (strip scheme/port/path).
PUBLIC_DOMAIN="${PUBLIC_DOMAIN#http://}"
PUBLIC_DOMAIN="${PUBLIC_DOMAIN#https://}"
PUBLIC_DOMAIN="${PUBLIC_DOMAIN%%/*}"
PUBLIC_DOMAIN="${PUBLIC_DOMAIN%%:*}"

# Ensure agent CA exists for Caddy mTLS.
if [ ! -f "$ROOT_DIR/secrets/agent_ca.pem" ]; then
  "$ROOT_DIR/ops/pki/agent-mtls.sh" init-ca >/dev/null
fi

# Produce a production env file (keeps existing secrets where possible).
ENV_IN="$ENV_IN" ENV_OUT="$ENV_OUT" PUBLIC_DOMAIN="$PUBLIC_DOMAIN" AGENT_SHARED_TOKEN="$AGENT_SHARED_TOKEN" \
  python3 - <<'PY'
import os
from pathlib import Path

env_in = Path(os.environ['ENV_IN'])
env_out = Path(os.environ['ENV_OUT'])
public_domain = os.environ['PUBLIC_DOMAIN']
agent_token = os.environ['AGENT_SHARED_TOKEN']

base = {}
for ln in env_in.read_text().splitlines():
    s = ln.strip()
    if not s or s.startswith('#') or '=' not in s:
        continue
    k, v = s.split('=', 1)
    base[k.strip()] = v.strip()

def _get(k: str, default: str = '') -> str:
    return base.get(k, default)

def _rand_hex(nbytes: int) -> str:
    import subprocess
    return subprocess.check_output(['openssl', 'rand', '-hex', str(nbytes)], text=True).strip()

def ensure(v: str, nbytes: int) -> str:
    v = (v or '').strip()
    return v if v else _rand_hex(nbytes)

out = {}
out['ENVIRONMENT'] = 'production'
out['PUBLIC_DOMAIN'] = public_domain
out['AGENT_ALLOW_CIDRS'] = _get('AGENT_ALLOW_CIDRS') or '0.0.0.0/0 ::/0'

pg_user = _get('POSTGRES_USER') or 'postgres'
pg_db = _get('POSTGRES_DB') or 'vpn_admin'
pg_password = (_get('POSTGRES_PASSWORD') or '').strip() or ensure('', 24)

out['DATABASE_URL'] = _get('DATABASE_URL')
out['REDIS_URL'] = _get('REDIS_URL')
out['SECRET_KEY'] = ensure(_get('SECRET_KEY'), 32)
out['ADMIN_EMAIL'] = _get('ADMIN_EMAIL') or f'admin@{public_domain}'
out['ADMIN_PASSWORD'] = ensure(_get('ADMIN_PASSWORD'), 16)

out['BAN_CONFIRM_TOKEN'] = ensure(_get('BAN_CONFIRM_TOKEN'), 24)
out['REVOKE_CONFIRM_TOKEN'] = ensure(_get('REVOKE_CONFIRM_TOKEN'), 24)
out['BLOCK_CONFIRM_TOKEN'] = ensure(_get('BLOCK_CONFIRM_TOKEN'), 24)
out['RESTART_CONFIRM_TOKEN'] = ensure(_get('RESTART_CONFIRM_TOKEN'), 24)

cors = _get('CORS_ALLOW_ORIGINS')
out['CORS_ALLOW_ORIGINS'] = cors if cors else f'https://{public_domain}'

out['NODE_MODE'] = 'agent'
out['NODE_DISCOVERY'] = 'agent'
out['AGENT_SHARED_TOKEN'] = agent_token
out['AGENT_HEARTBEAT_TTL_SECONDS'] = _get('AGENT_HEARTBEAT_TTL_SECONDS') or '120'

out['POSTGRES_USER'] = pg_user
out['POSTGRES_PASSWORD'] = pg_password
out['POSTGRES_DB'] = pg_db

out['GRAFANA_ADMIN_USER'] = _get('GRAFANA_ADMIN_USER') or 'admin'
out['GRAFANA_ADMIN_PASSWORD'] = ensure(_get('GRAFANA_ADMIN_PASSWORD'), 16)

out['BOT_API_KEY'] = _get('BOT_API_KEY')
out['BOT_TOKEN'] = _get('BOT_TOKEN') or _get('TELEGRAM_BOT_TOKEN')
out['VITE_TELEGRAM_BOT_USERNAME'] = _get('VITE_TELEGRAM_BOT_USERNAME')
out['SUPPORT_HANDLE'] = _get('SUPPORT_HANDLE')
out['TELEGRAM_STARS_WEBHOOK_SECRET'] = _get('TELEGRAM_STARS_WEBHOOK_SECRET')

if not out['DATABASE_URL']:
    # Backend uses SQLAlchemy async engine (asyncpg).
    out['DATABASE_URL'] = f'postgresql+asyncpg://{pg_user}:{pg_password}@postgres:5432/{pg_db}'
if not out['REDIS_URL']:
    out['REDIS_URL'] = 'redis://redis:6379/0'

env_out.parent.mkdir(parents=True, exist_ok=True)
content = '\n'.join([f"{k}={out[k]}" for k in out.keys()]) + '\n'
env_out.write_text(content)
os.chmod(env_out, 0o600)
print(str(env_out))
PY

# Issue node certs into node secrets dir (if missing).
SERVER_ID="$(NODE_ENV="$NODE_ENV" python3 - <<'PY'
from pathlib import Path
import os
p = Path(os.environ['NODE_ENV'])
for ln in p.read_text().splitlines():
    s = ln.strip()
    if not s or s.startswith('#') or '=' not in s:
        continue
    k, v = s.split('=', 1)
    if k.strip() == 'SERVER_ID':
        print(v.strip())
        raise SystemExit(0)
raise SystemExit(1)
PY
)" || {
  echo "SERVER_ID missing in $NODE_ENV" >&2
  exit 2
}

if [ ! -f "$NODE_DIR/secrets/agent_client_cert.pem" ] || [ ! -f "$NODE_DIR/secrets/agent_client_key.pem" ]; then
  "$ROOT_DIR/ops/pki/agent-mtls.sh" issue-client "$SERVER_ID" "$NODE_DIR/secrets" >/dev/null
fi
# Make the files readable by the node-agent container user (uid=999 in our image).
chown 999:999 "$NODE_DIR/secrets/agent_client_cert.pem" "$NODE_DIR/secrets/agent_client_key.pem" 2>/dev/null || true
chmod 0444 "$NODE_DIR/secrets/agent_client_cert.pem" 2>/dev/null || true
chmod 0400 "$NODE_DIR/secrets/agent_client_key.pem" 2>/dev/null || true

# Patch node.env: point agent to https://$PUBLIC_DOMAIN:8443 and enforce mTLS.
NODE_ENV="$NODE_ENV" PUBLIC_DOMAIN="$PUBLIC_DOMAIN" AGENT_SHARED_TOKEN="$AGENT_SHARED_TOKEN" \
  python3 - <<'PY'
import os
from pathlib import Path

node_env = Path(os.environ['NODE_ENV'])
public_domain = os.environ['PUBLIC_DOMAIN']
agent_token = os.environ['AGENT_SHARED_TOKEN']

desired = {
    'CONTROL_PLANE_URL': f'https://{public_domain}:8443',
    'REQUIRE_MTLS': '1',
    'AGENT_SHARED_TOKEN': agent_token,
}

lines = node_env.read_text().splitlines()
out_lines = []
seen = set()
for ln in lines:
    s = ln.strip()
    if s and not s.startswith('#') and '=' in s:
        k, _ = s.split('=', 1)
        k = k.strip()
        if k in desired:
            out_lines.append(f"{k}={desired[k]}")
            seen.add(k)
            continue
    out_lines.append(ln)

for k, v in desired.items():
    if k not in seen:
        out_lines.append(f"{k}={v}")

node_env.write_text('\n'.join(out_lines).rstrip('\n') + '\n')
os.chmod(node_env, 0o600)
PY

echo "Bootstrapped:"
echo "- env (source of truth): $ENV_OUT"
echo "- agent CA: $ROOT_DIR/secrets/agent_ca.pem"
echo "- node certs: $NODE_DIR/secrets/agent_client_cert.pem and agent_client_key.pem"
echo "- node env updated: $NODE_ENV"
