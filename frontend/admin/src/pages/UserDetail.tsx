import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDate, getErrorMessage } from "@vpn-suite/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userKey, USERS_KEY } from "../api/query-keys";
import { IconUsers } from "@/design-system/icons";
import { Button, Card, Skeleton, useToast, PageError, EmptyTableState, ConfirmModal } from "@/design-system";
import { Heading } from "@/design-system";
import { FormActions } from "@/design-system";
import type { UserDetail as UserDetailType } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import { DetailPage } from "../templates/DetailPage";
import { TelemetryBadge } from "@/components";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: () => api.request<void>(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      addToast("User deleted", "success");
      setDeleteConfirmOpen(false);
      navigate("/users");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Delete failed"), "error");
    },
  });

  const activeSub = data?.subscriptions?.find((s) => s.effective_status === "active");

  if (error) {
    return (
      <DetailPage className="ref-page" data-testid="user-detail-page" backTo="/users" backLabel="Users" title={`User ${id}`} description="User profile and devices">
        <PageError
          message={getErrorMessage(error, "Failed to load user")}
          requestId={error instanceof ApiError ? error.requestId : undefined}
          statusCode={error instanceof ApiError ? error.statusCode : undefined}
          endpoint="GET /users/:id"
          onRetry={() => refetch()}
        />
      </DetailPage>
    );
  }

  if (isLoading || !data) {
    return (
      <DetailPage className="ref-page" data-testid="user-detail-page" backTo="/users" backLabel="Users" title={`User ${id}`} description="User profile and devices">
        <Skeleton variant="card" />
      </DetailPage>
    );
  }

  return (
    <DetailPage
      className="ref-page"
      data-testid="user-detail-page"
      backTo="/users"
      backLabel="Users"
      icon={IconUsers}
      title={`USER ${data.id}`}
      description="Profile and subscription state"
    >
      <Card as="section" variant="outline">
        <div className="ref-page-header">
          <Heading level={3} className="ref-settings-title">Details</Heading>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={deleteMutation.isPending}
          >
            Delete user
          </Button>
        </div>
        <p className="m-0"><strong>Telegram ID:</strong> {data.tg_id ?? "—"}</p>
        <p className="m-0"><strong>Email:</strong> {data.email ?? "—"}</p>
        <p className="m-0"><strong>Phone:</strong> {data.phone ?? "—"}</p>
        <p className="m-0">
          <strong>Status:</strong>{" "}
          <TelemetryBadge variant={data.is_banned ? "no-signal" : "link-established"} />
        </p>
      </Card>

      <Card as="section" variant="outline">
        <Heading level={3} className="ref-settings-title">Subscriptions</Heading>
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
      </Card>

      <Card as="section" variant="outline">
        <div className="ref-page-header">
          <Heading level={3} className="ref-settings-title">Devices</Heading>
          <FormActions>
            <Button
              size="sm"
              disabled={!activeSub || issueMutation.isPending}
              loading={issueMutation.isPending}
              onClick={() => activeSub && issueMutation.mutate(activeSub.id)}
            >
              Issue device
            </Button>
          </FormActions>
        </div>
        <EmptyTableState
          className="table-empty"
          title="No devices in this view"
          description="Load devices from the Devices page, filtering by this user."
        />
      </Card>

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete user"
        message="Permanently delete this user? Their devices, subscriptions, and payments will be removed. This cannot be undone."
        confirmLabel="Delete user"
        cancelLabel="Cancel"
        loading={deleteMutation.isPending}
      />
    </DetailPage>
  );
}
