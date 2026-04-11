# Correlation ID Usage

The miniapp API layer preserves backend correlation and request IDs for debugging and support.

## Flow

1. Backend returns `X-Request-ID` and `X-Correlation-ID` in response headers.
2. `ApiError` preserves `requestId` and `correlationId` for failed requests.
3. Use `onRequestLog` (optional) to log path, method, status, duration, and IDs — never bodies or tokens.

## When reporting issues

Include `err.requestId` and `err.correlationId` from `ApiError` so backend logs can be correlated.

```ts
catch (err) {
  if (err instanceof ApiError) {
    console.error(err.code, err.message, { requestId: err.requestId, correlationId: err.correlationId });
  }
}
```

## Log hook (optional)

```ts
createApiClient({
  baseUrl,
  onRequestLog: (info) => {
    // info: { path, method, status?, durationMs, requestId?, correlationId?, errorCode? }
    // No bodies, no tokens — safe for telemetry.
    analytics.track("api_request", info);
  },
});
```
