import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer, Skeleton, Button, Modal, ConfirmDanger } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

interface PromoCampaign {
  id: string;
  name: string;
  discount_percent: number;
  valid_from: string;
  valid_until: string;
  target_rule: string | null;
  max_redemptions: number | null;
  extra_params: Record<string, unknown> | null;
  created_at: string | null;
}

export function PromoCampaignsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState<PromoCampaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] = useState(15);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [targetRule, setTargetRule] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");

  const { data: campaigns, error, isLoading } = useQuery<PromoCampaign[]>({
    queryKey: ["admin", "promos", "campaigns"],
    queryFn: ({ signal }) => api.get<PromoCampaign[]>("/admin/promos/campaigns", { signal }),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; discount_percent: number; valid_from: string; valid_until: string; target_rule?: string; max_redemptions?: number }) =>
      api.post<PromoCampaign>("/admin/promos/campaigns", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promos"] });
      setShowCreate(false);
      resetForm();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string; discount_percent: number; valid_from: string; valid_until: string; target_rule?: string; max_redemptions?: number } }) =>
      api.patch<PromoCampaign>(`/admin/promos/campaigns/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promos"] });
      setEditCampaign(null);
      resetForm();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.request(`/admin/promos/campaigns/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promos"] });
      setDeleteId(null);
    },
  });

  function resetForm() {
    setName("");
    setDiscountPercent(15);
    setValidFrom("");
    setValidUntil("");
    setTargetRule("");
    setMaxRedemptions("");
  }

  function openEdit(c: PromoCampaign) {
    setEditCampaign(c);
    setName(c.name);
    setDiscountPercent(c.discount_percent);
    setValidFrom(c.valid_from.slice(0, 16));
    setValidUntil(c.valid_until.slice(0, 16));
    setTargetRule(c.target_rule ?? "");
    setMaxRedemptions(c.max_redemptions != null ? String(c.max_redemptions) : "");
  }

  function submitForm() {
    const from = validFrom || new Date().toISOString().slice(0, 16);
    const until = validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const body = {
      name: name || "Promo",
      discount_percent: discountPercent,
      valid_from: new Date(from).toISOString(),
      valid_until: new Date(until).toISOString(),
      target_rule: targetRule || undefined,
      max_redemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : undefined,
    };
    if (editCampaign) {
      updateMutation.mutate({ id: editCampaign.id, body });
    } else {
      createMutation.mutate(body);
    }
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Promo campaigns" />
        <p className="text-danger">{String(error)}</p>
      </PageContainer>
    );
  }
  if (isLoading || !campaigns) {
    return (
      <PageContainer>
        <PageHeader title="Promo campaigns" />
        <Skeleton height={120} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Promo campaigns">
        <Button variant="secondary" size="sm" onClick={() => { setShowCreate(true); resetForm(); }}>New campaign</Button>
      </PageHeader>
      <div className="card mt-3">
        <table className="table table-sm mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Discount %</th>
              <th>Valid from</th>
              <th>Valid until</th>
              <th>Target</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.discount_percent}</td>
                <td>{c.valid_from}</td>
                <td>{c.valid_until}</td>
                <td>{c.target_rule ?? "—"}</td>
                <td>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleteId(c.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={showCreate || editCampaign !== null}
        onClose={() => { setShowCreate(false); setEditCampaign(null); }}
        title={editCampaign ? "Edit campaign" : "New campaign"}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowCreate(false); setEditCampaign(null); }}>Cancel</Button>
            <Button variant="primary" onClick={submitForm} loading={createMutation.isPending || updateMutation.isPending}>Save</Button>
          </>
        }
      >
        <div className="d-flex flex-column gap-2 mt-2">
          <label className="small fw-medium">Name</label>
          <input type="text" className="form-control form-control-sm" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="small fw-medium">Discount %</label>
          <input type="number" min={1} max={100} className="form-control form-control-sm" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value) || 15)} />
          <label className="small fw-medium">Valid from (ISO)</label>
          <input type="datetime-local" className="form-control form-control-sm" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
          <label className="small fw-medium">Valid until (ISO)</label>
          <input type="datetime-local" className="form-control form-control-sm" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          <label className="small fw-medium">Target rule (e.g. expiry_soon)</label>
          <input type="text" className="form-control form-control-sm" value={targetRule} onChange={(e) => setTargetRule(e.target.value)} />
          <label className="small fw-medium">Max redemptions</label>
          <input type="number" className="form-control form-control-sm" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} />
        </div>
      </Modal>
      <ConfirmDanger
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={(_payload) => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
        title="Delete promo campaign"
        message="This campaign will be removed. Existing redemptions are not affected."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteMutation.isPending}
      />
    </PageContainer>
  );
}
