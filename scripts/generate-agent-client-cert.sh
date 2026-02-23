#!/usr/bin/env bash
# Generate a client cert for node-agent (signed by secrets/agent_ca).
# Control plane Caddy :8443 trusts client certs from this CA.
# Run from project root. Output: secrets/agent_client_cert.pem, secrets/agent_client_key.pem

set -euo pipefail
cd "$(dirname "$0")/.."

SECRETS="${SECRETS_DIR:-secrets}"
PKI="$SECRETS/pki"
CA_CERT="$SECRETS/agent_ca.pem"
CA_KEY="${AGENT_CA_KEY:-$PKI/agent_ca.key}"
[ -f "$CA_KEY" ] || CA_KEY="$SECRETS/agent_ca.key"
CLIENT_CERT="$SECRETS/agent_client_cert.pem"
CLIENT_KEY="$SECRETS/agent_client_key.pem"
CLIENT_REQ="$SECRETS/agent_client_req.pem"

if [ ! -f "$CA_CERT" ] || [ ! -f "$CA_KEY" ]; then
  echo "Missing $CA_CERT or $CA_KEY. Create CA first (e.g. run once: openssl req -x509 -newkey rsa:2048 -keyout $CA_KEY -out $CA_CERT -days 365 -nodes -subj '/CN=dev-agent-ca')" >&2
  exit 1
fi

mkdir -p "$SECRETS"
openssl req -new -newkey rsa:2048 -keyout "$CLIENT_KEY" -out "$CLIENT_REQ" -subj "/CN=node-agent" -nodes
openssl x509 -req -in "$CLIENT_REQ" -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial -out "$CLIENT_CERT" -days 365
rm -f "$CLIENT_REQ"
chmod 600 "$CLIENT_KEY" "$CLIENT_CERT" 2>/dev/null || true
# Allow container user (app) to read when mounted into node-agent
chmod 644 "$CLIENT_CERT" 2>/dev/null || true
echo "Created $CLIENT_CERT and $CLIENT_KEY. Set in node-agent: MTLS_CERT_FILE=$CLIENT_CERT MTLS_KEY_FILE=$CLIENT_KEY MTLS_CA_FILE=$CA_CERT"
echo "Copy agent_ca.pem to the node host if agent runs elsewhere; Caddy already has it for verification."
