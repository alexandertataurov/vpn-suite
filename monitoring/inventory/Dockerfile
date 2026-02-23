FROM python:3.11-slim
WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir psycopg2-binary==2.9.9 requests==2.32.3
COPY generate_inventory.py /app/generate_inventory.py
ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["python", "/app/generate_inventory.py"]
