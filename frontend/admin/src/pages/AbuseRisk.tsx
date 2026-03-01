import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Button, ConfirmModal, ConfirmDanger } from "@/design-system";
import { api } from "../api/client";
import { ListPage } from "../templates/ListPage";

interface AbuseSignal {
  id: string;
  user_id: number;
  signal_type: string;
  severity: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  resolved_at: string | null;
}

interface AbuseList {
  items: AbuseSignal[];
  total: number;
}

function buildQuery(params: { limit: number; offset: number; user_id?: number; resolved?: boolean }) {
  const u = new URLSearchParams();
  u.set("limit", String(params.limit));
  u.set("offset", String(params.offset));
  if (params.user_id != null) u.set("user_id", String(params.user_id));
  if (params.resolved !== undefined) u.set("resolved", params.resolved ? "true" : "false");
  return "/admin/abuse/signals?" + u.toString();
}

const PAGE_SIZE = 20;

export function AbuseRiskPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [filterResolved, setFilterResolved] = useState<boolean | undefined>(undefined);
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [actionSignalId, setActionSignalId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"revoke_devices" | "ban_user" | null>(null);

  const queryParams = useMemo(() => ({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    user_id: filterUserId ? parseInt(filterUserId, 10) : undefined,
    resolved: filterResolved,
  }), [page, filterUserId, filterResolved]);

  const { data, error, isLoading } = useQuery<AbuseList>({
    queryKey: ["admin", "abuse", "signals", queryParams],
    queryFn: ({ signal }) => api.get<AbuseList>(buildQuery(queryParams), { signal }),
    staleTime: 30_000,
  });

  const runMutation = useMutation({
    mutationFn: () => api.post("/admin/abuse/run", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "abuse"] }),
  });
  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/abuse/signals/${id}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "abuse"] });
      setResolveId(null);
    },
  });
  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.post(`/admin/abuse/signals/${id}/action`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "abuse"] });
      setActionSignalId(null);
      setActionType(null);
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  if (error) {
    return (
      <ListPage className="ref-page" title="ABUSE & RISK">
        <p className="text-danger">{String(error)}</p>
      </ListPage>
    );
  }

  if (isLoading || !data) {
    return (
      <ListPage className="ref-page" title="ABUSE & RISK">
        <Skeleton height={120} />
      </ListPage>
    );
  }

  return (
    <ListPage className="ref-page" data-testid="abuse-risk-page" title="ABUSE & RISK" primaryAction={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
        >
          Run detection
        </Button>
      } filterBar={
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <span className="text-muted small">Filters:</span>
        <select
          className="form-select form-select-sm w-auto"
          value={filterResolved === undefined ? "all" : filterResolved ? "resolved" : "unresolved"}
          onChange={(e) => {
            const v = e.target.value;
            setFilterResolved(v === "all" ? undefined : v === "resolved");
            setPage(0);
          }}
        >
          <option value="all">All</option>
          <option value="unresolved">Unresolved</option>
          <option value="resolved">Resolved</option>
        </select>
        <input
          type="number"
          className="form-control form-control-sm ref-input-width-100"
          placeholder="User ID"
          value={filterUserId}
          onChange={(e) => { setFilterUserId(e.target.value); setPage(0); }}
        />
        <span className="text-muted small">Total: {data.total}</span>
      </div>
      }>
      <div className="card mt-3">
        <table className="table table-sm mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Suggested action</th>
              <th>Created</th>
              <th>Resolved</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/users/${s.user_id}`}>{s.user_id}</Link>
                </td>
                <td>{s.signal_type}</td>
                <td>{s.severity}</td>
                <td>{(s.payload?.suggested_action as string) ?? "—"}</td>
                <td>{s.created_at}</td>
                <td>{s.resolved_at ?? "—"}</td>
                <td>
                  {!s.resolved_at && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setResolveId(s.id)}>
                        Resolve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-warning"
                        onClick={() => { setActionSignalId(s.id); setActionType("revoke_devices"); }}
                      >
                        Revoke devices
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onClick={() => { setActionSignalId(s.id); setActionType("ban_user"); }}
                      >
                        Ban user
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="d-flex gap-2 mt-2">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span className="small align-self-center">Page {page + 1} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
      <ConfirmModal
        open={resolveId !== null}
        onClose={() => setResolveId(null)}
        onConfirm={() => {
          if (resolveId) resolveMutation.mutate(resolveId);
        }}
        title="Resolve abuse signal"
        message="Mark this signal as resolved. This action is logged."
        confirmLabel="Resolve"
        cancelLabel="Cancel"
        loading={resolveMutation.isPending}
      />
      <ConfirmDanger
        open={actionSignalId !== null && actionType !== null}
        onClose={() => { setActionSignalId(null); setActionType(null); }}
        onConfirm={() => {
          if (actionSignalId && actionType) actionMutation.mutate({ id: actionSignalId, action: actionType });
        }}
        title={actionType === "ban_user" ? "Ban user" : "Revoke all devices"}
        message={
          actionType === "ban_user"
            ? "Set user as banned. They will be blocked from using the service."
            : "Revoke all devices for this user. They will need to re-issue configs."
        }
        confirmLabel={actionType === "ban_user" ? "Ban" : "Revoke devices"}
        cancelLabel="Cancel"
        loading={actionMutation.isPending}
      />
    </ListPage>
  );
}
