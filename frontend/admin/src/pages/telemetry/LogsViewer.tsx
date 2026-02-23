import { useMemo, useState } from "react";
import { Button, Panel, SearchInput, Skeleton, CopyButton, LiveIndicator } from "@vpn-suite/shared/ui";
import type { ContainerLogLine } from "@vpn-suite/shared/types";

interface Props {
  logs: ContainerLogLine[];
  isLoading: boolean;
  canReadLogs: boolean;
  error?: unknown;
}

function lineClass(severity: ContainerLogLine["severity"]): string {
  if (severity === "error") return "log-line error";
  if (severity === "warn") return "log-line warn";
  return "log-line info";
}

export function LogsViewer({ logs, isLoading, canReadLogs, error }: Props) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((line) => line.message.toLowerCase().includes(q));
  }, [logs, search]);

  const textDump = filtered
    .map((line) => `${new Date(line.ts).toISOString()} [${line.stream}] ${line.message}`)
    .join("\n");

  const downloadLogs = () => {
    const blob = new Blob([textDump], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `container-logs-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Panel as="section" variant="outline" aria-label="Logs">
      <div className="ref-section-head">
        <h3 className="ref-settings-title">Logs</h3>
        {canReadLogs && !isLoading && !error ? <LiveIndicator status="live" /> : null}
        {canReadLogs ? (
          <div className="actions-row flex-wrap">
            <SearchInput
              label="Search logs"
              value={search}
              placeholder="error, timeout, warning"
              onChange={(e) => setSearch(e.target.value)}
              className="w-auto"
            />
            <CopyButton value={textDump} label="Copy logs" copiedMessage="Copied" />
            <Button size="sm" variant="ghost" onClick={downloadLogs}>
              Download
            </Button>
          </div>
        ) : null}
      </div>

      {!canReadLogs ? (
        <p className="text-muted">Logs require admin permission: telemetry:logs:read.</p>
      ) : isLoading ? (
        <Skeleton height={140} />
      ) : error ? (
        <p className="text-warning" role="alert">Failed to load logs for this container.</p>
      ) : (
        <div className="logs-viewer">
          {filtered.length === 0 ? (
            <p className="text-muted">No log lines.</p>
          ) : (
            filtered.map((line, idx) => (
              <div className={lineClass(line.severity)} key={`log-${idx}-${line.ts}`}>
                <span>{new Date(line.ts).toLocaleTimeString()}</span>
                <span>[{line.stream}]</span>
                <span>{line.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </Panel>
  );
}
