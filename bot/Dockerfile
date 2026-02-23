# Build context: from repo root (e.g. docker build -f bot/Dockerfile .)
FROM python:3.12-slim

WORKDIR /app

COPY bot/requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

COPY bot/ .

ENV PYTHONUNBUFFERED=1
EXPOSE 8090

CMD ["python", "main.py"]
