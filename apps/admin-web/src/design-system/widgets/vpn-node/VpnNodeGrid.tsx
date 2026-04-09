import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Input, EmptyState, Skeleton } from "@/design-system/primitives";
import { SectionHeader } from "@/design-system/primitives";
import { MetaText } from "@/design-system/typography";
import type { VpnNodeCard as VpnNodeCardType } from "@/features/vpn-nodes/types";
import { VpnNodeCard } from "./VpnNodeCard";

const VIRTUAL_THRESHOLD = 30;
const VIRTUAL_ROW_HEIGHT = 160;
const VIRTUAL_COLUMNS = 4;

type SortKey = "health" | "rtt" | "loss" | "saturation" | "throughput";

interface VpnNodeGridProps {
  cards: VpnNodeCardType[];
  isLoading?: boolean;
  onSelectNode?: (nodeId: string) => void;
  regions?: string[];
  /** When false, parent provides the section header (e.g. Servers page). Default true. */
  showSectionHeader?: boolean;
}

export function VpnNodeGrid({
  cards,
  isLoading,
  onSelectNode,
  regions = [],
  showSectionHeader = true,
}: VpnNodeGridProps) {
  const [sort, setSort] = useState<SortKey>("health");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterHealth, setFilterHealth] = useState<string>("");
  const [search, setSearch] = useState("");

  const filteredAndSorted = useMemo(() => {
    let list = [...cards];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.identity.name ?? "").toLowerCase().includes(q) ||
          (c.identity.node_id ?? "").toLowerCase().includes(q) ||
          (c.identity.region ?? "").toLowerCase().includes(q)
      );
    }
    if (filterRegion) {
      list = list.filter((c) => (c.identity.region ?? "") === filterRegion);
    }
    if (filterHealth) {
      list = list.filter((c) => c.identity.health_state === filterHealth);
    }
    switch (sort) {
      case "health": {
        const order = { down: 0, degraded: 1, ok: 2 };
        list.sort((a, b) => (order[a.identity.health_state] ?? 3) - (order[b.identity.health_state] ?? 3));
        break;
      }
      case "rtt":
        list.sort((a, b) => (b.kpis.rtt_p95_ms ?? -1) - (a.kpis.rtt_p95_ms ?? -1));
        break;
      case "loss":
        list.sort((a, b) => (b.kpis.loss_p95_pct ?? -1) - (a.kpis.loss_p95_pct ?? -1));
        break;
      case "saturation":
        list.sort((a, b) => (b.kpis.peers_fullness_pct ?? -1) - (a.kpis.peers_fullness_pct ?? -1));
        break;
      case "throughput": {
        const rx = (c: VpnNodeCardType) => (c.kpis.rx_1h ?? 0) + (c.kpis.tx_1h ?? 0);
        list.sort((a, b) => rx(b) - rx(a));
        break;
      }
      default:
        break;
    }
    return list;
  }, [cards, search, filterRegion, filterHealth, sort]);

  const useVirtual = filteredAndSorted.length > VIRTUAL_THRESHOLD;
  const rowCount = useVirtual
    ? Math.ceil(filteredAndSorted.length / VIRTUAL_COLUMNS)
    : 0;
  const gridParentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => gridParentRef.current,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,
    overscan: 2,
  });

  if (isLoading) {
    return (
      <section aria-label="VPN nodes">
        {showSectionHeader && <SectionHeader label="VPN Nodes" />}
        <div className="vpn-node-grid">
          <Skeleton height={120} />
          <Skeleton height={120} />
          <Skeleton height={120} />
        </div>
      </section>
    );
  }

  return (
    <section className="vpn-nodes-page__section" aria-label="VPN nodes">
      {showSectionHeader && <SectionHeader label="VPN Nodes" note="Operator grid" />}
      <div className="vpn-node-grid__toolbar">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name or ID"
        />
        <select
          className="input"
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          aria-label="Filter by region"
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filterHealth}
          onChange={(e) => setFilterHealth(e.target.value)}
          aria-label="Filter by health"
        >
          <option value="">All health</option>
          <option value="ok">OK</option>
          <option value="degraded">Degraded</option>
          <option value="down">Down</option>
        </select>
        <select
          className="input"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort by"
        >
          <option value="health">Worst health first</option>
          <option value="rtt">Highest RTT p95</option>
          <option value="loss">Highest loss</option>
          <option value="saturation">Highest peer saturation</option>
          <option value="throughput">Highest throughput</option>
        </select>
        <MetaText>
          Showing {filteredAndSorted.length} of {cards.length} nodes
        </MetaText>
      </div>
      {filteredAndSorted.length === 0 ? (
        <div className="vpn-node-grid">
          <EmptyState message="No VPN nodes match the filters." />
        </div>
      ) : useVirtual ? (
        <div
          ref={gridParentRef}
          className="vpn-node-grid vpn-node-grid--virtualized"
          style={{ maxHeight: "70vh", overflow: "auto" }}
        >
          <div
            className="vpn-node-grid__virtual-track"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const start = virtualRow.index * VIRTUAL_COLUMNS;
              const rowCards = filteredAndSorted.slice(start, start + VIRTUAL_COLUMNS);
              return (
                <div
                  key={virtualRow.key}
                  className="vpn-node-grid__virtual-row"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {rowCards.map((card) => (
                    <VpnNodeCard
                      key={card.identity.node_id}
                      data={card}
                      onClick={onSelectNode ? () => onSelectNode(card.identity.node_id) : undefined}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="vpn-node-grid">
          {filteredAndSorted.map((card) => (
            <VpnNodeCard
              key={card.identity.node_id}
              data={card}
              onClick={onSelectNode ? () => onSelectNode(card.identity.node_id) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
