import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { IconServer } from "@/design-system/icons";
import { Card, Skeleton, PrimitiveBadge } from "@/design-system";
import { Heading } from "@/design-system";
import type { ConnectionNodesOut } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { CONNECTION_NODES_KEY } from "../../api/query-keys";

export function ConnectionNodesSection() {
  const query = useQuery<ConnectionNodesOut>({
    queryKey: CONNECTION_NODES_KEY,
    queryFn: ({ signal }) => api.get<ConnectionNodesOut>("/overview/connection_nodes", { signal }),
    staleTime: 30_000,
  });

  if (query.isLoading || query.error) {
    return (
      <Card as="section" variant="outline" className="connection-nodes" aria-label="Connection nodes" data-testid="dashboard-connection-nodes">
        <Heading level={3} className="ref-settings-title">Connection nodes</Heading>
        {query.isLoading ? (
          <div className="connection-nodes-grid">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="shimmer" height={72} />
            ))}
          </div>
        ) : (
          <p className="ref-settings-text ref-muted">Unable to load nodes.</p>
        )}
      </Card>
    );
  }

  const nodes = query.data?.nodes ?? [];
  if (nodes.length === 0) {
    return (
      <Card as="section" variant="outline" className="connection-nodes" aria-label="Connection nodes" data-testid="dashboard-connection-nodes">
        <Heading level={3} className="ref-settings-title">Connection nodes</Heading>
        <p className="ref-settings-text ref-muted">No servers or integrations yet.</p>
      </Card>
    );
  }

  return (
    <Card as="section" variant="outline" className="connection-nodes" aria-label="Connection nodes" data-testid="dashboard-connection-nodes">
      <Heading level={3} className="ref-settings-title">Connection nodes</Heading>
      <p className="ref-settings-text ref-muted">Servers — peers at a glance.</p>
      <div className="connection-nodes-grid">
        {nodes.map((node) => (
          <Link
            key={node.id}
            to={node.to}
            className="connection-node-card"
            data-type={node.type}
            aria-label={`${node.label}, ${node.peer_count} peers`}
          >
            <div className="connection-node-header">
              <IconServer className="connection-node-icon" aria-hidden strokeWidth={1.5} />
              <span className="connection-node-label">{node.label}</span>
              <PrimitiveBadge variant="neutral" className="connection-node-type">
                Server
              </PrimitiveBadge>
            </div>
            <div className="connection-node-meta">
              <span className="connection-node-stat">
                Peers: <strong>{node.peer_count}</strong>
              </span>
              {node.region && <span className="ref-muted"> · {node.region}</span>}
              {node.status && (
                <PrimitiveBadge
                  variant={
                    node.status === "connected" ||
                    node.status === "ok" ||
                    node.status === "online" ||
                    node.status === "healthy"
                      ? "success"
                      : "warning"
                  }
                  className="connection-node-status"
                >
                  {node.status}
                </PrimitiveBadge>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
