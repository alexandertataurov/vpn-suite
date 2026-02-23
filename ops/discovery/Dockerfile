FROM python:3.11-slim
WORKDIR /app
RUN rm -f /etc/apt/apt.conf.d/docker-clean; \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends docker-cli ca-certificates \
    && pip install --no-cache-dir httpx
COPY ops/__init__.py ops/
COPY ops/discovery/ ops/discovery/
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV DISCOVERY_OUT_DIR=/work
ENV DISCOVERY_INTERVAL_SECONDS=60
ENTRYPOINT ["python", "-m", "ops.discovery.run_loop"]
