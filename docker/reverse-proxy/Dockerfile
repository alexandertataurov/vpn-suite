# syntax=docker/dockerfile:1
ARG CADDY_IMAGE=caddy:2.8.4-alpine
FROM ${CADDY_IMAGE}
RUN apk add --no-cache nss-tools curl libcap && \
    setcap 'cap_net_bind_service=+ep' /usr/bin/caddy
USER caddy
