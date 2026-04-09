# syntax=docker/dockerfile:1
ARG PYTHON_IMAGE=python:3.11.9-slim
FROM ${PYTHON_IMAGE}
WORKDIR /app
RUN rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends docker.io ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r app && useradd -r -g app app
RUN --mount=type=cache,target=/root/.cache/pip \
    PIP_DISABLE_PIP_VERSION_CHECK=1 pip install --no-cache-dir httpx
COPY infra/__init__.py infra/
COPY infra/discovery/ infra/discovery/
USER app
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DISCOVERY_OUT_DIR=/work \
    DISCOVERY_INTERVAL_SECONDS=60
ENTRYPOINT ["python", "-m", "infra.discovery.runtime.run_loop"]
