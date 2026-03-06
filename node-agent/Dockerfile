# syntax=docker/dockerfile:1
# Node Agent (data-plane sidecar) — pulls desired state, reconciles via local docker exec, pushes heartbeat.
# Production: pin digest after selecting a known-good base and mirroring.
FROM python@sha256:9e01bf1ae5db7649a236da7be1e94ffbbbdd7a93f867dd0d8d5720d9e1f89fab

WORKDIR /app

RUN rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends docker.io ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r app && useradd -r -g app app

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    PIP_DISABLE_PIP_VERSION_CHECK=1 pip install --no-cache-dir -r requirements.txt

COPY --chown=app:app agent.py log_utils.py .

USER app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
EXPOSE 9105
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:9105/healthz', timeout=2).read()"

CMD ["python", "agent.py"]
