import { useParams } from "react-router-dom";
import { formatDate, getErrorMessage, userStatusToVariant } from "@vpn-suite/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userKey } from "../api/query-keys";
import { Users } from "lucide-react";
import { PrimitiveBadge, Button, Panel, Skeleton, useToast, PageError, EmptyTableState } from "@vpn-suite/shared/ui";
import type { UserDetail as UserDetailType } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading, error, refetch } = useQuery<UserDetailType>({
    queryKey: userKey(id!),
    queryFn: ({ signal }) => api.get<UserDetailType>(`/users/${id}`, { signal }),
    enabled: !!id,
  });

  const issueMutation = useMutation({
    mutationFn: (subscriptionId: string) =>
      api.post(`/users/${id}/devices/issue`, { subscription_id: subscriptionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKey(id!) });
      addToast("Device issue requested", "success");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Failed"), "error");
    },
  });

  const activeSub = data?.subscriptions?.find((s) => s.effective_status === "active");

  if (error) {
    return (
      <div className="ref-page" data-testid="user-detail-page">
        <PageHeader backTo="/users" backLabel="Users" title={`User ${id}`} description="User profile and devices" />
        <PageError
          message={getErrorMessage(error, "Failed to load user")}
          requestId={error instanceof ApiError ? error.requestId : undefined}
          statusCode={error instanceof ApiError ? error.statusCode : undefined}
          endpoint="GET /users/:id"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="ref-page" data-testid="user-detail-page">
        <PageHeader backTo="/users" backLabel="Users" title={`User ${id}`} description="User profile and devices" />
        <Skeleton variant="card" />
      </div>
    );
  }

  return (
    <div className="ref-page" data-testid="user-detail-page">
      <PageHeader
        backTo="/users"
        backLabel="Users"
        icon={Users}
        title={`User ${data.id}`}
        description="Profile and subscription state"
      />

      <Panel as="section" variant="outline">
        <h3 className="ref-settings-title">Details</h3>
        <p className="m-0"><strong>Telegram ID:</strong> {data.tg_id ?? "—"}</p>
        <p className="m-0"><strong>Email:</strong> {data.email ?? "—"}</p>
        <p className="m-0"><strong>Phone:</strong> {data.phone ?? "—"}</p>
        <p className="m-0">
          <strong>Status:</strong>{" "}
          <PrimitiveBadge variant={userStatusToVariant(data.is_banned ? "banned" : "active")}>
            {data.is_banned ? "Banned" : "Active"}
          </PrimitiveBadge>
        </p>
      </Panel>

      <Panel as="section" variant="outline">
        <h3 className="ref-settings-title">Subscriptions</h3>
        {data.subscriptions?.length ? (
          <ul className="m-0 pl-lg">
            {data.subscriptions.map((s) => (
              <li key={s.id}>
                Plan {s.plan_id} — {s.effective_status ?? s.status} — until {formatDate(s.valid_until)}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyTableState
            className="table-empty"
            title="No subscriptions"
            description="This user has no active or historical subscriptions."
          />
        )}
      </Panel>

      <Panel as="section" variant="outline">
        <div className="ref-page-header">
          <h3 className="ref-settings-title">Devices</h3>
          <div className="ref-page-actions">
            <Button
              size="sm"
              disabled={!activeSub || issueMutation.isPending}
              loading={issueMutation.isPending}
              onClick={() => activeSub && issueMutation.mutate(activeSub.id)}
            >
              Issue device
            </Button>
          </div>
        </div>
        <EmptyTableState
          className="table-empty"
          title="No devices in this view"
          description="Load devices from the Devices page, filtering by this user."
        />
      </Panel>
    </div>
  );
}
