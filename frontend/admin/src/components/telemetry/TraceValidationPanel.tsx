import { Panel } from "@vpn-suite/shared/ui";

export function TraceValidationPanel() {
  return (
    <Panel as="section" variant="outline" aria-label="Trace validation">
      <h3 className="ref-settings-title">Trace validation</h3>
      <p className="text-sm text-muted mb-2">
        Validate end-to-end tracing when the monitoring profile is running.
      </p>
      <div className="text-xs text-muted font-mono space-y-1">
        <div>1) Set OTEL_TRACES_ENDPOINT=otel-collector:4317 (core services).</div>
        <div>2) curl http://localhost:8000/health</div>
        <div>3) curl http://localhost:8090/healthz</div>
        <div>4) curl http://localhost:3200/metrics | rg tempo_distributor_spans_received_total</div>
      </div>
    </Panel>
  );
}
