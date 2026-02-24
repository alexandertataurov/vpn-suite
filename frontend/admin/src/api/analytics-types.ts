/** Analytics API response types (mirror of backend / shared for admin). */

export interface ServiceScrapeStatus {
  job: string;
  instance: string;
  health: string;
  last_scrape: string | null;
  last_error: string | null;
}

export interface TelemetryServicesOut {
  services: ServiceScrapeStatus[];
  prometheus_available: boolean;
  message?: string | null;
}

export interface MetricsKpisOut {
  request_rate_5m: number | null;
  error_rate_5m: number | null;
  latency_p95_seconds: number | null;
  prometheus_available: boolean;
  message?: string | null;
}
