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
COPY --chown=app:app wg_exporter.py /app/wg_exporter.py
USER app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
EXPOSE 9586
ENTRYPOINT ["python", "/app/wg_exporter.py"]
