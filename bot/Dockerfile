# syntax=docker/dockerfile:1
ARG PYTHON_IMAGE=python:3.12.8-slim
FROM ${PYTHON_IMAGE}
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY bot/requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    PIP_DISABLE_PIP_VERSION_CHECK=1 pip install --no-cache-dir -r requirements.txt
COPY --chown=app:app bot/ .
USER app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
EXPOSE 8090
CMD ["python", "main.py"]
