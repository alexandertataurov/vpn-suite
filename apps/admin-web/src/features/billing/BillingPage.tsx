import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApi } from "@/core/api/context";
import { SubscriptionRecordsTab } from "@/features/billing/SubscriptionRecordsTab";
import { billingKeys } from "@/features/billing/services/billing.query-keys";
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  SectionHeader,
  Skeleton,
} from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { MetaText } from "@/design-system/typography";
import { getErrorMessage } from "@vpn-suite/shared";
import type {
  ChurnSurveyOut,
  EntitlementEventOut,
  PaymentList,
  PlanList,
  PlanOut,
} from "@/shared/types/admin-api";

const TABS = [
  { id: "plans", label: "Plans" },
  { id: "subscription-records", label: "Subscription records" },
  { id: "payments", label: "Payments" },
  { id: "entitlement-events", label: "Entitlement events" },
  { id: "cancellation-reasons", label: "Cancellation reasons" },
] as const;

const UPSELL_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "device_limit", label: "Device limit" },
  { value: "expiry", label: "Expiry" },
  { value: "trial_end", label: "Trial end" },
  { value: "referral", label: "Referral" },
];

type PlanStyle = "normal" | "popular" | "promotional";

interface PlanRow extends Record<string, unknown> {
  id: string;
  name: string;
  duration: string;
  deviceLimit: string;
  price: string;
  style: string;
  subscriptions: string;
  archived: string;
  upsellMethods: string;
  createdAt: string;
  order: JSX.Element;
  actions: JSX.Element;
}

interface PlanFormState {
  name: string;
  durationDays: string;
  deviceLimit: string;
  priceCurrency: string;
  priceAmount: string;
  style: PlanStyle;
  upsellMethods: string[];
}

function parsePlanName(rawName: string | null | undefined): { style: PlanStyle; cleanName: string } {
  const name = (rawName ?? "").trim();
  const lowered = name.toLowerCase();
  if (lowered.startsWith("[promo]")) {
    return { style: "promotional", cleanName: name.slice("[promo]".length).trimStart() || name };
  }
  if (lowered.startsWith("[popular]")) {
    return { style: "popular", cleanName: name.slice("[popular]".length).trimStart() || name };
  }
  if (lowered.startsWith("[normal]")) {
    return { style: "normal", cleanName: name.slice("[normal]".length).trimStart() || name };
  }
  return { style: "normal", cleanName: name };
}

function applyPlanStyle(cleanName: string, style: PlanStyle): string {
  const base = cleanName.trim();
  const prefix =
    style === "promotional" ? "[promo] " : style === "popular" ? "[popular] " : "[normal] ";
  return `${prefix}${base}`;
}

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const active = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : TABS[0].id;
  const panelId = `billing-tabpanel-${active}`;

  const setActive = (id: string) => setSearchParams({ tab: id });

  const api = useApi();
  const queryClient = useQueryClient();

  const [includeArchived, setIncludeArchived] = useState(true);
  const plansPath = useMemo(
    () =>
      `/plans?limit=50&offset=0&include_archived=${includeArchived}`,
    [includeArchived]
  );
  const {
    data: plans,
    isLoading: isPlansLoading,
    isError: isPlansError,
    error: plansError,
    refetch: refetchPlans,
  } = useApiQuery<PlanList>([...billingKeys.plans(), includeArchived], plansPath, { retry: 1 });

  const [editingPlan, setEditingPlan] = useState<PlanOut | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<PlanFormState>({
    name: "",
    durationDays: "",
    deviceLimit: "",
    priceCurrency: "XTR",
    priceAmount: "",
    style: "normal",
    upsellMethods: [],
  });
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PlanOut | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePending, setDeletePending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const [paymentFilters, setPaymentFilters] = useState<{
    user_id: string;
    status: string;
    provider: string;
  }>({ user_id: "", status: "", provider: "" });

  const [entitlementFilters, setEntitlementFilters] = useState<{
    user_id: string;
    subscription_id: string;
    event_type: string;
  }>({ user_id: "", subscription_id: "", event_type: "" });

  const [churnSurveysFilters, setChurnSurveysFilters] = useState<{
    user_id: string;
    subscription_id: string;
  }>({ user_id: "", subscription_id: "" });

  const paymentsPath = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", "50");
    p.set("offset", "0");
    if (paymentFilters.user_id.trim()) p.set("user_id", paymentFilters.user_id.trim());
    if (paymentFilters.status.trim()) p.set("status", paymentFilters.status.trim());
    if (paymentFilters.provider.trim()) p.set("provider", paymentFilters.provider.trim());
    return `/payments?${p.toString()}`;
  }, [paymentFilters]);

  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    error: paymentsError,
    refetch: refetchPayments,
  } = useApiQuery<PaymentList>(
    [...billingKeys.payments(paymentFilters)],
    paymentsPath,
    { retry: 1, enabled: active === "payments" }
  );

  const entitlementEventsPath = useMemo(() => {
    const p = new URLSearchParams();
    if (entitlementFilters.user_id.trim()) p.set("user_id", entitlementFilters.user_id.trim());
    if (entitlementFilters.subscription_id.trim()) p.set("subscription_id", entitlementFilters.subscription_id.trim());
    if (entitlementFilters.event_type.trim()) p.set("event_type", entitlementFilters.event_type.trim());
    p.set("limit", "100");
    return `/admin/entitlement-events?${p.toString()}`;
  }, [entitlementFilters]);

  const churnSurveysPath = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", "100");
    p.set("offset", "0");
    if (churnSurveysFilters.user_id.trim()) p.set("user_id", churnSurveysFilters.user_id.trim());
    if (churnSurveysFilters.subscription_id.trim()) p.set("subscription_id", churnSurveysFilters.subscription_id.trim());
    return `/admin/churn-surveys?${p.toString()}`;
  }, [churnSurveysFilters]);

  const {
    data: entitlementEvents,
    isLoading: isEntitlementEventsLoading,
    isError: isEntitlementEventsError,
    error: entitlementEventsError,
    refetch: refetchEntitlementEvents,
  } = useApiQuery<EntitlementEventOut[]>(
    [...billingKeys.entitlementEvents(entitlementFilters)],
    entitlementEventsPath,
    { retry: 1, enabled: active === "entitlement-events" }
  );

  const {
    data: churnSurveys,
    isLoading: isChurnSurveysLoading,
    isError: isChurnSurveysError,
    error: churnSurveysError,
    refetch: refetchChurnSurveys,
  } = useApiQuery<ChurnSurveyOut[]>(
    [...billingKeys.churnSurveys(churnSurveysFilters)],
    churnSurveysPath,
    { retry: 1, enabled: active === "cancellation-reasons" }
  );

  const runPlanAction = useCallback(async (fn: () => Promise<unknown>) => {
    setActionError(null);
    setActionPending(true);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: [...billingKeys.plans()] });
    } catch (e) {
      setActionError(getErrorMessage(e, "Action failed"));
    } finally {
      setActionPending(false);
    }
  }, [queryClient]);

  const handleClone = useCallback(
    (p: PlanOut) => runPlanAction(() => api.post<PlanOut>(`/plans/${p.id}/clone`, {})),
    [api, runPlanAction],
  );

  const handleArchive = useCallback(
    (p: PlanOut) => runPlanAction(() => api.patch<PlanOut>(`/plans/${p.id}`, { is_archived: true })),
    [api, runPlanAction],
  );

  const handleRestore = useCallback(
    (p: PlanOut) => runPlanAction(() => api.patch<PlanOut>(`/plans/${p.id}`, { is_archived: false })),
    [api, runPlanAction],
  );

  const handleMoveUp = useCallback(
    (p: PlanOut) => {
      if (!plans?.items?.length) return;
      const reordered = [...plans.items].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
      );
      const planIdx = reordered.findIndex((x) => x.id === p.id);
      if (planIdx <= 0) return;
      const previousPlan = reordered[planIdx - 1];
      const currentPlan = reordered[planIdx];
      if (!previousPlan || !currentPlan) return;
      reordered[planIdx - 1] = currentPlan;
      reordered[planIdx] = previousPlan;
      void runPlanAction(() =>
        api.patch<PlanList>("/plans/reorder", { plan_ids: reordered.map((x) => x.id) }),
      );
    },
    [api, plans, runPlanAction],
  );

  const handleMoveDown = useCallback(
    (p: PlanOut) => {
      if (!plans?.items?.length) return;
      const reordered = [...plans.items].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
      );
      const planIdx = reordered.findIndex((x) => x.id === p.id);
      if (planIdx < 0 || planIdx >= reordered.length - 1) return;
      const currentPlan = reordered[planIdx];
      const nextPlan = reordered[planIdx + 1];
      if (!currentPlan || !nextPlan) return;
      reordered[planIdx] = nextPlan;
      reordered[planIdx + 1] = currentPlan;
      void runPlanAction(() =>
        api.patch<PlanList>("/plans/reorder", { plan_ids: reordered.map((x) => x.id) }),
      );
    },
    [api, plans, runPlanAction],
  );

  const planRows: PlanRow[] = useMemo(() => {
    if (!plans?.items?.length) return [];
    const sorted = [...plans.items].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    return sorted.map((p, idx) => {
      const { style, cleanName } = parsePlanName(p.name);
      const styleLabel =
        style === "promotional" ? "Promotional" : style === "popular" ? "Popular" : "Normal";
      const upsellList = (p.upsell_methods ?? []).join(", ") || "—";
      const subCount = p.subscription_count ?? 0;
      const canDelete = subCount === 0;
      return {
        id: p.id,
        name: cleanName || p.id,
        duration: `${p.duration_days} days`,
        deviceLimit: `${p.device_limit ?? 1}`,
        price: `${p.price_amount} ${p.price_currency}`,
        style: styleLabel,
        subscriptions: subCount > 0 ? `${subCount}` : "0 (can delete)",
        archived: p.is_archived ? "Archived" : "—",
        upsellMethods: upsellList,
        createdAt: new Date(p.created_at).toLocaleDateString(),
        order: (
          <span className="billing-page__plan-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Move up"
              disabled={idx === 0 || actionPending}
              onClick={() => handleMoveUp(p)}
            >
              ↑
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Move down"
              disabled={idx === sorted.length - 1 || actionPending}
              onClick={() => handleMoveDown(p)}
            >
              ↓
            </Button>
          </span>
        ),
        actions: (
          <span className="billing-page__plan-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingPlan(p);
                setForm({
                  name: cleanName,
                  durationDays: String(p.duration_days),
                  deviceLimit: String(p.device_limit ?? 1),
                  priceCurrency: p.price_currency,
                  priceAmount: String(p.price_amount),
                  style,
                  upsellMethods: p.upsell_methods ?? [],
                });
                setSaveError(null);
                setIsModalOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleClone(p)}
              disabled={actionPending}
            >
              Clone
            </Button>
            {p.is_archived ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRestore(p)}
                disabled={actionPending}
              >
                Restore
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleArchive(p)}
                disabled={actionPending}
              >
                Archive
              </Button>
            )}
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={!canDelete || actionPending}
              title={!canDelete ? `${subCount} subscription(s) — cannot delete` : undefined}
              onClick={() => {
                setPlanToDelete(p);
                setDeleteConfirmText("");
                setSaveError(null);
              }}
            >
              Delete
            </Button>
          </span>
        ),
      };
    });
  }, [
    plans,
    actionPending,
    handleMoveUp,
    handleMoveDown,
    handleClone,
    handleArchive,
    handleRestore,
  ]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({
      name: "",
      durationDays: "",
      deviceLimit: "",
      priceCurrency: "XTR",
      priceAmount: "",
      style: "normal",
      upsellMethods: [],
    });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (savePending) return;
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleFormChange = (patch: Partial<PlanFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const canSubmit =
    form.name.trim().length > 0 &&
    form.durationDays.trim().length > 0 &&
    form.deviceLimit.trim().length > 0 &&
    form.priceCurrency.trim().length > 0 &&
    form.priceAmount.trim().length > 0;

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    const confirmName = parsePlanName(planToDelete.name).cleanName;
    if (deleteConfirmText.trim().toLowerCase() !== confirmName.toLowerCase()) return;
    setDeletePending(true);
    setSaveError(null);
    try {
      await api.request(`/plans/${planToDelete.id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: [...billingKeys.plans()] });
      setPlanToDelete(null);
      setDeleteConfirmText("");
    } catch (e) {
      setSaveError(getErrorMessage(e, "Failed to delete plan"));
    } finally {
      setDeletePending(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || savePending) return;
    setSavePending(true);
    setSaveError(null);
    try {
      const styledName = applyPlanStyle(form.name, form.style);
      const body = {
        name: styledName,
        duration_days: Number.parseInt(form.durationDays, 10),
        device_limit: Number.parseInt(form.deviceLimit, 10),
        price_currency: form.priceCurrency.trim(),
        price_amount: form.priceAmount.trim(),
        upsell_methods: form.upsellMethods.length > 0 ? form.upsellMethods : null,
      };
      if (editingPlan) {
        await api.patch<PlanOut>(`/plans/${editingPlan.id}`, body);
      } else {
        await api.post<PlanOut>("/plans", body);
      }
      await queryClient.invalidateQueries({ queryKey: [...billingKeys.plans()] });
      setIsModalOpen(false);
      setEditingPlan(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save plan");
    } finally {
      setSavePending(false);
    }
  };

  return (
    <PageLayout title="Billing" pageClass="billing-page" dataTestId="billing-page">
      <div className="billing-page__tabs" role="tablist">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            role="tab"
            id={`billing-tab-${tab.id}`}
            aria-controls={`billing-tabpanel-${tab.id}`}
            aria-selected={active === tab.id}
            tabIndex={active === tab.id ? 0 : -1}
            variant="default"
            className={`billing-page__tab${active === tab.id ? " billing-page__tab--active" : ""}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="billing-page__panel" role="tabpanel" id={panelId} aria-labelledby={`billing-tab-${active}`}>
        {active === "plans" && (
          <>
            {isPlansLoading && <Skeleton height={120} />}
            {isPlansError && (
              <ErrorState
                message={plansError instanceof Error ? plansError.message : "Failed to load plans."}
                onRetry={() => refetchPlans()}
              />
            )}
            {!isPlansLoading && !isPlansError && (
              <Card>
                <SectionHeader
                  label="Miniapp subscription plans"
                  note={
                    <Button type="button" onClick={openCreateModal}>
                      Add plan
                    </Button>
                  }
                />
                <MetaText>Configure the subscription plans exposed in the Telegram miniapp.</MetaText>
                <label className="billing-page__filter-inline">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                  />
                  Include archived
                </label>
                {actionError && (
                  <p className="input-hint is-error" role="alert">
                    {actionError}
                  </p>
                )}
                {planRows.length > 0 ? (
                  <div className="data-table-wrap">
                    <DataTable<PlanRow>
                      density="compact"
                      columns={[
                        { key: "order", header: "Order" },
                        { key: "name", header: "Plan" },
                        { key: "duration", header: "Duration" },
                        { key: "deviceLimit", header: "Devices" },
                        { key: "price", header: "Price" },
                        { key: "subscriptions", header: "Subscriptions" },
                        { key: "archived", header: "Archived" },
                        { key: "style", header: "Style" },
                        { key: "upsellMethods", header: "Upsell triggers" },
                        { key: "createdAt", header: "Created" },
                        { key: "actions", header: "Actions" },
                      ]}
                      rows={planRows}
                      getRowKey={(row) => row.id}
                    />
                  </div>
                ) : (
                  <EmptyState message="No plans configured yet." />
                )}
              </Card>
            )}

            <Modal
              open={isModalOpen}
              onClose={closeModal}
              title={editingPlan ? "Edit plan" : "Add plan"}
            >
              <form onSubmit={handleSubmit} className="settings-page__form">
                <div className="input-wrap">
                  <label className="input-label">
                    Name
                    <Input
                      autoFocus
                      value={form.name}
                      onChange={(e) => handleFormChange({ name: e.target.value })}
                      placeholder="Pro monthly"
                    />
                  </label>
                </div>
                <div className="input-wrap">
                  <label className="input-label">
                    Duration (days)
                    <Input
                      type="number"
                      min={1}
                      value={form.durationDays}
                      onChange={(e) => handleFormChange({ durationDays: e.target.value })}
                      placeholder="30"
                    />
                  </label>
                </div>
                <div className="input-wrap">
                  <label className="input-label">
                    Device limit
                    <Input
                      type="number"
                      min={1}
                      value={form.deviceLimit}
                      onChange={(e) => handleFormChange({ deviceLimit: e.target.value })}
                      placeholder="5"
                    />
                  </label>
                </div>
                <div className="input-wrap">
                  <label className="input-label">
                    Price currency
                    <Input
                      value={form.priceCurrency}
                      onChange={(e) => handleFormChange({ priceCurrency: e.target.value })}
                      placeholder="XTR"
                    />
                  </label>
                </div>
                <div className="input-wrap">
                  <label className="input-label">
                    Price amount (Stars)
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={form.priceAmount}
                      onChange={(e) => handleFormChange({ priceAmount: e.target.value })}
                      placeholder="100"
                    />
                  </label>
                </div>
                <div className="input-wrap">
                  <label className="input-label">
                    Plan style
                    <div className="select-wrap full">
                      <select
                        className="input"
                        value={form.style}
                        onChange={(e) => handleFormChange({ style: e.target.value as PlanStyle })}
                      >
                        <option value="normal">Normal</option>
                        <option value="popular">Popular</option>
                        <option value="promotional">Promotional</option>
                      </select>
                    </div>
                  </label>
                </div>
                <div className="input-wrap">
                  <span className="input-label">Upsell triggers</span>
                  <div className="checkbox-group" role="group" aria-label="Upsell triggers">
                    {UPSELL_METHOD_OPTIONS.map((opt) => (
                      <label key={opt.value} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={form.upsellMethods.includes(opt.value)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...form.upsellMethods, opt.value]
                              : form.upsellMethods.filter((m) => m !== opt.value);
                            handleFormChange({ upsellMethods: next });
                          }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                {saveError && (
                  <p className="input-hint is-error" role="alert">
                    {saveError}
                  </p>
                )}
                <div className="users-page__modal-actions">
                  <Button
                    type="button"
                    variant="default"
                    onClick={closeModal}
                    disabled={savePending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!canSubmit || savePending}>
                    {editingPlan ? "Save" : "Create"}
                  </Button>
                </div>
              </form>
            </Modal>

            <Modal
              open={planToDelete != null}
              onClose={() => {
                if (!deletePending) {
                  setPlanToDelete(null);
                  setDeleteConfirmText("");
                  setSaveError(null);
                }
              }}
              title="Delete plan"
              variant="danger"
            >
              <p className="billing-page__muted type-meta">
                {planToDelete
                  ? `This permanently removes the plan "${parsePlanName(planToDelete.name).cleanName}". Type the plan name to confirm.`
                  : ""}
              </p>
              <label className="input-label">
                Confirm
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={planToDelete ? parsePlanName(planToDelete.name).cleanName : ""}
                  aria-label="Type plan name to confirm deletion"
                />
              </label>
              {saveError && (
                <p className="input-hint is-error" role="alert">
                  {saveError}
                </p>
              )}
              <div className="users-page__modal-actions">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    setPlanToDelete(null);
                    setDeleteConfirmText("");
                    setSaveError(null);
                  }}
                  disabled={deletePending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={
                    (planToDelete
                      ? deleteConfirmText.trim().toLowerCase() !==
                        parsePlanName(planToDelete.name).cleanName.toLowerCase()
                      : true) || deletePending
                  }
                  onClick={handleDeletePlan}
                >
                  Delete plan
                </Button>
              </div>
            </Modal>
          </>
        )}
        {active === "subscription-records" && <SubscriptionRecordsTab />}
        {active === "payments" && (
          <>
            <Card>
              <SectionHeader label="Payments" note="Payment history (Telegram Stars, etc.)." />
              <div className="billing-page__filters">
                <label className="input-label">
                  User ID
                  <Input
                    type="number"
                    value={paymentFilters.user_id}
                    onChange={(e) => setPaymentFilters((f) => ({ ...f, user_id: e.target.value }))}
                    placeholder="Filter by user_id"
                  />
                </label>
                <label className="input-label">
                  Status
                  <select
                    className="input"
                    value={paymentFilters.status}
                    onChange={(e) => setPaymentFilters((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="pending">pending</option>
                    <option value="completed">completed</option>
                    <option value="failed">failed</option>
                  </select>
                </label>
                <label className="input-label">
                  Provider
                  <Input
                    value={paymentFilters.provider}
                    onChange={(e) => setPaymentFilters((f) => ({ ...f, provider: e.target.value }))}
                    placeholder="e.g. telegram_stars"
                  />
                </label>
              </div>
              {isPaymentsLoading && <Skeleton height={120} />}
              {isPaymentsError && (
                <ErrorState
                  message={
                    paymentsError instanceof Error
                      ? paymentsError.message
                      : "Failed to load payments."
                  }
                  onRetry={() => refetchPayments()}
                />
              )}
              {!isPaymentsLoading && !isPaymentsError && paymentsData && (
                paymentsData.items.length > 0 ? (
                  <div className="data-table-wrap">
                    <DataTable<{
                      id: string;
                      user_id: number;
                      subscription_id: string;
                      provider: string;
                      status: string;
                      amount: number;
                      currency: string;
                      external_id: string;
                      created_at: string;
                    }>
                      density="compact"
                      columns={[
                        { key: "id", header: "ID" },
                        { key: "user_id", header: "User ID" },
                        { key: "subscription_id", header: "Subscription ID" },
                        { key: "provider", header: "Provider" },
                        { key: "status", header: "Status" },
                        { key: "amount", header: "Amount" },
                        { key: "currency", header: "Currency" },
                        { key: "external_id", header: "External ID" },
                        { key: "created_at", header: "Created" },
                      ]}
                      rows={paymentsData.items.map((p) => ({
                        id: p.id,
                        user_id: p.user_id,
                        subscription_id: p.subscription_id,
                        provider: p.provider,
                        status: p.status,
                        amount: p.amount,
                        currency: p.currency,
                        external_id: p.external_id,
                        created_at: p.created_at ? new Date(p.created_at).toLocaleString() : "—",
                      }))}
                      getRowKey={(row) => row.id}
                    />
                  </div>
                ) : (
                  <EmptyState message="No payments match the filters." />
                )
              )}
            </Card>
          </>
        )}
        {active === "entitlement-events" && (
          <>
            <Card>
              <SectionHeader label="Entitlement events" note="Subscription/access audit ledger." />
              <div className="billing-page__filters">
                <label className="input-label">
                  User ID
                  <Input
                    type="number"
                    value={entitlementFilters.user_id}
                    onChange={(e) => setEntitlementFilters((f) => ({ ...f, user_id: e.target.value }))}
                    placeholder="Filter by user_id"
                  />
                </label>
                <label className="input-label">
                  Subscription ID
                  <Input
                    value={entitlementFilters.subscription_id}
                    onChange={(e) => setEntitlementFilters((f) => ({ ...f, subscription_id: e.target.value }))}
                    placeholder="Filter by subscription_id"
                  />
                </label>
                <label className="input-label">
                  Event type
                  <select
                    className="input"
                    value={entitlementFilters.event_type}
                    onChange={(e) => setEntitlementFilters((f) => ({ ...f, event_type: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="subscription_activated">subscription_activated</option>
                    <option value="subscription_renewed">subscription_renewed</option>
                    <option value="subscription_extended">subscription_extended</option>
                    <option value="grace_started">grace_started</option>
                    <option value="grace_converted">grace_converted</option>
                    <option value="access_paused">access_paused</option>
                    <option value="access_resumed">access_resumed</option>
                    <option value="access_blocked">access_blocked</option>
                    <option value="referral_reward_accrued">referral_reward_accrued</option>
                    <option value="referral_reward_applied">referral_reward_applied</option>
                    <option value="promo_applied">promo_applied</option>
                  </select>
                </label>
              </div>
              {isEntitlementEventsLoading && <Skeleton height={120} />}
              {isEntitlementEventsError && (
                <ErrorState
                  message={entitlementEventsError instanceof Error ? entitlementEventsError.message : "Failed to load entitlement events."}
                  onRetry={() => refetchEntitlementEvents()}
                />
              )}
              {!isEntitlementEventsLoading && !isEntitlementEventsError && entitlementEvents && (
                entitlementEvents.length > 0 ? (
                  <div className="data-table-wrap">
                    <DataTable<{ id: string; created_at: string; event_type: string; user_id: number; subscription_id: string; payload: string }>
                      density="compact"
                      columns={[
                        { key: "created_at", header: "Created" },
                        { key: "event_type", header: "Event type" },
                        { key: "user_id", header: "User ID" },
                        { key: "subscription_id", header: "Subscription ID" },
                        { key: "payload", header: "Payload" },
                      ]}
                      rows={entitlementEvents.map((e) => ({
                        id: e.id,
                        created_at: e.created_at ? new Date(e.created_at).toLocaleString() : "",
                        event_type: e.event_type,
                        user_id: e.user_id,
                        subscription_id: e.subscription_id ?? "—",
                        payload: e.payload ? JSON.stringify(e.payload) : "—",
                      }))}
                      getRowKey={(row) => row.id}
                    />
                  </div>
                ) : (
                  <EmptyState message="No entitlement events match the filters." />
                )
              )}
            </Card>
          </>
        )}
        {active === "cancellation-reasons" && (
          <>
            <Card>
              <SectionHeader label="Cancellation reasons" note="Churn survey: reason and offer acceptance." />
              <div className="billing-page__filters">
                <label className="input-label">
                  User ID
                  <Input
                    type="number"
                    value={churnSurveysFilters.user_id}
                    onChange={(e) => setChurnSurveysFilters((f) => ({ ...f, user_id: e.target.value }))}
                    placeholder="Filter by user_id"
                  />
                </label>
                <label className="input-label">
                  Subscription ID
                  <Input
                    value={churnSurveysFilters.subscription_id}
                    onChange={(e) => setChurnSurveysFilters((f) => ({ ...f, subscription_id: e.target.value }))}
                    placeholder="Filter by subscription_id"
                  />
                </label>
              </div>
              {isChurnSurveysLoading && <Skeleton height={120} />}
              {isChurnSurveysError && (
                <ErrorState
                  message={
                    churnSurveysError instanceof Error
                      ? churnSurveysError.message
                      : "Failed to load cancellation reasons."
                  }
                  onRetry={() => refetchChurnSurveys()}
                />
              )}
              {!isChurnSurveysLoading && !isChurnSurveysError && churnSurveys && (
                churnSurveys.length > 0 ? (
                  <div className="data-table-wrap">
                    <DataTable<{
                      id: string;
                      user_id: number;
                      subscription_id: string;
                      reason: string;
                      reason_code: string;
                      free_text: string;
                      discount_offered: string;
                      offer_accepted: string;
                      created_at: string;
                    }>
                      density="compact"
                      columns={[
                        { key: "id", header: "ID" },
                        { key: "user_id", header: "User ID" },
                        { key: "subscription_id", header: "Subscription ID" },
                        { key: "reason", header: "Reason" },
                        { key: "reason_code", header: "Reason code" },
                        { key: "free_text", header: "Free text" },
                        { key: "discount_offered", header: "Discount offered" },
                        { key: "offer_accepted", header: "Offer accepted" },
                        { key: "created_at", header: "Created" },
                      ]}
                      rows={churnSurveys.map((c) => ({
                        id: c.id,
                        user_id: c.user_id,
                        subscription_id: c.subscription_id ?? "—",
                        reason: c.reason_group ?? c.reason,
                        reason_code: c.reason_code ?? "—",
                        free_text: c.free_text ?? "—",
                        discount_offered: c.discount_offered ? "Yes" : "No",
                        offer_accepted: c.offer_accepted === null ? "—" : c.offer_accepted ? "Yes" : "No",
                        created_at: c.created_at ? new Date(c.created_at).toLocaleString() : "—",
                      }))}
                      getRowKey={(row) => row.id}
                    />
                  </div>
                ) : (
                  <EmptyState message="No churn surveys match the filters." />
                )
              )}
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}
