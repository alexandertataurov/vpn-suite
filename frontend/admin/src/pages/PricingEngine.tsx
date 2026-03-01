import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer, Skeleton, Button, Modal } from "@/design-system";
import { Heading } from "@/design-system";
import { api } from "../api/client";
import { ListPage } from "../templates/ListPage";

interface Plan {
  id: string;
  name: string;
  duration_days: number;
  price_currency: string;
  price_amount: number;
}

interface PlanList {
  items: Plan[];
  total: number;
}

interface PriceHistoryItem {
  id: string;
  plan_id: string;
  price_amount_old: number | null;
  price_amount_new: number;
  changed_by_admin_id: string | null;
  reason: string | null;
  created_at: string;
}

interface PriceHistoryList {
  items: PriceHistoryItem[];
  total: number;
}

const HISTORY_PAGE_SIZE = 20;

export function PricingEnginePage() {
  const queryClient = useQueryClient();
  const [historyPage, setHistoryPage] = useState(0);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editRevenueImpact, setEditRevenueImpact] = useState("");

  const { data: plansData, error: plansError, isLoading: plansLoading } = useQuery<PlanList>({
    queryKey: ["plans"],
    queryFn: ({ signal }) => api.get<PlanList>("/plans?limit=100", { signal }),
    staleTime: 60_000,
  });

  const { data: historyData, error: historyError, isLoading: historyLoading } = useQuery<PriceHistoryList>({
    queryKey: ["admin", "pricing", "history", historyPage],
    queryFn: ({ signal }) =>
      api.get<PriceHistoryList>(`/admin/pricing/history?limit=${HISTORY_PAGE_SIZE}&offset=${historyPage * HISTORY_PAGE_SIZE}`, { signal }),
    staleTime: 60_000,
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ planId, price, reason, revenueImpact }: { planId: string; price: number; reason?: string; revenueImpact?: number }) =>
      api.post(`/admin/pricing/plans/${planId}/price`, {
        price_amount_new: price,
        reason: reason || null,
        revenue_impact_estimate: revenueImpact ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing"] });
      setEditPlan(null);
      setEditPrice("");
      setEditReason("");
      setEditRevenueImpact("");
    },
  });

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setEditPrice(String(plan.price_amount));
    setEditReason("");
    setEditRevenueImpact("");
  };

  const handleSavePrice = () => {
    if (!editPlan) return;
    const price = parseFloat(editPrice);
    if (Number.isNaN(price) || price < 0) return;
    const revenueImpact = editRevenueImpact ? parseFloat(editRevenueImpact) : undefined;
    updatePriceMutation.mutate({
      planId: editPlan.id,
      price,
      reason: editReason || undefined,
      revenueImpact: Number.isNaN(revenueImpact as number) ? undefined : (revenueImpact as number),
    });
  };

  const historyTotal = historyData?.total ?? 0;
  const historyPages = Math.ceil(historyTotal / HISTORY_PAGE_SIZE);
  const planNames = new Map(plansData?.items.map((p) => [p.id, p.name]) ?? []);

  if (plansError || historyError) {
    return (
      <PageContainer>
        <ListPage className="ref-page" title="PRICING ENGINE">
          <p className="text-danger">{String(plansError || historyError)}</p>
        </ListPage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ListPage className="ref-page" title="PRICING ENGINE">
          <Heading level={3} className="h6 mt-3">Plans</Heading>
      {plansLoading || !plansData ? (
        <Skeleton height={80} />
      ) : (
        <div className="card mt-2">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Duration (days)</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plansData.items.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td><code>{p.id}</code></td>
                  <td>{p.duration_days}</td>
                  <td>{p.price_currency} {p.price_amount}</td>
                  <td>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit price</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

          <Heading level={3} className="h6 mt-4">Price history</Heading>
      {historyLoading || !historyData ? (
        <Skeleton height={80} />
      ) : (
        <>
          <p className="text-muted small">Total: {historyTotal}</p>
          <div className="card mt-2">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Old</th>
                  <th>New</th>
                  <th>Changed by</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {historyData.items.map((r) => (
                  <tr key={r.id}>
                    <td>{planNames.get(r.plan_id) ?? r.plan_id}</td>
                    <td>{r.price_amount_old ?? "—"}</td>
                    <td>{r.price_amount_new}</td>
                    <td>{r.changed_by_admin_id ?? "—"}</td>
                    <td>{r.reason ?? "—"}</td>
                    <td>{r.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {historyPages > 1 && (
            <div className="d-flex gap-2 mt-2">
              <Button variant="ghost" size="sm" disabled={historyPage === 0} onClick={() => setHistoryPage((p) => p - 1)}>Prev</Button>
              <span className="small align-self-center">Page {historyPage + 1} / {historyPages}</span>
              <Button variant="ghost" size="sm" disabled={historyPage >= historyPages - 1} onClick={() => setHistoryPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={editPlan !== null}
        onClose={() => { setEditPlan(null); }}
        title={editPlan ? `Edit price: ${editPlan.name}` : "Edit price"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditPlan(null)} disabled={updatePriceMutation.isPending}>Cancel</Button>
            <Button variant="primary" onClick={handleSavePrice} loading={updatePriceMutation.isPending}>Save</Button>
          </>
        }
      >
        {editPlan && (
          <div className="d-flex flex-column gap-2 mt-2">
            <label className="small fw-medium">New price amount</label>
            <input type="number" step="0.01" min={0} className="form-control form-control-sm" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            <label className="small fw-medium">Reason (optional)</label>
            <input type="text" className="form-control form-control-sm" value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="e.g. Promo adjustment" />
            <label className="small fw-medium">Revenue impact estimate (optional)</label>
            <input type="number" step="0.01" className="form-control form-control-sm" value={editRevenueImpact} onChange={(e) => setEditRevenueImpact(e.target.value)} placeholder="Optional" />
          </div>
        )}
      </Modal>
      </ListPage>
    </PageContainer>
  );
}
