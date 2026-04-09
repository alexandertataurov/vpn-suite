FROM alpine:3.20

RUN apk add --no-cache dumb-init iproute2 iptables wireguard-tools

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
