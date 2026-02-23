---
name: project-ops-suite
description: Understand, operate, and evolve a unified production system built with Docker Compose (control-plane services + optional external nodes + monitoring). Use when editing core project files, managing deployment, architecture, telemetry, healthchecks, API integrations, rollout, rollback, or troubleshooting across services.
---

# Project Operations Suite

## When to use this skill

* Editing any file in the main project root
* Working with:

  * `docker-compose.yml`
  * `manage.sh`
  * `services/`
  * `monitoring/`
  * backend APIs
  * admin UI
* Questions about:

  * system architecture
  * component interaction
  * deployment
  * migration
  * rollout / rollback
  * service orchestration
  * API contracts
  * external node integration
  * telemetry
  * limits / quotas
  * monitoring
  * performance
  * troubleshooting

---

# Architecture Model (Strict Boundaries)

## High-Level Separation

The system follows a **Control Plane / Data Plane / Observability** separation.

### Control Plane

Core business logic and orchestration:

* API services
* admin panel
* database
* cache
* job queues

### Data Plane (optional / external systems)

* External nodes
* Compute services
* Worker clusters
* Managed infrastructure
* Third-party integrations

External systems must be treated as **black boxes** unless explicitly defined otherwise.

### Observability Layer

* Monitoring
* Logging
* Metrics
* Alerting

---

# Core Principles

## 1. Strict Boundaries

* Never modify external systems unless explicitly required.
* Interact only via documented APIs, CLI interfaces, or controlled proxies.
* No hidden coupling.

## 2. Sequential Execution

Work step-by-step.
Every change must:

* build successfully
* pass healthchecks
* pass smoke tests
* not degrade other services

No “big bang” refactors.

## 3. Small, Testable Increments

Each sprint must:

* produce a working state
* include stabilization pass
* verify end-to-end flow

No speculative architecture changes.

## 4. Secrets & Security

* No secrets in git.
* Use `.env` or runtime injection.
* Least privilege containers.
* No privileged mode unless unavoidable.

## 5. Healthchecks Everywhere

Every service must have:

* Docker healthcheck
* readiness endpoint
* liveness endpoint

Never ship services without health monitoring.

## 6. Error Discipline

* Consistent error structure
* Stable error codes
* No stack traces to clients
* Full structured logs server-side

## 7. Backups Before Change

Before migrations or rollouts:

* Backup databases
* Backup persistent volumes
* Document rollback path

---

# Standard Stack Model

## Typical Core Services

| Component     | Role                 |
| ------------- | -------------------- |
| api-service   | Main backend API     |
| database      | Primary data store   |
| cache         | Redis or equivalent  |
| reverse-proxy | HTTPS entry          |
| worker        | Background jobs      |
| monitoring    | Metrics + dashboards |

---

# Operational Interface

Use `manage.sh` (or equivalent wrapper) as the **single operational interface**.

Examples:

* `config` – validate and render configuration
* `build` – build images
* `up-core` – start core services
* `down-core` – stop core services
* `logs <service>` – follow logs
* `migrate` – run DB migrations
* `backup` – snapshot persistent data
* `rollback` – revert to last stable state

Raw docker commands should not be default operational advice.

---

# Monitoring & Telemetry Requirements

## Metrics

* Service uptime
* Response times
* Error rates
* Resource usage (CPU, RAM)
* Queue length (if applicable)

## Dashboards Must Show

* System health overview
* Component health
* Throughput
* Failure trends
* External dependency status

## Alerts Must Exist For

* Service unreachable
* DB down
* High error rate
* Latency spike
* Resource exhaustion

Observability must work without modifying external nodes unless explicitly permitted.

---

# Inter-Service Communication

* Use service DNS names (never localhost inside containers)
* Implement:

  * retries
  * exponential backoff
  * circuit breakers where critical

Never assume zero network failure.

---

# UI / Admin Standards

If project includes admin UI:

* Clean, minimal, readable
* Responsive
* Dark/light theme support
* Clear hierarchy
* Proper loading / empty / error states
* No hidden destructive actions
* Operator-friendly UX

Admin panel must always answer:

* What is broken?
* What needs action?
* What is the system state?

---

# Deployment Discipline

## Rollout

1. Backup
2. Stop legacy (if migrating)
3. Deploy new stack
4. Verify health
5. Smoke test key flows
6. Enable monitoring

## Rollback

* Stop new stack
* Restore backup
* Restart previous stable system

Rollback must always be defined before rollout.

---

# Naming Conventions

* Services: lowercase-hyphen
* Env vars: UPPERCASE_SNAKE_CASE
* One shared Docker network
* Clear volume naming

---

# Common Failure Points

* Using localhost inside containers
* Missing healthchecks
* Silent env misconfig
* Schema drift
* Unbounded resource usage
* Ignoring cross-service impact

---

# Change Protocol

When suggesting changes:

1. Think system-wide.
2. Break into small increments.
3. Validate each step.
4. Update documentation.
5. Update monitoring.
6. Confirm rollback path.

No architectural changes without stabilization.

---

# Mindset

This skill treats every project as:

* production system
* long-term maintainable asset
* operationally observable
* incrementally evolvable

The goal is not just “it works”.
The goal is:
**it survives growth, scale, failure, and operator mistakes.**