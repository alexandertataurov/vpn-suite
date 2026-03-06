import { useCallback, useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { Button, ErrorState, Skeleton } from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { VpnNodeDrilldown, VpnNodeGrid } from "@/design-system/widgets/vpn-node";
import type { VpnNodeCard as VpnNodeCardType } from "./types";

export function VpnNodesPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { data: cards, isLoading, isError, error, refetch } = useApiQuery<VpnNodeCardType[]>(
    ["servers", "vpn-nodes"],
    "/servers/vpn-nodes",
    { retry: 1, staleTime: 30_000 }
  );

  const regions = useMemo(() => {
    if (!cards?.length) return [];
    const set = new Set<string>();
    cards.forEach((c) => {
      if (c.identity.region) set.add(c.identity.region);
    });
    return Array.from(set).sort();
  }, [cards]);

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  if (isLoading) {
    return (
      <PageLayout title="VPN Nodes" pageClass="vpn-nodes-page" dataTestId="vpn-nodes-page" hideHeader>
        <Skeleton height={32} width="30%" />
        <Skeleton height={200} />
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout title="VPN Nodes" pageClass="vpn-nodes-page" dataTestId="vpn-nodes-page" hideHeader>
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load VPN nodes"}
          onRetry={() => refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="VPN Nodes"
      pageClass="vpn-nodes-page"
      dataTestId="vpn-nodes-page"
      description={cards?.length != null ? `${cards.length} nodes` : undefined}
      actions={
        <Button type="button" variant="default" onClick={() => void refetch()}>
          Refresh
        </Button>
      }
    >
      <VpnNodeGrid
        cards={cards ?? []}
        regions={regions}
        onSelectNode={handleSelectNode}
      />
      <VpnNodeDrilldown
        nodeId={selectedNodeId}
        open={selectedNodeId != null}
        onClose={handleCloseDrawer}
      />
    </PageLayout>
  );
}
