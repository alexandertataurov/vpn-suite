import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "@/core/api/context";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { buildUsersPath, type UserDeviceListOut } from "@/hooks/useUsers";
import { deviceKeys } from "@/features/devices/services/device.query-keys";
import { userKeys } from "@/features/users/services/user.query-keys";
import {
  ConfirmActionModal,
  UserActionsPanel,
  UserDetailWorkspace,
  UserDevicesPanel,
  UserOverviewPanel,
  UserSubscriptionsPanel,
  UsersFilterBar,
  UsersListPane,
  type DeliveryMode,
  type IssueResponse,
  type UserDetailTab,
  type UserFiltersState,
  formatRelative,
  getIssuedConfigText,
  getTgRequisites,
} from "@/features/users/UsersPage.sections";
import { ActionMenu, Badge } from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { PageErrorState, PageLoadingState } from "@/layout/PageStates";
import { MetaText } from "@/design-system/typography";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type {
  PlanList,
  ServerList,
  UserDetail,
  UserList,
} from "@/shared/types/admin-api";

interface IssueServerListOut {
  items: Array<{
    id: string;
    is_active: boolean;
    region: string | null;
    kind?: "awg_node" | "legacy_wg_relay";
  }>;
  total: number;
}

function resolveSearchTarget(value: string): { tgId?: string; email?: string; phone?: string } {
  const query = value.trim();
  if (!query) return {};
  if (/^\d+$/.test(query)) return { tgId: query };
  if (query.startsWith("+")) return { phone: query };
  return { email: query };
}

function createDefaultFilters(): UserFiltersState {
  return {
    search: "",
    isBanned: "all",
    planId: "",
    region: "",
  };
}

function parseSelectedUserId(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get("user");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function stringifyMeta(meta: Record<string, unknown> | null | undefined): string {
  try {
    return JSON.stringify(meta ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export function UsersPage() {
  const api = useApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const desktopWorkspace = useMediaQuery("(min-width: 1024px)");
  const [searchParams, setSearchParams] = useSearchParams();

  const limit = 50;
  const [offset, setOffset] = useState(0);
  const [draft, setDraft] = useState<UserFiltersState>(createDefaultFilters);
  const [applied, setApplied] = useState<UserFiltersState>(createDefaultFilters);
  const [detailTab, setDetailTab] = useState<UserDetailTab>("overview");
  const [actionPending, setActionPending] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [issueOk, setIssueOk] = useState<IssueResponse | null>(null);
  const [issuePreviewOpen, setIssuePreviewOpen] = useState(false);
  const [banUserId, setBanUserId] = useState<number | null>(null);
  const [banToken, setBanToken] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editMeta, setEditMeta] = useState("");
  const [issueSubId, setIssueSubId] = useState("");
  const [issueServerId, setIssueServerId] = useState("");
  const [issueDeviceName, setIssueDeviceName] = useState("");
  const [issueDeliveryMode, setIssueDeliveryMode] = useState<DeliveryMode>("awg_native");

  const selectedUserId = parseSelectedUserId(searchParams);
  const searchTarget = useMemo(() => resolveSearchTarget(applied.search), [applied.search]);

  const listPath = useMemo(
    () =>
      buildUsersPath({
        limit,
        offset,
        tgId: searchTarget.tgId,
        email: searchTarget.email,
        phone: searchTarget.phone,
        isBanned: applied.isBanned,
        planId: applied.planId,
        region: applied.region,
      }),
    [applied.isBanned, applied.planId, applied.region, limit, offset, searchTarget.email, searchTarget.phone, searchTarget.tgId]
  );

  const {
    data: userList,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useApiQuery<UserList>([...userKeys.list(listPath)], listPath, { retry: 1, staleTime: 15_000 });

  const {
    data: userDetail,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useApiQuery<UserDetail>(
    [...userKeys.detail(selectedUserId ?? 0)],
    `/users/${selectedUserId!}`,
    { enabled: selectedUserId != null, retry: 0 }
  );

  const { data: userDevices, isLoading: isUserDevicesLoading } = useApiQuery<UserDeviceListOut>(
    [...userKeys.devices(selectedUserId ?? 0)],
    `/users/${selectedUserId!}/devices?limit=50&offset=0`,
    { enabled: selectedUserId != null, retry: 0, staleTime: 10_000 }
  );

  const { data: plans } = useApiQuery<PlanList>(
    ["users-page", "plans"],
    "/plans?limit=200&offset=0&include_archived=false",
    { retry: 1, staleTime: 60_000 }
  );

  const { data: servers } = useApiQuery<ServerList>(
    ["users-page", "servers"],
    "/servers?limit=200&offset=0",
    { retry: 1, staleTime: 60_000 }
  );

  const { data: issueServers } = useApiQuery<IssueServerListOut>(
    ["users-page", "issue-servers"],
    "/servers?limit=200&offset=0&is_active=true",
    { enabled: selectedUserId != null, retry: 0, staleTime: 30_000 }
  );

  const selectedSummaryUser = useMemo(
    () => (userList?.items ?? []).find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, userList?.items]
  );

  const hasLegacyRelay = useMemo(
    () => (issueServers?.items ?? []).some((server) => server.is_active && server.kind === "legacy_wg_relay"),
    [issueServers?.items]
  );

  const legacyRelayUnavailableReason = hasLegacyRelay
    ? null
    : "Legacy WG via relay is unavailable because no active relay servers are configured.";

  const planOptions = useMemo(
    () =>
      Array.from(
        new Set((plans?.items ?? []).filter((plan) => !plan.is_archived).map((plan) => plan.id))
      ).sort(),
    [plans?.items]
  );

  const regionOptions = useMemo(
    () =>
      Array.from(
        new Set((servers?.items ?? []).map((server) => server.region).filter((value): value is string => Boolean(value)))
      ).sort(),
    [servers?.items]
  );

  const clearSectionErrors = useCallback(() => {
    setProfileError(null);
    setIssueError(null);
    setDangerError(null);
  }, []);

  const setSelectedUser = useCallback(
    (userId: number | null) => {
      const next = new URLSearchParams(searchParams);
      if (userId == null) next.delete("user");
      else next.set("user", String(userId));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const invalidateUsers = useCallback(
    (userId?: number | null) => {
      void queryClient.invalidateQueries({ queryKey: [...userKeys.lists()] });
      if (userId != null) {
        void queryClient.invalidateQueries({ queryKey: [...userKeys.detail(userId)] });
        void queryClient.invalidateQueries({ queryKey: [...userKeys.devices(userId)] });
      }
    },
    [queryClient]
  );

  const runAction = useCallback(
    async (section: "profile" | "issue" | "danger", fn: () => Promise<unknown>) => {
      clearSectionErrors();
      setActionPending(true);
      try {
        await fn();
        invalidateUsers(selectedUserId);
        void refetchUsers();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Action failed";
        if (section === "profile") setProfileError(message);
        if (section === "issue") setIssueError(message);
        if (section === "danger") setDangerError(message);
      } finally {
        setActionPending(false);
      }
    },
    [clearSectionErrors, invalidateUsers, refetchUsers, selectedUserId]
  );

  const syncEditFields = useCallback((detail: UserDetail | undefined) => {
    if (!detail) return;
    setEditEmail(detail.email ?? "");
    setEditPhone(detail.phone ?? "");
    setEditMeta(stringifyMeta(detail.meta));
  }, []);

  useEffect(() => {
    if (userDetail) {
      syncEditFields(userDetail);
      setIssueSubId((current) => current || userDetail.subscriptions[0]?.id || "");
    }
  }, [syncEditFields, userDetail]);

  useEffect(() => {
    if (selectedUserId != null) return;
    const firstUserId = userList?.items?.[0]?.id;
    if (!firstUserId) return;
    setSelectedUser(firstUserId);
  }, [selectedUserId, setSelectedUser, userList?.items]);

  useEffect(() => {
    if ((userList?.items?.length ?? 0) === 0) return;
    if (selectedUserId == null) return;
    const existsOnPage = (userList?.items ?? []).some((user) => user.id === selectedUserId);
    if (!existsOnPage) {
      setSelectedUser(userList?.items?.[0]?.id ?? null);
    }
  }, [selectedUserId, setSelectedUser, userList?.items]);

  const handleApplyFilters = useCallback(() => {
    setOffset(0);
    setApplied(draft);
  }, [draft]);

  const handleResetFilters = useCallback(() => {
    const next = createDefaultFilters();
    setDraft(next);
    setApplied(next);
    setOffset(0);
  }, []);

  const handleSaveUser = useCallback(() => {
    if (!userDetail) return;

    let metaObj: Record<string, unknown> | null = null;
    try {
      metaObj = editMeta.trim() ? (JSON.parse(editMeta) as Record<string, unknown>) : {};
    } catch {
      setProfileError("Meta must be valid JSON");
      return;
    }

    void runAction("profile", () =>
      api.patch(`/users/${userDetail.id}`, {
        email: editEmail.trim() ? editEmail.trim() : null,
        phone: editPhone.trim() ? editPhone.trim() : null,
        meta: metaObj,
      })
    );
  }, [api, editEmail, editMeta, editPhone, runAction, userDetail]);

  const handleUnban = useCallback(() => {
    if (!userDetail) return;
    void runAction("danger", () => api.patch(`/users/${userDetail.id}`, { is_banned: false }));
  }, [api, runAction, userDetail]);

  const handleBanSubmit = useCallback(() => {
    if (!banUserId) return;
    void runAction("danger", () =>
      api.patch(`/users/${banUserId}`, { is_banned: true, confirm_token: banToken })
    );
    setBanUserId(null);
    setBanToken("");
  }, [api, banToken, banUserId, runAction]);

  const handleDeleteSubmit = useCallback(() => {
    if (!deleteUserId) return;
    void runAction("danger", () =>
      api.request(`/users/${deleteUserId}`, {
        method: "DELETE",
        body: JSON.stringify({ confirm_token: deleteConfirm.trim() }),
      })
    );
    setDeleteUserId(null);
    setDeleteConfirm("");
    setSelectedUser(null);
  }, [api, deleteConfirm, deleteUserId, runAction, setSelectedUser]);

  const handleIssueDevice = useCallback(() => {
    if (!userDetail) return;

    setIssueOk(null);
    setIssuePreviewOpen(false);

    const subscriptionId = issueSubId.trim();
    if (!subscriptionId) {
      setIssueError("Subscription id is required to issue a device");
      return;
    }
    if (issueDeliveryMode === "legacy_wg_via_relay" && !hasLegacyRelay) {
      setIssueError(legacyRelayUnavailableReason);
      return;
    }

    void runAction("issue", async () => {
      const response = await api.post<IssueResponse>(`/users/${userDetail.id}/devices/issue`, {
        subscription_id: subscriptionId,
        server_id: issueServerId.trim() || null,
        device_name: issueDeviceName.trim() || null,
        delivery_mode: issueDeliveryMode,
      });
      setIssueOk(response);
      void queryClient.invalidateQueries({ queryKey: [...deviceKeys.lists()] });
      void queryClient.invalidateQueries({ queryKey: [...deviceKeys.summary()] });
    });
  }, [
    api,
    hasLegacyRelay,
    issueDeliveryMode,
    issueDeviceName,
    issueServerId,
    issueSubId,
    legacyRelayUnavailableReason,
    queryClient,
    runAction,
    userDetail,
  ]);

  const handleCopyIssuedConfig = useCallback(async () => {
    const text = getIssuedConfigText(issueOk);
    if (!text) {
      setIssueError("Issued response did not include a config payload");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setIssueError("Failed to copy config to clipboard");
    }
  }, [issueOk]);

  const rows = useMemo(() => {
    const detailSubscriptionCount = userDetail?.subscriptions.length ?? 0;
    const detailDeviceCount = userDevices?.items.length ?? 0;

    return (userList?.items ?? []).map((user) => {
      const tg = getTgRequisites(user.meta);
      const primaryLabel =
        user.email || (tg?.username ? `@${tg.username}` : [tg?.first_name, tg?.last_name].filter(Boolean).join(" ")) || `User #${user.id}`;
      const contextBadges: ReactNode[] = [];
      if (user.is_banned) {
        contextBadges.push(
          <Badge key="banned-attention" size="sm" variant="warning">
            Attention
          </Badge>
        );
      }
      if (selectedUserId === user.id && detailSubscriptionCount > 0) {
        contextBadges.push(
          <Badge key="subs" size="sm" variant="neutral">
            {detailSubscriptionCount} subs
          </Badge>
        );
      }
      if (selectedUserId === user.id && detailDeviceCount > 0) {
        contextBadges.push(
          <Badge key="devices" size="sm" variant="neutral">
            {detailDeviceCount} devices
          </Badge>
        );
      }
      if (selectedUserId === user.id && detailSubscriptionCount === 0) {
        contextBadges.push(
          <Badge key="no-subscription" size="sm" variant="danger">
            No subscription
          </Badge>
        );
      }
      if (selectedUserId === user.id && detailSubscriptionCount > 0 && detailDeviceCount === 0) {
        contextBadges.push(
          <Badge key="no-devices" size="sm" variant="warning">
            No devices
          </Badge>
        );
      }

      return {
        id: String(user.id),
        isSelected: selectedUserId === user.id,
        user: (
          <button
            type="button"
            className="users-page__row-select"
            onClick={() => setSelectedUser(user.id)}
            aria-label={`Open user ${user.id}`}
          >
            <span className="users-page__row-title">{primaryLabel}</span>
            <span className="users-page__row-meta">
              #{user.id} · TG {user.tg_id ?? "—"} · updated {formatRelative(user.updated_at)}
            </span>
          </button>
        ),
        status: (
          <Badge variant={user.is_banned ? "danger" : "success"} size="sm">
            {user.is_banned ? "Banned" : "Active"}
          </Badge>
        ),
        context: contextBadges.length > 0 ? (
          <div className="users-page__badge-row">{contextBadges}</div>
        ) : (
          <MetaText className="users-page__muted">No cached context</MetaText>
        ),
        action: (
          <ActionMenu
            label={`Actions for user ${user.id}`}
            items={[
              { id: "inspect", label: "Inspect", onSelect: () => setSelectedUser(user.id) },
              {
                id: "attention",
                label: "Review in Customer 360",
                onSelect: () => navigate(`/customer-360?user=${user.id}&tab=attention`),
              },
            ]}
          />
        ),
      };
    });
  }, [navigate, selectedUserId, setSelectedUser, userDetail?.subscriptions.length, userDevices?.items.length, userList?.items]);

  const total = userList?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  if (isUsersLoading) {
    return <PageLoadingState title="Users" pageClass="users-page" bodyHeight={240} />;
  }

  if (isUsersError) {
    return (
      <PageErrorState
        title="Users"
        pageClass="users-page"
        message={usersError instanceof Error ? usersError.message : "Users data is unavailable right now."}
        onRetry={() => void refetchUsers()}
      />
    );
  }

  return (
    <PageLayout
      title="Users"
      description="Operator workspace for account review, device issuance, and account actions."
      pageClass="users-page"
      actions={
        total > 0 ? (
          <MetaText>{total} users in current scope</MetaText>
        ) : (
          <MetaText>No users in current scope</MetaText>
        )
      }
    >
      <UsersFilterBar
        draft={draft}
        onDraftChange={setDraft}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        planOptions={planOptions}
        regionOptions={regionOptions}
      />

      <section className="users-page__workspace">
        <UsersListPane
          rows={rows}
          total={total}
          offset={offset}
          limit={limit}
          canPrev={canPrev}
          canNext={canNext}
          onPrev={() => setOffset((value) => Math.max(0, value - limit))}
          onNext={() => setOffset((value) => value + limit)}
        />

        <UserDetailWorkspace
          open={selectedUserId != null}
          desktop={desktopWorkspace}
          selectedUserId={selectedUserId}
          selectedSummary={selectedSummaryUser}
          userDetail={userDetail}
          isUserLoading={isUserLoading}
          userDevices={userDevices}
          isUserDevicesLoading={isUserDevicesLoading}
          detailTab={detailTab}
          onDetailTabChange={setDetailTab}
          onClose={() => setSelectedUser(null)}
          overviewPanel={
            userDetail ? (
              <UserOverviewPanel
                userDetail={userDetail}
                userDevices={userDevices}
                isUserDevicesLoading={isUserDevicesLoading}
                actionError={isUserError ? "Failed to load user detail." : null}
              />
            ) : null
          }
          subscriptionsPanel={
            userDetail ? <UserSubscriptionsPanel subscriptions={userDetail.subscriptions} /> : null
          }
          devicesPanel={
            userDetail ? (
              <UserDevicesPanel
                userDevices={userDevices}
                isUserDevicesLoading={isUserDevicesLoading}
                onGoToActions={() => setDetailTab("actions")}
              />
            ) : null
          }
          actionsPanel={
            userDetail ? (
              <UserActionsPanel
                userDetail={userDetail}
                editEmail={editEmail}
                setEditEmail={setEditEmail}
                editPhone={editPhone}
                setEditPhone={setEditPhone}
                editMeta={editMeta}
                setEditMeta={setEditMeta}
                onResetFields={() => syncEditFields(userDetail)}
                onSaveProfile={handleSaveUser}
                issueSubId={issueSubId}
                setIssueSubId={setIssueSubId}
                issueServerId={issueServerId}
                setIssueServerId={setIssueServerId}
                issueDeviceName={issueDeviceName}
                setIssueDeviceName={setIssueDeviceName}
                issueDeliveryMode={issueDeliveryMode}
                setIssueDeliveryMode={setIssueDeliveryMode}
                onIssueDevice={handleIssueDevice}
                hasLegacyRelay={hasLegacyRelay}
                legacyRelayUnavailableReason={legacyRelayUnavailableReason}
                issueResponse={issueOk}
                issuePreviewOpen={issuePreviewOpen}
                onToggleIssuePreview={() => setIssuePreviewOpen((value) => !value)}
                onCopyIssuedConfig={() => void handleCopyIssuedConfig()}
                onOpenBan={() => {
                  if (!userDetail) return;
                  setBanUserId(userDetail.id);
                  setBanToken("");
                }}
                onUnban={handleUnban}
                onOpenDelete={() => {
                  if (!userDetail) return;
                  setDeleteUserId(userDetail.id);
                  setDeleteConfirm("");
                }}
                profileError={profileError}
                issueError={issueError}
                dangerError={dangerError}
                actionPending={actionPending}
              />
            ) : null
          }
        />
      </section>

      <ConfirmActionModal
        open={banUserId != null}
        title="Ban user"
        description="Enter the confirmation token to ban this user."
        confirmLabel="Ban user"
        pending={actionPending}
        value={banToken}
        onValueChange={setBanToken}
        onClose={() => {
          setBanUserId(null);
          setBanToken("");
        }}
        onConfirm={handleBanSubmit}
      />

      <ConfirmActionModal
        open={deleteUserId != null}
        title="Delete user"
        description="Enter the confirmation token to permanently delete this user and linked data."
        confirmLabel="Delete user"
        pending={actionPending}
        value={deleteConfirm}
        onValueChange={setDeleteConfirm}
        onClose={() => {
          setDeleteUserId(null);
          setDeleteConfirm("");
        }}
        onConfirm={handleDeleteSubmit}
      />
    </PageLayout>
  );
}
