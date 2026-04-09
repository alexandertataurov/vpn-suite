# syntax=docker/dockerfile:1
ARG PYTHON_IMAGE=python:3.11.9-slim
FROM ${PYTHON_IMAGE}
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
RUN --mount=type=cache,target=/root/.cache/pip \
    PIP_DISABLE_PIP_VERSION_CHECK=1 pip install --no-cache-dir psycopg2-binary==2.9.9 requests==2.32.3
COPY --chown=app:app generate_inventory.py /app/generate_inventory.py
USER app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
ENTRYPOINT ["python", "/app/generate_inventory.py"]
