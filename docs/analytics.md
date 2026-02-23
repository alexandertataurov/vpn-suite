# Analytics: MRR, ARPPU, conversion

Base tables: `users`, `subscriptions`, `payments`, `funnel_events`.

## MRR (Monthly Recurring Revenue)

Approximate MRR from completed payments in the last 30 days, normalized to monthly:

```sql
SELECT
  COALESCE(SUM(p.amount) * 30.0 / NULLIF(
    EXTRACT(EPOCH FROM (MAX(p.created_at) - MIN(p.created_at))) / 86400, 0
  ), 0) AS mrr_approx
FROM payments p
WHERE p.status = 'completed'
  AND p.created_at >= NOW() - INTERVAL '30 days';
```

Or simple sum of payments in last 30 days as "MRR" (if all are monthly):

```sql
SELECT COALESCE(SUM(amount), 0) AS mrr_last_30d
FROM payments
WHERE status = 'completed'
  AND created_at >= NOW() - INTERVAL '30 days';
```

## ARPPU (Average Revenue Per Paying User)

Revenue in period / distinct paying users in period:

```sql
SELECT
  COALESCE(SUM(p.amount), 0) AS revenue,
  COUNT(DISTINCT p.user_id) AS paying_users,
  CASE WHEN COUNT(DISTINCT p.user_id) > 0
    THEN SUM(p.amount) / COUNT(DISTINCT p.user_id)
    ELSE 0 END AS arppu
FROM payments p
WHERE p.status = 'completed'
  AND p.created_at >= NOW() - INTERVAL '30 days';
```

## Conversion (funnel)

Counts by funnel step (from `funnel_events`):

```sql
SELECT
  event_type,
  COUNT(*) AS cnt,
  COUNT(DISTINCT user_id) AS users
FROM funnel_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY event_type;
```

Conversion rates (start → payment → issue):

```sql
WITH steps AS (
  SELECT
    COUNT(DISTINCT CASE WHEN event_type = 'start'   THEN user_id END) AS starts,
    COUNT(DISTINCT CASE WHEN event_type = 'payment' THEN user_id END) AS payments,
    COUNT(DISTINCT CASE WHEN event_type = 'issue'   THEN user_id END) AS issues
  FROM funnel_events
  WHERE created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  starts,
  payments,
  issues,
  CASE WHEN starts > 0   THEN ROUND(100.0 * payments / starts, 2)   ELSE NULL END AS start_to_payment_pct,
  CASE WHEN payments > 0 THEN ROUND(100.0 * issues / payments, 2) ELSE NULL END AS payment_to_issue_pct
FROM steps;
```

## Grafana / JSON

- Use Postgres as data source; add panels with the queries above.
- Time range: use `$__timeFrom()` / `$__timeTo()` and replace `NOW() - INTERVAL '30 days'` with a parameter.
- For a pre-built JSON dashboard, export a Grafana dashboard that uses these queries and commit to `monitoring/` (optional).
