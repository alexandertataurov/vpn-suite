# KPI Operating System v1

**Status:** Proposed  
**Audience:** Analytics, Product, Growth, Finance, Support, Founder

---

## 1. Purpose

This document defines the operating scoreboard for VPN Suite.

A metric only matters if someone owns it, reviews it, and changes something because of it. Otherwise it is just dashboard wallpaper.

---

## 2. Metric layers

### L1. Executive metrics
- active connected users
- net revenue / collections
- checkout conversion
- trial-to-paid conversion
- grace recovery rate
- monthly churn rate
- win-back rate
- ARPU / ARPPU

### L2. Functional metrics
**Growth:** acquisition cost, plan CTR, promo efficiency, referral rate  
**Product:** time to connect, setup failure rate, upgrade CTR  
**Support:** first response, resolution time, issue recurrence  
**Finance:** reconciliation exceptions, discount cost, recovered revenue  
**Ops:** incident counts, server saturation impact on churn

### L3. Diagnostic metrics
- device issue failure reasons
- payment error codes
- offer eligibility drop reasons
- cancel reasons distribution
- CRM message fatigue indicators

---

## 3. Review cadence

| Cadence | Review | Owner | Decisions expected |
|---|---|---|---|
| Daily | health check | Product/Growth/Ops | incidents, funnel breaks, payment anomalies |
| Weekly | lifecycle review | Product/Analytics | routing fixes, UX improvements |
| Weekly | monetization review | Growth/Finance | offers, pricing tests, promo governance |
| Weekly | support review | Support/Product | root causes, self-serve gaps |
| Monthly | executive review | Founder/Product/Finance | strategic priorities |

---

## 4. Core dashboards

1. **Lifecycle funnel dashboard** — visitor -> auth -> plan -> checkout -> paid -> first connect -> active
2. **Monetization dashboard** — plan mix, annual share, upgrade rate, offer performance
3. **Retention dashboard** — renewal, grace, cancellation, win-back
4. **Support dashboard** — issue classes, FRT, resolution, save rate
5. **Finance dashboard** — collections, discounts, liabilities, exceptions

---

## 5. Metric ownership matrix

| Metric | Owner | Backup owner | Action lever |
|---|---|---|---|
| checkout conversion | Growth | Product | checkout UX, promos, payment options |
| time to first connect | Product | Support | routing, onboarding, setup UX |
| grace recovery rate | Growth | Product | CRM timing, restore UX, offers |
| cancel deflection rate | Growth | Support | save rules, support scripting |
| revenue reconciliation exceptions | Finance | Backend | ledger fixes, admin controls |
| issue recurrence rate | Support | Product | bug fixes, education, diagnostics |

---

## 6. Experimentation rules

Every experiment must define:
- hypothesis,
- success metric,
- guardrail metrics,
- target segment,
- exposure logic,
- stop conditions,
- decision owner.

Never run monetization experiments without checking:
- churn impact,
- support volume impact,
- margin floor,
- fairness / trust impact.

---

## 7. Alerting thresholds

Alert when:
- checkout conversion drops below threshold,
- payment success drops sharply,
- activation failure spikes,
- grace recovery drops materially,
- support volume spikes by issue class,
- reconciliation exceptions rise above baseline.

---

## 8. Decision log

A monthly decision log must record:
- what changed,
- why it changed,
- which metrics moved,
- what was learned,
- what is next.

Without this, teams will rediscover the same lesson every six weeks like goldfish with admin privileges.
