import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer, Skeleton, Button, Modal, ConfirmDanger } from "@/design-system";
import { api } from "../api/client";
import { ListPage } from "../templates/ListPage";

interface RetentionRule {
  id: string;
  name: string;
  condition_json: Record<string, unknown>;
  action_type: string;
  action_params: Record<string, unknown> | null;
  priority: number;
  enabled: boolean;
  created_at: string | null;
}

interface RuleList {
  items: RetentionRule[];
  total: number;
}

const DEFAULT_CONDITION = { expiry_days_lte: 3, lifetime_months_gte: 2 };

export function RetentionAutomationPage() {
  const queryClient = useQueryClient();
  const [showNewRule, setShowNewRule] = useState(false);
  const [editingRule, setEditingRule] = useState<RetentionRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newExpiryDays, setNewExpiryDays] = useState(3);
  const [newLifetimeMonths, setNewLifetimeMonths] = useState(2);
  const [newActionType, setNewActionType] = useState<"reminder" | "discount_percent">("reminder");
  const [newDiscount, setNewDiscount] = useState(15);
  const [newReminderWhich, setNewReminderWhich] = useState<"3d" | "1d">("3d");
  const [newEnabled, setNewEnabled] = useState(true);
  const [newPriority, setNewPriority] = useState(0);

  const { data, error, isLoading } = useQuery<RuleList>({
    queryKey: ["admin", "retention", "rules"],
    queryFn: ({ signal }) => api.get<RuleList>("/admin/retention/rules", { signal }),
    staleTime: 30_000,
  });

  const runMutation = useMutation({
    mutationFn: () => api.post("/admin/retention/run", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "retention"] }),
  });

  const createRuleMutation = useMutation({
    mutationFn: (body: {
      name: string;
      condition_json: Record<string, number>;
      action_type: string;
      action_params: Record<string, unknown>;
      priority: number;
      enabled: boolean;
    }) => api.post("/admin/retention/rules", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "retention"] });
      setShowNewRule(false);
      setNewName("");
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string; condition_json: Record<string, number>; action_type: string; action_params: Record<string, unknown>; priority: number; enabled: boolean } }) =>
      api.patch(`/admin/retention/rules/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "retention"] });
      setEditingRule(null);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => api.request(`/admin/retention/rules/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "retention"] });
      setDeleteRuleId(null);
    },
  });

  const openEdit = useCallback((r: RetentionRule) => {
    setEditingRule(r);
    setNewName(r.name);
    const c = r.condition_json as Record<string, number>;
    setNewExpiryDays(c.expiry_days_lte ?? 3);
    setNewLifetimeMonths(c.lifetime_months_gte ?? 2);
    setNewActionType((r.action_type as "reminder" | "discount_percent") || "reminder");
    setNewReminderWhich((r.action_params?.which as "3d" | "1d") || "3d");
    setNewDiscount(Number(r.action_params?.discount) || 15);
    setNewEnabled(r.enabled);
    setNewPriority(r.priority);
  }, []);

  const handleCreateRule = () => {
    const condition_json: Record<string, number> = {};
    if (newExpiryDays > 0) condition_json.expiry_days_lte = newExpiryDays;
    if (newLifetimeMonths > 0) condition_json.lifetime_months_gte = newLifetimeMonths;
    const action_params =
      newActionType === "reminder"
        ? { which: newReminderWhich }
        : { discount: newDiscount };
    if (editingRule) {
      updateRuleMutation.mutate({
        id: editingRule.id,
        body: {
          name: newName || "Expiry reminder",
          condition_json: Object.keys(condition_json).length ? condition_json : DEFAULT_CONDITION as unknown as Record<string, number>,
          action_type: newActionType,
          action_params,
          priority: newPriority,
          enabled: newEnabled,
        },
      });
    } else {
      createRuleMutation.mutate({
        name: newName || "Expiry reminder",
        condition_json: Object.keys(condition_json).length ? condition_json : DEFAULT_CONDITION as unknown as Record<string, number>,
        action_type: newActionType,
        action_params,
        priority: newPriority,
        enabled: newEnabled,
      });
    }
  };

  if (error) {
    return (
      <PageContainer>
        <ListPage className="ref-page" title="RETENTION AUTOMATION">
          <p className="text-danger">{String(error)}</p>
        </ListPage>
      </PageContainer>
    );
  }

  if (isLoading || !data) {
    return (
      <PageContainer>
        <ListPage className="ref-page" title="RETENTION AUTOMATION">
          <Skeleton height={120} />
        </ListPage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ListPage className="ref-page" title="RETENTION RULES" primaryAction={
        <>
        <Button variant="secondary" size="sm" onClick={() => setShowNewRule(true)}>
          New rule
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
        >
          Run engine
        </Button>
        </>
      }>
      <p className="text-muted small">Total rules: {data.total}</p>
      <div className="card mt-3">
        <table className="table table-sm mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Condition</th>
              <th>Action</th>
              <th>Priority</th>
              <th>Enabled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td><code>{JSON.stringify(r.condition_json)}</code></td>
                <td>{r.action_type}</td>
                <td>{r.priority}</td>
                <td>{r.enabled ? "Yes" : "No"}</td>
                <td>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleteRuleId(r.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={showNewRule || editingRule !== null}
        onClose={() => { setShowNewRule(false); setEditingRule(null); }}
        title={editingRule ? "Edit retention rule" : "New retention rule"}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowNewRule(false); setEditingRule(null); }} disabled={createRuleMutation.isPending || updateRuleMutation.isPending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateRule} loading={createRuleMutation.isPending || updateRuleMutation.isPending}>
              {editingRule ? "Save" : "Create"}
            </Button>
          </>
        }
      >
        <div className="d-flex flex-column gap-2 mt-2">
          <label className="small fw-medium">Name</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. 3d expiry loyalty discount"
          />
          <label className="small fw-medium">Expiry within (days)</label>
          <input
            type="number"
            className="form-control form-control-sm"
            min={1}
            value={newExpiryDays}
            onChange={(e) => setNewExpiryDays(Number(e.target.value) || 3)}
          />
          <label className="small fw-medium">Lifetime at least (months)</label>
          <input
            type="number"
            className="form-control form-control-sm"
            min={0}
            value={newLifetimeMonths}
            onChange={(e) => setNewLifetimeMonths(Number(e.target.value) || 0)}
          />
          <label className="small fw-medium">Action</label>
          <select
            className="form-select form-select-sm"
            value={newActionType}
            onChange={(e) => setNewActionType(e.target.value as "reminder" | "discount_percent")}
          >
            <option value="reminder">Reminder (3d or 1d)</option>
            <option value="discount_percent">Discount %</option>
          </select>
          {newActionType === "reminder" && (
            <select
              className="form-select form-select-sm"
              value={newReminderWhich}
              onChange={(e) => setNewReminderWhich(e.target.value as "3d" | "1d")}
            >
              <option value="3d">3 days before expiry</option>
              <option value="1d">1 day before expiry</option>
            </select>
          )}
          {newActionType === "discount_percent" && (
            <>
              <label className="small fw-medium">Discount %</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={1}
                max={100}
                value={newDiscount}
                onChange={(e) => setNewDiscount(Number(e.target.value) || 15)}
              />
            </>
          )}
          <label className="small fw-medium">Priority</label>
          <input type="number" className="form-control form-control-sm" value={newPriority} onChange={(e) => setNewPriority(Number(e.target.value) || 0)} />
          <label className="d-flex align-items-center gap-2">
            <input type="checkbox" checked={newEnabled} onChange={(e) => setNewEnabled(e.target.checked)} />
            <span className="small">Enabled</span>
          </label>
        </div>
      </Modal>
      <ConfirmDanger
        open={deleteRuleId !== null}
        onClose={() => setDeleteRuleId(null)}
        onConfirm={() => {
          if (deleteRuleId) deleteRuleMutation.mutate(deleteRuleId);
        }}
        title="Delete retention rule"
        message="This rule will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteRuleMutation.isPending}
      />
    </ListPage>
    </PageContainer>
  );
}
