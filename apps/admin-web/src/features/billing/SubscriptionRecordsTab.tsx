import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApi } from "@/core/api/context";
import { billingKeys } from "@/features/billing/services/billing.query-keys";
import {
  ActionMenu,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  SectionHeader,
  Skeleton,
  useToast,
} from "@/design-system/primitives";
import { MetaText } from "@/design-system/typography";
import type { SubscriptionList, SubscriptionOut } from "@/shared/types/admin-api";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : "—";
}

function subscriptionAttentionVariant(sub: SubscriptionOut): "danger" | "warning" | "info" | "success" {
  const status = sub.effective_status ?? sub.status;
  if (status === "blocked" || sub.access_status === "blocked") return "danger";
  if (status === "expired" || status === "cancelled" || status === "paused") return "warning";
  if (sub.access_status === "grace" || sub.grace_until) return "info";
  return "success";
}

function subscriptionAttentionLabel(sub: SubscriptionOut): string {
  const status = sub.effective_status ?? sub.status;
  if (status === "blocked" || sub.access_status === "blocked") return "Needs attention";
  if (status === "expired" || status === "cancelled") return "Expired";
  if (status === "paused" || sub.access_status === "paused") return "Paused";
  if (sub.access_status === "grace" || sub.grace_until) return "Grace";
  return "Healthy";
}

export function SubscriptionRecordsTab() {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [filters, setFilters] = useState({
    user_id: "",
    plan_id: "",
    status: "",
    access_status: "",
  });
  const [graceModalSub, setGraceModalSub] = useState<SubscriptionOut | null>(null);
  const [graceUntil, setGraceUntil] = useState("");
  const [graceReason, setGraceReason] = useState("");
  const [graceSaving, setGraceSaving] = useState(false);
  const [graceError, setGraceError] = useState<string | null>(null);
  const [stateActionPendingId, setStateActionPendingId] = useState<string | null>(null);

  const path = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", "50");
    p.set("offset", "0");
    if (filters.user_id.trim()) p.set("user_id", filters.user_id.trim());
    if (filters.plan_id.trim()) p.set("plan_id", filters.plan_id.trim());
    return `/subscriptions?${p.toString()}`;
  }, [filters.plan_id, filters.user_id]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useApiQuery<SubscriptionList>([...billingKeys.subscriptions(filters)], path, { retry: 1 });

  const setGrace = async (subId: string, until: string, reason: string) => {
    setGraceSaving(true);
    setGraceError(null);
    try {
      await api.patch(`/subscriptions/${subId}`, {
        access_status: "grace",
        grace_until: until ? new Date(until).toISOString() : null,
        grace_reason: reason.trim() || null,
      });
      setGraceModalSub(null);
      setGraceUntil("");
      setGraceReason("");
      await queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions(filters) });
      void refetch();
    } catch (e) {
      setGraceError(e instanceof Error ? e.message : "Failed to set grace");
    } finally {
      setGraceSaving(false);
    }
  };

  const clearGrace = async (subId: string) => {
    try {
      await api.patch(`/subscriptions/${subId}`, {
        access_status: "enabled",
        grace_until: null,
        grace_reason: null,
      });
      await queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions(filters) });
      void refetch();
      toast.showToast({ variant: "success", title: "Grace cleared" });
    } catch (e) {
      toast.showToast({
        variant: "danger",
        title: "Clear grace failed",
        description: e instanceof Error ? e.message : "Failed to clear grace",
      });
    }
  };

  const patchSubscriptionState = useCallback(
    async (subId: string, payload: Record<string, unknown>, successTitle: string) => {
      setStateActionPendingId(subId);
      try {
        await api.patch(`/subscriptions/${subId}`, payload);
        await queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions(filters) });
        void refetch();
        toast.showToast({ variant: "success", title: successTitle });
      } catch (e) {
        toast.showToast({
          variant: "danger",
          title: "Subscription update failed",
          description: e instanceof Error ? e.message : "Failed to update subscription state",
        });
      } finally {
        setStateActionPendingId(null);
      }
    },
    [api, filters, queryClient, refetch, toast]
  );

  const openGraceModal = (s: SubscriptionOut) => {
    setGraceModalSub(s);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setGraceUntil(d.toISOString().slice(0, 16));
    setGraceReason("");
    setGraceError(null);
  };

  const resetFilters = () => {
    setFilters({ user_id: "", plan_id: "", status: "", access_status: "" });
  };

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((sub) => {
      if (filters.status && (sub.effective_status ?? sub.status) !== filters.status) return false;
      if (filters.access_status && (sub.access_status ?? "enabled") !== filters.access_status) return false;
      return true;
    });
  }, [data?.items, filters.access_status, filters.status]);

  return (
    <>
      <Card className="billing-page__section-card">
        <SectionHeader label="Subscription records" note="User subscriptions (active, expired, cancelled)." />
        <div className="billing-page__filters">
          <label className="input-label">
            User ID
            <Input
              type="number"
              value={filters.user_id}
              onChange={(e) => setFilters((f) => ({ ...f, user_id: e.target.value }))}
              placeholder="Filter by user_id"
            />
          </label>
          <label className="input-label">
            Plan ID
            <Input
              value={filters.plan_id}
              onChange={(e) => setFilters((f) => ({ ...f, plan_id: e.target.value }))}
              placeholder="Filter by plan_id"
            />
          </label>
          <label className="input-label">
            Status
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="active">active</option>
              <option value="grace">grace</option>
              <option value="paused">paused</option>
              <option value="expired">expired</option>
              <option value="blocked">blocked</option>
              <option value="cancelled">cancelled</option>
              <option value="pending">pending</option>
              <option value="cancel_at_period_end">cancel_at_period_end</option>
            </select>
          </label>
          <label className="input-label">
            Access
            <select
              className="input"
              value={filters.access_status}
              onChange={(e) => setFilters((f) => ({ ...f, access_status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="enabled">enabled</option>
              <option value="paused">paused</option>
              <option value="grace">grace</option>
              <option value="blocked">blocked</option>
            </select>
          </label>
          <div className="billing-page__filter-actions">
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Load subscriptions
            </Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        </div>
        {isLoading && <Skeleton height={120} />}
        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : "Failed to load subscriptions."}
            onRetry={() => refetch()}
          />
        )}
        {!isLoading && !isError && data && (
          filteredItems.length > 0 ? (
            <>
              <MetaText className="billing-page__table-meta">
                {filteredItems.length} shown · {data.total} total subscriptions
              </MetaText>
              <div className="data-table-wrap">
                <DataTable
                  density="compact"
                  columns={[
                    { key: "id", header: "Subscription" },
                    { key: "user_id", header: "User" },
                    { key: "plan_id", header: "Plan" },
                    { key: "valid_until", header: "Valid until" },
                    { key: "status", header: "Status" },
                    { key: "access_status", header: "Access" },
                    { key: "billing_status", header: "Billing" },
                    { key: "renewal_status", header: "Renewal" },
                    { key: "grace_until", header: "Grace until" },
                    { key: "actions", header: "Actions" },
                  ]}
                  rows={filteredItems.map((s) => ({
                    id: (
                      <span className="billing-page__entity-cell">
                        <strong>{s.id}</strong>
                        <MetaText>Created {formatDateTime(s.created_at)}</MetaText>
                      </span>
                    ),
                    key: s.id,
                    user_id: s.user_id,
                    plan_id: s.plan_id,
                    valid_until: formatDateTime(s.valid_until),
                    status: (
                      <span className="billing-page__entity-cell">
                        <Badge
                          variant={
                            (s.effective_status ?? s.status) === "active"
                              ? "success"
                              : (s.effective_status ?? s.status) === "grace"
                                ? "info"
                                : (s.effective_status ?? s.status) === "paused"
                                  ? "warning"
                                  : "danger"
                          }
                          size="sm"
                        >
                          {s.effective_status ?? s.status}
                        </Badge>
                        <Badge variant={subscriptionAttentionVariant(s)} size="sm">
                          {subscriptionAttentionLabel(s)}
                        </Badge>
                      </span>
                    ),
                    access_status: (
                      <Badge
                        variant={
                          (s.access_status ?? "enabled") === "enabled"
                            ? "success"
                            : (s.access_status ?? "enabled") === "grace"
                              ? "info"
                              : (s.access_status ?? "enabled") === "paused"
                                ? "warning"
                                : "danger"
                        }
                        size="sm"
                      >
                        {s.access_status ?? "—"}
                      </Badge>
                    ),
                    billing_status: s.billing_status ?? "—",
                    renewal_status: s.renewal_status ?? "—",
                    grace_until: s.grace_until ? (
                      <span className="billing-page__entity-cell">
                        <strong>{formatDateTime(s.grace_until)}</strong>
                        <MetaText>{s.grace_reason ?? "No reason"}</MetaText>
                      </span>
                    ) : "—",
                    actions: (
                      <ActionMenu
                        label={`Actions for subscription ${s.id}`}
                        items={[
                          { id: "grace", label: "Set grace", onSelect: () => openGraceModal(s) },
                          {
                            id: "clear-grace",
                            label: "Clear grace",
                            disabled: !(s.access_status === "grace" || s.grace_until),
                            onSelect: () => void clearGrace(s.id),
                          },
                          {
                            id: "pause",
                            label: "Pause",
                            disabled:
                              stateActionPendingId === s.id ||
                              (s.subscription_status ?? "active") !== "active" ||
                              (s.access_status ?? "enabled") === "paused",
                            onSelect: () =>
                              void patchSubscriptionState(
                                s.id,
                                { status: "active", access_status: "paused" },
                                "Subscription paused"
                              ),
                          },
                          {
                            id: "enable",
                            label: "Enable",
                            disabled:
                              stateActionPendingId === s.id ||
                              (s.access_status ?? "enabled") === "enabled",
                            onSelect: () =>
                              void patchSubscriptionState(
                                s.id,
                                { status: "active", access_status: "enabled" },
                                "Access enabled"
                              ),
                          },
                          {
                            id: "block",
                            label: "Block",
                            danger: true,
                            disabled:
                              stateActionPendingId === s.id ||
                              (s.access_status ?? "enabled") === "blocked",
                            onSelect: () =>
                              void patchSubscriptionState(
                                s.id,
                                { status: "active", access_status: "blocked" },
                                "Access blocked"
                              ),
                          },
                        ]}
                      />
                    ),
                  }))}
                  getRowKey={(row) => String(row.key)}
                />
              </div>
              {graceModalSub && (
                <Modal
                  title="Set grace period"
                  open={!!graceModalSub}
                  onClose={() => !graceSaving && setGraceModalSub(null)}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (graceModalSub) setGrace(graceModalSub.id, graceUntil, graceReason);
                    }}
                  >
                    <label className="input-label">
                      Grace until (local)
                      <Input
                        type="datetime-local"
                        value={graceUntil}
                        onChange={(e) => setGraceUntil(e.target.value)}
                      />
                    </label>
                    <label className="input-label">
                      Reason (optional)
                      <Input
                        value={graceReason}
                        onChange={(e) => setGraceReason(e.target.value)}
                        placeholder="e.g. support extension"
                      />
                    </label>
                    {graceError && <MetaText className="text-error">{graceError}</MetaText>}
                    <div className="billing-page__modal-actions">
                      <Button type="submit" disabled={graceSaving || !graceUntil}>
                        {graceSaving ? "Saving…" : "Set grace"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setGraceModalSub(null)}
                        disabled={graceSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Modal>
              )}
            </>
          ) : (
            <EmptyState message="No subscriptions match the filters." />
          )
        )}
      </Card>
    </>
  );
}
