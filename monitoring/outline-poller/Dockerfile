FROM python:3.11-slim
WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir prometheus-client==0.20.0 requests==2.32.3
COPY poller.py /app/poller.py
ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["python", "/app/poller.py"]
