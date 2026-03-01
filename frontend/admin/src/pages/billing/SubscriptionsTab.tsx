import { useState } from "react";
import { formatDate, getErrorMessage, subscriptionStatusToVariant } from "@vpn-suite/shared";
import { CopyableId } from "@/design-system";
import { Table, PrimitiveBadge, Input, Button, PageError } from "@/design-system";
import type { SubscriptionOut, SubscriptionList } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { useQuery } from "@tanstack/react-query";
import { SUBSCRIPTIONS_KEY } from "../../api/query-keys";
import { api } from "../../api/client";
import { TableSection } from "@/components";
import { Toolbar } from "@/components";

const LIMIT = 20;

export function SubscriptionsTab() {
  const [offset, setOffset] = useState(0);
  const [userId, setUserId] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data, error, refetch } = useQuery<SubscriptionList>({
    queryKey: [...SUBSCRIPTIONS_KEY, offset, searchTrigger],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (userId) params.set("user_id", userId);
      return api.get<SubscriptionList>(`/subscriptions?${params.toString()}`);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setSearchTrigger((n) => n + 1);
  };

  if (error) {
    return (
      <PageError
        message={getErrorMessage(error, "Failed to load subscriptions")}
        requestId={error instanceof ApiError ? error.requestId : undefined}
        statusCode={error instanceof ApiError ? error.statusCode : undefined}
        endpoint="GET /subscriptions"
        onRetry={() => refetch()}
      />
    );
  }

  const columns = [
    {
      key: "id",
      header: "ID",
      truncate: true,
      mono: true,
      titleTooltip: (r: SubscriptionOut) => r.id,
      render: (r: SubscriptionOut) => <CopyableId value={r.id} className="mono" />,
    },
    {
      key: "user_id",
      header: "User ID",
      truncate: true,
      mono: true,
      titleTooltip: (r: SubscriptionOut) => String(r.user_id),
      render: (r: SubscriptionOut) => r.user_id,
    },
    { key: "plan_id", header: "Plan", truncate: true, render: (r: SubscriptionOut) => r.plan_id },
    {
      key: "status",
      header: "Status",
      render: (r: SubscriptionOut) => (
        <PrimitiveBadge variant={subscriptionStatusToVariant(r.effective_status ?? r.status)}>
          {r.effective_status ?? r.status}
        </PrimitiveBadge>
      ),
    },
    { key: "valid_until", header: "Valid until", numeric: true, render: (r: SubscriptionOut) => formatDate(r.valid_until) },
    {
      key: "device_limit",
      header: "Devices",
      numeric: true,
      align: "right" as const,
      render: (r: SubscriptionOut) => r.device_limit,
    },
  ];

  return (
    <TableSection
      pagination={data && data.total > LIMIT ? { offset, limit: LIMIT, total: data.total, onPage: setOffset } : undefined}
    >
      <form onSubmit={handleSearch}>
        <Toolbar className="ref-toolbar-spaced">
          <Input
            placeholder="User ID"
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            aria-label="User ID"
          />
          <Button type="submit">Search</Button>
        </Toolbar>
      </form>
      <Table
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(r) => r.id}
        emptyMessage="No subscriptions found"
      />
    </TableSection>
  );
}
