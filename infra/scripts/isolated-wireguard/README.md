# Isolated WireGuard Stack

Standalone single-client WireGuard server on a dedicated UDP port and subnet.

Files:
- `.env`: runtime settings
- `secrets/server_private_key`: server private key
- `secrets/client_private_key`: client private key
- `secrets/client_public_key`: client public key
- `secrets/preshared_key`: peer preshared key
- `client.conf`: client import file

Commands:
- `./manage.sh config-validate`
- `./manage.sh up`
- `./manage.sh status`
- `./manage.sh logs`
- `./manage.sh down`
