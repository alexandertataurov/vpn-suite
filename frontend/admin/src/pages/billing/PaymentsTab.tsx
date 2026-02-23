import { useState } from "react";
import { formatDateTime, getErrorMessage, paymentStatusToVariant } from "@vpn-suite/shared";
import { Table, PrimitiveBadge, Input, Button, PageError } from "@vpn-suite/shared/ui";
import type { PaymentOut, PaymentList } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { useQuery } from "@tanstack/react-query";
import { PAYMENTS_KEY } from "../../api/query-keys";
import { api } from "../../api/client";
import { TableSection } from "../../components/TableSection";
import { Toolbar } from "../../components/Toolbar";

const LIMIT = 20;

export function PaymentsTab() {
  const [offset, setOffset] = useState(0);
  const [userId, setUserId] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data, error, refetch } = useQuery<PaymentList>({
    queryKey: [...PAYMENTS_KEY, offset, searchTrigger],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (userId) params.set("user_id", userId);
      return api.get<PaymentList>(`/payments?${params.toString()}`);
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
        message={getErrorMessage(error, "Failed to load payments")}
        requestId={error instanceof ApiError ? error.requestId : undefined}
        statusCode={error instanceof ApiError ? error.statusCode : undefined}
        endpoint="GET /payments"
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
      titleTooltip: (r: PaymentOut) => r.id,
      render: (r: PaymentOut) => r.id.slice(0, 8),
    },
    {
      key: "user_id",
      header: "User ID",
      truncate: true,
      mono: true,
      titleTooltip: (r: PaymentOut) => String(r.user_id),
      render: (r: PaymentOut) => r.user_id,
    },
    {
      key: "status",
      header: "Status",
      render: (r: PaymentOut) => (
        <PrimitiveBadge variant={paymentStatusToVariant(r.status)}>{r.status}</PrimitiveBadge>
      ),
    },
    { key: "provider", header: "Provider", render: (r: PaymentOut) => r.provider },
    {
      key: "amount",
      header: "Amount",
      numeric: true,
      align: "right" as const,
      render: (r: PaymentOut) => `${r.amount} ${r.currency}`,
    },
    { key: "created_at", header: "Created", numeric: true, render: (r: PaymentOut) => formatDateTime(r.created_at) },
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
        emptyMessage="No payments found"
      />
    </TableSection>
  );
}
