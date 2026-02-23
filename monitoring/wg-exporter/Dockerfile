FROM python:3.11-slim
WORKDIR /app
RUN rm -f /etc/apt/apt.conf.d/docker-clean; \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends docker-cli
COPY wg_exporter.py /app/wg_exporter.py
EXPOSE 9586
ENTRYPOINT ["python", "/app/wg_exporter.py"]
