#!/usr/bin/env bash
# Generate a client cert for node-agent (signed by secrets/agent_ca).
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")/../../.."

command -v openssl >/dev/null 2>&1 || { echo "missing openssl" >&2; exit 1; }

SECRETS="${SECRETS_DIR:-secrets}"
PKI="$SECRETS/pki"
CA_CERT="$SECRETS/agent_ca.pem"
CA_KEY="${AGENT_CA_KEY:-$PKI/agent_ca.key}"
[[ -f "$CA_KEY" ]] || CA_KEY="$SECRETS/agent_ca.key"

CLIENT_CERT="$SECRETS/agent_client_cert.pem"
CLIENT_KEY="$SECRETS/agent_client_key.pem"
CLIENT_REQ="$SECRETS/agent_client_req.pem"

if [[ ! -f "$CA_CERT" || ! -f "$CA_KEY" ]]; then
  echo "Missing $CA_CERT or $CA_KEY. Create CA first." >&2
  exit 1
fi

mkdir -p "$SECRETS"

if [[ -f "$CLIENT_CERT" || -f "$CLIENT_KEY" ]]; then
  echo "Overwriting existing client certs in $SECRETS" >&2
fi

openssl req -new -newkey rsa:2048 -keyout "$CLIENT_KEY" -out "$CLIENT_REQ" -subj "/CN=node-agent" -nodes
openssl x509 -req -in "$CLIENT_REQ" -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial -out "$CLIENT_CERT" -days 365
rm -f "$CLIENT_REQ"
chmod 600 "$CLIENT_KEY" "$CLIENT_CERT" 2>/dev/null || true
chmod 644 "$CLIENT_CERT" 2>/dev/null || true
echo "Created $CLIENT_CERT and $CLIENT_KEY. Set in node-agent: MTLS_CERT_FILE=$CLIENT_CERT MTLS_KEY_FILE=$CLIENT_KEY MTLS_CA_FILE=$CA_CERT"
