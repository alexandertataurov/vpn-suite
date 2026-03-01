import { useQuery } from "@tanstack/react-query";
import { Skeleton, LiveIndicator } from "@/design-system";
import { Heading } from "@/design-system";
import { serverLogsKey } from "../api/query-keys";
import { api } from "../api/client";

interface ServerLogLine {
  ts: string;
  level: string;
  message: string;
  action_id?: string | null;
}

interface ServerLogsOut {
  lines: ServerLogLine[];
  total: number;
}

export function ServerLogsTab({ serverId }: { serverId: string }) {
  const { data, isLoading, error } = useQuery<ServerLogsOut>({
    queryKey: serverLogsKey(serverId),
    queryFn: ({ signal }) =>
      api.get<ServerLogsOut>(`/servers/${serverId}/logs?tail=200`, { signal }),
    enabled: !!serverId,
  });

  if (isLoading) return <Skeleton height={200} />;
  if (error) return <p className="text-warning">Failed to load logs.</p>;
  if (!data?.lines?.length) return <p className="text-muted">No log entries yet.</p>;

  return (
    <div className="server-logs-panel">
      <div className="server-logs-head">
        <Heading level={3} className="ref-settings-title server-logs-title">Action logs</Heading>
        <LiveIndicator status="live" />
      </div>
      <pre className="server-logs-pre" role="log">
        {data.lines.map((line, i) => (
          <div key={i} className={`server-log-line server-log-${line.level}`}>
            <span className="server-log-ts">{new Date(line.ts).toISOString()}</span>
            <span className="server-log-level">[{line.level}]</span>{" "}
            {line.action_id ? <span className="server-log-action">{line.action_id.slice(0, 8)}</span> : null}{" "}
            {line.message}
          </div>
        ))}
      </pre>
    </div>
  );
}
