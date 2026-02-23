FROM caddy:2-alpine
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache nss-tools curl
