import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/core/api/useApiQuery";
import { useApi } from "@/core/api/context";
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
import type { PlanList, PlanOut } from "@/shared/types/admin-api";

const TABS = [
  { id: "subscriptions", label: "Subscriptions" },
  { id: "payments", label: "Payments" },
] as const;

type PlanStyle = "normal" | "popular" | "promotional";

interface PlanRow {
  id: string;
  name: string;
  duration: string;
  price: string;
  style: string;
  createdAt: string;
  actions: JSX.Element;
}

interface PlanFormState {
  name: string;
  durationDays: string;
  priceCurrency: string;
  priceAmount: string;
  style: PlanStyle;
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

  const {
    data: plans,
    isLoading: isPlansLoading,
    isError: isPlansError,
    error: plansError,
    refetch: refetchPlans,
  } = useApiQuery<PlanList>(["billing", "plans"], "/plans?limit=50&offset=0", { retry: 1 });

  const [editingPlan, setEditingPlan] = useState<PlanOut | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<PlanFormState>({
    name: "",
    durationDays: "",
    priceCurrency: "USD",
    priceAmount: "",
    style: "normal",
  });
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const planRows: PlanRow[] = useMemo(() => {
    if (!plans?.items?.length) return [];
    return plans.items.map((p) => {
      const { style, cleanName } = parsePlanName(p.name);
      const styleLabel =
        style === "promotional" ? "Promotional" : style === "popular" ? "Popular" : "Normal";
      return {
        id: p.id,
        name: cleanName || p.id,
        duration: `${p.duration_days} days`,
        price: `${p.price_amount} ${p.price_currency}`,
        style: styleLabel,
        createdAt: new Date(p.created_at).toLocaleDateString(),
        actions: (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingPlan(p);
              setForm({
                name: cleanName,
                durationDays: String(p.duration_days),
                priceCurrency: p.price_currency,
                priceAmount: String(p.price_amount),
                style,
              });
              setSaveError(null);
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>
        ),
      };
    });
  }, [plans]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({
      name: "",
      durationDays: "",
      priceCurrency: "USD",
      priceAmount: "",
      style: "normal",
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
    form.priceCurrency.trim().length > 0 &&
    form.priceAmount.trim().length > 0;

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
        price_currency: form.priceCurrency.trim(),
        price_amount: form.priceAmount.trim(),
      };
      if (editingPlan) {
        await api.patch<PlanOut>(`/plans/${editingPlan.id}`, body);
      } else {
        await api.post<PlanOut>("/plans", body);
      }
      await queryClient.invalidateQueries({ queryKey: ["billing", "plans"] });
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
        {active === "subscriptions" && (
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
                {planRows.length > 0 ? (
                  <div className="data-table-wrap">
                    <DataTable<PlanRow>
                      density="compact"
                      columns={[
                        { key: "name", header: "Plan" },
                        { key: "duration", header: "Duration" },
                        { key: "price", header: "Price" },
                        { key: "style", header: "Style" },
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
                    Price currency
                    <Input
                      value={form.priceCurrency}
                      onChange={(e) => handleFormChange({ priceCurrency: e.target.value })}
                      placeholder="USD"
                    />
                  </label>
                </div>
                <div className="input-wrap">
                  <label className="input-label">
                    Price amount
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.priceAmount}
                      onChange={(e) => handleFormChange({ priceAmount: e.target.value })}
                      placeholder="9.99"
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
          </>
        )}
        {active === "payments" && <MetaText>Payments (placeholder).</MetaText>}
      </div>
    </PageLayout>
  );
}
