import { ExternalLink } from "lucide-react";
import { getBaseUrl } from "@vpn-suite/shared/api-client";
import { TelemetrySection } from "./TelemetrySection";

export function TraceValidationPanel() {
  return (
    <TelemetrySection
      title="Trace validation"
      ariaLabel="Trace validation"
      description="Validate end-to-end tracing when the monitoring profile is running."
    >
      <div className="text-xs text-muted font-mono space-y-1">
        <div>1) Set OTEL_TRACES_ENDPOINT=otel-collector:4317 (core services).</div>
        <div>2) curl http://localhost:8000/health</div>
        <div>3) curl http://localhost:8090/healthz</div>
        <div>4) curl http://localhost:3200/metrics | rg tempo_distributor_spans_received_total</div>
      </div>
      <p className="text-xs text-muted mt-3">
        <a
          href={`${getBaseUrl().replace(/\/$/, "")}/api/v1/_debug/metrics-targets`}
          target="_blank"
          rel="noopener noreferrer"
          className="telemetry-debug-anchor"
        >
          <ExternalLink className="icon-sm" aria-hidden />
          Debug: raw Prometheus targets
        </a>
      </p>
    </TelemetrySection>
  );
}
