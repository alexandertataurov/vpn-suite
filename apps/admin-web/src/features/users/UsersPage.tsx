import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/core/api/context";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { buildUsersPath } from "@/hooks/useUsers";
import { deviceKeys } from "@/features/devices/services/device.query-keys";
import { userKeys } from "@/features/users/services/user.query-keys";
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  Modal,
  Skeleton,
} from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { PageErrorState, PageLoadingState } from "@/layout/PageStates";
import { CardTitle, MetaText } from "@/design-system/typography";

/** Telegram user requisites from backend User.meta.tg (WebApp/bot). */
interface TgRequisites {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
  allows_write_to_pm?: boolean;
}

function getTgRequisites(meta: Record<string, unknown> | null | undefined): TgRequisites | null {
  const tg = meta?.tg;
  if (!tg || typeof tg !== "object" || Array.isArray(tg)) return null;
  return tg as TgRequisites;
}

interface UserOut {
  id: number;
  tg_id: number;
  email: string | null;
  phone: string | null;
  meta: Record<string, unknown> | null;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionOut {
  id: string;
  plan_id: string;
  status: string;
  valid_from: string;
  valid_until: string;
  device_limit: number;
}

interface UserDetail extends UserOut {
  subscriptions: SubscriptionOut[];
}

interface UserListOut {
  items: UserOut[];
  total: number;
}

interface UserDeviceListItem {
  id: string;
  subscription_id: string;
  server_id: string;
  delivery_mode: "awg_native" | "wireguard_universal" | "legacy_wg_via_relay" | null;
  client_facing_server_id: string | null;
  upstream_server_id: string | null;
  device_name: string | null;
  public_key: string;
  allowed_ips: string | null;
  issued_at: string;
  revoked_at: string | null;
  suspended_at: string | null;
  data_limit_bytes: number | null;
  expires_at: string | null;
  created_at: string;
  apply_status: string | null;
  last_error: string | null;
  protocol_version: string | null;
}

interface UserDeviceListOut {
  items: UserDeviceListItem[];
  total: number;
}

interface IssueServerListItem {
  id: string;
  is_active: boolean;
  kind?: "awg_node" | "legacy_wg_relay";
}

interface IssueServerListOut {
  items: IssueServerListItem[];
  total: number;
}

interface IssueResponse {
  device_id: string;
  issued_at: string;
  server_id: string;
  delivery_mode: "awg_native" | "wireguard_universal" | "legacy_wg_via_relay" | null;
  client_facing_server_id: string | null;
  upstream_server_id: string | null;
  subscription_id: string;
  node_mode: string;
  peer_created: boolean;
  config: string | null;
  config_awg: string | null;
  config_wg_obf: string | null;
  config_wg: string | null;
}

type DeliveryMode = "awg_native" | "wireguard_universal" | "legacy_wg_via_relay";

function formatDeliveryMode(mode: DeliveryMode | null | undefined): string {
  if (mode === "legacy_wg_via_relay") return "Legacy WG via relay";
  if (mode === "wireguard_universal") return "Plain WG";
  return "AmneziaWG";
}

function getIssuedConfigText(issue: IssueResponse | null): string | null {
  if (!issue) return null;
  if (issue.delivery_mode === "legacy_wg_via_relay" || issue.delivery_mode === "wireguard_universal") {
    return issue.config_wg ?? issue.config ?? null;
  }
  return issue.config_awg ?? issue.config ?? issue.config_wg ?? null;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return d.toLocaleDateString();
}

type BannedFilter = "all" | "true" | "false";

function getUserDeviceStatus(device: UserDeviceListItem): "active" | "suspended" | "revoked" {
  if (device.revoked_at) return "revoked";
  if (device.suspended_at) return "suspended";
  return "active";
}

function statusVariant(status: "active" | "suspended" | "revoked"): "success" | "warning" | "danger" {
  if (status === "revoked") return "danger";
  if (status === "suspended") return "warning";
  return "success";
}

export function UsersPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const limit = 50;
  const [offset, setOffset] = useState(0);

  const [draft, setDraft] = useState<{ tgId: string; email: string; phone: string; isBanned: BannedFilter }>({
    tgId: "",
    email: "",
    phone: "",
    isBanned: "all",
  });
  const [applied, setApplied] = useState(draft);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [lastSelectedUserId, setLastSelectedUserId] = useState<number | null>(null);
  const [banUserId, setBanUserId] = useState<number | null>(null);
  const [banToken, setBanToken] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [issueOk, setIssueOk] = useState<IssueResponse | null>(null);

  const listPath = useMemo(
    () =>
      buildUsersPath({
        limit,
        offset,
        tgId: applied.tgId,
        email: applied.email,
        phone: applied.phone,
        isBanned: applied.isBanned,
      }),
    [applied.email, applied.isBanned, applied.phone, applied.tgId, limit, offset]
  );

  const {
    data: userList,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useApiQuery<UserListOut>([...userKeys.list(listPath)], listPath, { retry: 1, staleTime: 15_000 });

  const { data: userDetail, isLoading: isUserLoading } = useApiQuery<UserDetail>(
    [...userKeys.detail(selectedUserId ?? 0)],
    `/users/${selectedUserId!}`,
    { enabled: !!selectedUserId, retry: 0 }
  );

  const { data: userDevices, isLoading: isUserDevicesLoading } = useApiQuery<UserDeviceListOut>(
    [...userKeys.devices(selectedUserId ?? 0)],
    `/users/${selectedUserId!}/devices?limit=50&offset=0`,
    { enabled: !!selectedUserId, retry: 0, staleTime: 10_000 }
  );

  const { data: issueServers } = useApiQuery<IssueServerListOut>(
    ["users-issue-servers", "active"],
    "/servers?limit=200&offset=0&is_active=true",
    { enabled: !!selectedUserId, retry: 0, staleTime: 30_000 }
  );

  const invalidateUsers = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...userKeys.lists()] });
    if (selectedUserId) void queryClient.invalidateQueries({ queryKey: [...userKeys.detail(selectedUserId)] });
    if (selectedUserId) void queryClient.invalidateQueries({ queryKey: [...userKeys.devices(selectedUserId)] });
  }, [queryClient, selectedUserId]);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>) => {
      setActionError(null);
      setActionPending(true);
      try {
        await fn();
        invalidateUsers();
        void refetchUsers();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setActionPending(false);
      }
    },
    [invalidateUsers, refetchUsers]
  );

  const closeUserModal = useCallback(() => {
    setSelectedUserId(null);
    setActionError(null);
    setIssueOk(null);
    setIssueSubId("");
    setIssueServerId("");
    setIssueDeviceName("");
    setIssueDeliveryMode("awg_native");
  }, []);

  useEffect(() => {
    if (!userDetail) return;
    setIssueSubId((current) => current || userDetail.subscriptions[0]?.id || "");
  }, [userDetail]);

  const rows = useMemo(() => {
    const items = userList?.items ?? [];
    return items.map((u) => {
      const tg = getTgRequisites(u.meta ?? null);
      const tgDisplay =
        tg?.username ? `@${tg.username}` : [tg?.first_name, tg?.last_name].filter(Boolean).join(" ") || "—";
      const rowStatus = u.is_banned ? "revoked" : "active";
      return {
        id: String(u.id),
        tg: u.tg_id,
        tg_user: (
          <div className="users-page__row-cell">
            <span>{tgDisplay}</span>
            <MetaText className="users-page__row-meta">#{u.id}</MetaText>
          </div>
        ),
        email: u.email ?? "—",
        phone: u.phone ?? "—",
        status: (
          <Badge variant={u.is_banned ? "danger" : "success"} size="sm">
            {u.is_banned ? "Banned" : "Active"}
          </Badge>
        ),
        created: (
          <div className="users-page__row-cell">
            <span>{formatRelative(u.created_at)}</span>
            <MetaText className="users-page__row-meta">Updated {formatRelative(u.updated_at)}</MetaText>
          </div>
        ),
        statusKind: rowStatus,
        actions: (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              setSelectedUserId(u.id);
              setLastSelectedUserId(u.id);
            }}
          >
            Open profile
          </Button>
        ),
      };
    });
  }, [userList?.items]);

  const userMetaText = useMemo(() => {
    if (!userDetail) return "";
    try {
      return JSON.stringify(userDetail.meta ?? {}, null, 2);
    } catch {
      return "{}";
    }
  }, [userDetail]);

  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editMeta, setEditMeta] = useState("");

  const syncEditFields = useCallback(() => {
    if (!userDetail) return;
    setEditEmail(userDetail.email ?? "");
    setEditPhone(userDetail.phone ?? "");
    setEditMeta(userMetaText);
  }, [userDetail, userMetaText]);

  const handleSaveUser = useCallback(() => {
    if (!userDetail) return;
    let metaObj: Record<string, unknown> | null = null;
    try {
      metaObj = editMeta.trim() ? (JSON.parse(editMeta) as Record<string, unknown>) : {};
    } catch {
      setActionError("Meta must be valid JSON");
      return;
    }
    runAction(() =>
      api.patch(`/users/${userDetail.id}`, {
        email: editEmail.trim() ? editEmail.trim() : null,
        phone: editPhone.trim() ? editPhone.trim() : null,
        meta: metaObj,
      })
    );
  }, [api, editEmail, editMeta, editPhone, runAction, userDetail]);

  const handleUnban = useCallback(() => {
    if (!userDetail) return;
    runAction(() => api.patch(`/users/${userDetail.id}`, { is_banned: false }));
  }, [api, runAction, userDetail]);

  const handleBanSubmit = useCallback(() => {
    if (!banUserId) return;
    runAction(() => api.patch(`/users/${banUserId}`, { is_banned: true, confirm_token: banToken }));
    setBanUserId(null);
    setBanToken("");
  }, [api, banToken, banUserId, runAction]);

  const handleDeleteSubmit = useCallback(() => {
    if (!deleteUserId) return;
    const token = deleteConfirm.trim();
    runAction(() =>
      api.request(`/users/${deleteUserId}`, {
        method: "DELETE",
        body: JSON.stringify({ confirm_token: token }),
      })
    );
    setDeleteUserId(null);
    setDeleteConfirm("");
    setSelectedUserId(null);
  }, [api, deleteConfirm, deleteUserId, runAction]);

  const [issueSubId, setIssueSubId] = useState("");
  const [issueServerId, setIssueServerId] = useState("");
  const [issueDeviceName, setIssueDeviceName] = useState("");
  const [issueDeliveryMode, setIssueDeliveryMode] = useState<DeliveryMode>("awg_native");

  const hasLegacyRelay = useMemo(
    () => (issueServers?.items ?? []).some((server) => server.is_active && server.kind === "legacy_wg_relay"),
    [issueServers?.items]
  );
  const legacyRelayUnavailableReason = hasLegacyRelay
    ? null
    : "Legacy WG via relay is unavailable: no active relay servers are configured in Servers.";

  const handleIssueDevice = useCallback(() => {
    if (!userDetail) return;
    setIssueOk(null);
    const subId = issueSubId.trim();
    if (!subId) {
      setActionError("Subscription id is required to issue a device");
      return;
    }
    if (issueDeliveryMode === "legacy_wg_via_relay" && !hasLegacyRelay) {
      setActionError(legacyRelayUnavailableReason);
      return;
    }
    runAction(async () => {
      const res = await api.post<IssueResponse>(`/users/${userDetail.id}/devices/issue`, {
        subscription_id: subId,
        server_id: issueServerId.trim() || null,
        device_name: issueDeviceName.trim() || null,
        delivery_mode: issueDeliveryMode,
      });
      setIssueOk(res);
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
      setActionError("Issued response did not include a config payload");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setActionError("Failed to copy config to clipboard");
    }
  }, [issueOk]);

  const total = userList?.total ?? 0;
  const selectedSummaryUser = useMemo(
    () => (userList?.items ?? []).find((u) => u.id === lastSelectedUserId) ?? null,
    [lastSelectedUserId, userList?.items]
  );
  const userDeviceSummary = useMemo(() => {
    const items = userDevices?.items ?? [];
    return items.reduce(
      (acc, device) => {
        const status = getUserDeviceStatus(device);
        acc[status] += 1;
        return acc;
      },
      { active: 0, suspended: 0, revoked: 0 }
    );
  }, [userDevices?.items]);
  const userSubscriptionSummary = useMemo(() => {
    const items = userDetail?.subscriptions ?? [];
    return items.reduce<Record<string, number>>((acc, sub) => {
      acc[sub.status] = (acc[sub.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [userDetail?.subscriptions]);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const usersActions = (
    <>
      <MetaText className="users-page__pager-meta">
        {total > 0 ? `${offset + 1}-${Math.min(offset + limit, total)} of ${total}` : "0 users"}
      </MetaText>
      <Button type="button" variant="default" disabled={!canPrev} onClick={() => setOffset((v) => Math.max(0, v - limit))}>
        Prev
      </Button>
      <Button type="button" variant="default" disabled={!canNext} onClick={() => setOffset((v) => v + limit)}>
        Next
      </Button>
    </>
  );

  if (isUsersLoading) {
    return <PageLoadingState title="Users" pageClass="users-page" bodyHeight={160} />;
  }

  if (isUsersError) {
    const message = usersError instanceof Error ? usersError.message : "Users data is unavailable right now.";
    return (
      <PageErrorState title="Users" pageClass="users-page" message={message} onRetry={() => void refetchUsers()} />
    );
  }

  return (
    <PageLayout title="Users" actions={usersActions} pageClass="users-page">
      <CardTitle as="h2" className="users-page__block-title">
        Filters
      </CardTitle>
      <Card variant="outlined">
        <div className="users-page__filters">
          <label className="users-page__filter">
            TG ID
            <Input size="sm" value={draft.tgId} onChange={(e) => setDraft((s) => ({ ...s, tgId: e.target.value }))} placeholder="e.g. 123456" />
          </label>
          <label className="users-page__filter">
            Email
            <Input size="sm" value={draft.email} onChange={(e) => setDraft((s) => ({ ...s, email: e.target.value }))} placeholder="search email" />
          </label>
          <label className="users-page__filter">
            Phone
            <Input size="sm" value={draft.phone} onChange={(e) => setDraft((s) => ({ ...s, phone: e.target.value }))} placeholder="search phone" />
          </label>
          <label className="users-page__filter">
            Status
            <select
              className="input users-page__select"
              value={draft.isBanned}
              onChange={(e) => setDraft((s) => ({ ...s, isBanned: e.target.value as BannedFilter }))}
            >
              <option value="all">All</option>
              <option value="false">Active</option>
              <option value="true">Banned</option>
            </select>
          </label>
          <div className="users-page__filter-actions">
            <Button
              type="button"
              onClick={() => {
                setOffset(0);
                setApplied(draft);
              }}
            >
              Apply
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                const reset = { tgId: "", email: "", phone: "", isBanned: "all" as const };
                setDraft(reset);
                setApplied(reset);
                setOffset(0);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <CardTitle as="h2" className="users-page__block-title">
        Users list
      </CardTitle>
      {rows.length > 0 ? (
        <section className="users-page__table" aria-label="Users list">
          <div className="data-table-wrap">
          <DataTable
            density="compact"
            columns={[
              { key: "tg", header: "TG ID" },
                  { key: "tg_user", header: "TG user" },
                  { key: "email", header: "Email" },
                  { key: "phone", header: "Phone" },
                  { key: "status", header: "Status" },
                  { key: "created", header: "Created" },
              { key: "actions", header: "Actions" },
            ]}
            rows={rows}
            getRowKey={(row: { id: string }) => row.id}
            getRowClassName={(row: { statusKind: string }) =>
              row.statusKind === "revoked" ? "row-danger" : "row-success"
            }
          />
          </div>
        </section>
      ) : (
        <EmptyState message="No users match these filters. Adjust search criteria and try again." />
      )}

      <CardTitle as="h2" className="users-page__block-title">
        Selection detail
      </CardTitle>
      <Card variant="outlined">
        {selectedSummaryUser ? (
          <div className="users-page__selection">
            <div className="users-page__selection-main">
              <div className="users-page__selection-name">
                {selectedSummaryUser.email || `User #${selectedSummaryUser.id}`}
              </div>
              <MetaText>
                TG {selectedSummaryUser.tg_id} · created {formatRelative(selectedSummaryUser.created_at)}
              </MetaText>
            </div>
            <div className="users-page__selection-actions">
              <Badge variant={selectedSummaryUser.is_banned ? "danger" : "success"} size="sm">
                {selectedSummaryUser.is_banned ? "Banned" : "Active"}
              </Badge>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  setSelectedUserId(selectedSummaryUser.id);
                  setLastSelectedUserId(selectedSummaryUser.id);
                }}
              >
                Open profile
              </Button>
            </div>
          </div>
        ) : (
          <MetaText>Select a user from the table to inspect profile, subscriptions, and device health.</MetaText>
        )}
      </Card>

      <Modal
        open={!!selectedUserId}
        onClose={closeUserModal}
        title={userDetail ? `User #${userDetail.id}` : "User details"}
      >
        {selectedUserId && (
          <div className="users-page__detail">
            {(isUserLoading || !userDetail) && <Skeleton height={120} />}
            {userDetail && (
              <>
                <CardTitle as="h3" className="users-page__section-title">
                  Identity + status snapshot
                </CardTitle>
                <div className="users-page__detail-top">
                  <dl className="users-page__detail-dl">
                    <dt>ID</dt>
                    <dd>{userDetail.id}</dd>
                    <dt>TG</dt>
                    <dd>{userDetail.tg_id}</dd>
                    <dt>Status</dt>
                    <dd>
                      <Badge variant={userDetail.is_banned ? "danger" : "success"} size="sm">
                        {userDetail.is_banned ? "Banned" : "Active"}
                      </Badge>
                    </dd>
                    <dt>Created</dt>
                    <dd>{formatRelative(userDetail.created_at)}</dd>
                    <dt>Updated</dt>
                    <dd>{formatRelative(userDetail.updated_at)}</dd>
                  </dl>
                </div>

                {actionError && (
                  <p className="users-page__detail-error" role="alert">
                    {actionError}
                  </p>
                )}

                <CardTitle as="h3" className="users-page__section-title">
                  Operational context
                </CardTitle>
                <div className="users-page__operational-grid">
                  <div className="users-page__operational-card">
                    <MetaText>Subscriptions</MetaText>
                    {Object.entries(userSubscriptionSummary).length > 0 ? (
                      <div className="users-page__badge-row">
                        {Object.entries(userSubscriptionSummary).map(([status, count]) => (
                          <Badge key={status} size="sm" variant={status === "active" ? "success" : "warning"}>
                            {status}: {count}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <MetaText>No subscriptions</MetaText>
                    )}
                  </div>
                  <div className="users-page__operational-card">
                    <MetaText>Devices</MetaText>
                    <div className="users-page__badge-row">
                      <Badge size="sm" variant="success">
                        active: {userDeviceSummary.active}
                      </Badge>
                      <Badge size="sm" variant="warning">
                        suspended: {userDeviceSummary.suspended}
                      </Badge>
                      <Badge size="sm" variant="danger">
                        revoked: {userDeviceSummary.revoked}
                      </Badge>
                    </div>
                  </div>
                </div>

                {(() => {
                  const tg = getTgRequisites(userDetail.meta ?? null);
                  if (!tg) return null;
                  return (
                    <>
                      <CardTitle as="h3" className="users-page__section-title">
                        Telegram
                      </CardTitle>
                      <dl className="users-page__detail-dl users-page__detail-dl--tg">
                        {tg.first_name != null && (
                          <>
                            <dt>First name</dt>
                            <dd>{tg.first_name}</dd>
                          </>
                        )}
                        {tg.last_name != null && tg.last_name !== "" && (
                          <>
                            <dt>Last name</dt>
                            <dd>{tg.last_name}</dd>
                          </>
                        )}
                        {tg.username != null && (
                          <>
                            <dt>Username</dt>
                            <dd>@{tg.username}</dd>
                          </>
                        )}
                        {tg.language_code != null && (
                          <>
                            <dt>Language</dt>
                            <dd>{tg.language_code}</dd>
                          </>
                        )}
                        {tg.is_premium != null && (
                          <>
                            <dt>Premium</dt>
                            <dd>{tg.is_premium ? "Yes" : "No"}</dd>
                          </>
                        )}
                        {tg.photo_url != null && (
                          <>
                            <dt>Photo</dt>
                            <dd>
                              <a href={tg.photo_url} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </dd>
                          </>
                        )}
                        {tg.allows_write_to_pm != null && (
                          <>
                            <dt>Allows write to PM</dt>
                            <dd>{tg.allows_write_to_pm ? "Yes" : "No"}</dd>
                          </>
                        )}
                      </dl>
                    </>
                  );
                })()}

                <CardTitle as="h3" className="users-page__section-title">
                  Profile edit
                </CardTitle>
                <div className="users-page__edit-grid">
                  <label className="users-page__filter">
                    Email
                    <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email" />
                  </label>
                  <label className="users-page__filter">
                    Phone
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="phone" />
                  </label>
                  <label className="users-page__filter users-page__filter--full">
                    Meta (JSON)
                    <textarea
                      className="input users-page__textarea"
                      value={editMeta}
                      onChange={(e) => setEditMeta(e.target.value)}
                      rows={6}
                    />
                  </label>
                  <div className="users-page__filter-actions users-page__filter-actions--full">
                    <Button type="button" variant="default" onClick={syncEditFields} disabled={actionPending}>
                      Reset fields
                    </Button>
                    <Button type="button" onClick={handleSaveUser} disabled={actionPending}>
                      Save
                    </Button>
                  </div>
                </div>

                <CardTitle as="h3" className="users-page__section-title">
                  Account actions
                </CardTitle>
                <div className="users-page__danger-zone">
                  <MetaText className="users-page__muted">
                    Destructive actions require confirmation tokens and should be used only for verified incidents.
                  </MetaText>
                  <div className="users-page__detail-actions">
                    {!userDetail.is_banned ? (
                      <Button
                        type="button"
                        variant="danger"
                        disabled={actionPending}
                        onClick={() => {
                          setBanUserId(userDetail.id);
                          setBanToken("");
                        }}
                      >
                        Ban user
                      </Button>
                    ) : (
                      <Button type="button" variant="default" disabled={actionPending} onClick={handleUnban}>
                        Unban user
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="danger"
                      disabled={actionPending}
                      onClick={() => {
                        setDeleteUserId(userDetail.id);
                        setDeleteConfirm("");
                      }}
                    >
                      Delete user
                    </Button>
                  </div>
                </div>

                <CardTitle as="h3" className="users-page__section-title">
                  Subscriptions
                </CardTitle>
                {userDetail.subscriptions.length > 0 ? (
                  <div className="data-table-wrap">
                  <DataTable
                    density="compact"
                    columns={[
                      { key: "id", header: "ID" },
                      { key: "plan_id", header: "Plan" },
                      { key: "status", header: "Status" },
                      { key: "valid_until", header: "Valid until" },
                      { key: "device_limit", header: "Device limit" },
                    ]}
                    rows={userDetail.subscriptions.map((s) => ({
                      ...s,
                      valid_until: formatRelative(s.valid_until),
                    }))}
                    getRowKey={(row: { id: string }) => row.id}
                  />
                  </div>
                ) : (
                  <p className="users-page__muted">No subscriptions.</p>
                )}

                <CardTitle as="h3" className="users-page__section-title">
                  Issue device
                </CardTitle>
                <div className="users-page__issue-grid">
                  <label className="users-page__filter">
                    Subscription ID
                    <Input
                      value={issueSubId}
                      onChange={(e) => setIssueSubId(e.target.value)}
                      placeholder={userDetail.subscriptions[0]?.id ? `e.g. ${userDetail.subscriptions[0]?.id}` : "subscription id"}
                    />
                    <MetaText className="users-page__muted">
                      Use an active subscription ID. The first active plan is preselected when available.
                    </MetaText>
                  </label>
                  <label className="users-page__filter">
                    Server ID (optional)
                    <Input value={issueServerId} onChange={(e) => setIssueServerId(e.target.value)} placeholder="leave empty for auto" />
                  </label>
                  <label className="users-page__filter">
                    Device name (optional)
                    <Input value={issueDeviceName} onChange={(e) => setIssueDeviceName(e.target.value)} placeholder="e.g. iphone" />
                  </label>
                  <label className="users-page__filter">
                    Delivery mode
                    <select
                      className="input users-page__select"
                      value={issueDeliveryMode}
                      onChange={(e) => setIssueDeliveryMode(e.target.value as DeliveryMode)}
                    >
                      <option value="awg_native">AmneziaWG</option>
                      <option value="wireguard_universal">Plain WireGuard</option>
                      <option value="legacy_wg_via_relay" disabled={!hasLegacyRelay}>
                        Legacy WG via relay
                      </option>
                    </select>
                    {!hasLegacyRelay && (
                      <MetaText className="users-page__muted">
                        {legacyRelayUnavailableReason}
                      </MetaText>
                    )}
                    <MetaText className="users-page__muted">
                      AmneziaWG is the default. Use Plain WireGuard for compatibility clients.
                    </MetaText>
                  </label>
                  <div className="users-page__filter-actions">
                    <Button type="button" onClick={handleIssueDevice} disabled={actionPending}>
                      Issue device
                    </Button>
                  </div>
                </div>
                {issueOk && (
                  <div className="users-page__issue-result">
                    <p className="users-page__muted">
                      Issued device <strong>{issueOk.device_id}</strong> ({formatRelative(issueOk.issued_at)}).
                    </p>
                    <dl className="users-page__detail-dl users-page__detail-dl--tg">
                      <dt>Mode</dt>
                      <dd>{formatDeliveryMode(issueOk.delivery_mode)}</dd>
                      <dt>Server</dt>
                      <dd>{issueOk.server_id}</dd>
                      <dt>Client-facing</dt>
                      <dd>{issueOk.client_facing_server_id ?? "—"}</dd>
                      <dt>Upstream</dt>
                      <dd>{issueOk.upstream_server_id ?? "—"}</dd>
                    </dl>
                    <div className="users-page__filter-actions users-page__filter-actions--full">
                      <Button type="button" variant="default" onClick={() => void handleCopyIssuedConfig()}>
                        Copy issued config
                      </Button>
                    </div>
                    {getIssuedConfigText(issueOk) && (
                      <label className="users-page__filter users-page__filter--full">
                        Config preview
                        <textarea
                          className="input users-page__textarea"
                          readOnly
                          value={getIssuedConfigText(issueOk) ?? ""}
                          rows={10}
                        />
                      </label>
                    )}
                  </div>
                )}

                <CardTitle as="h3" className="users-page__section-title">
                  Devices
                </CardTitle>
                {isUserDevicesLoading && <Skeleton height={120} />}
                {!isUserDevicesLoading && userDevices && userDevices.items.length > 0 ? (
                  <div className="data-table-wrap">
                  <DataTable
                    density="compact"
                    columns={[
                      { key: "status", header: "Status" },
                      { key: "device", header: "Device" },
                      { key: "server_id", header: "Server" },
                      { key: "delivery_mode", header: "Mode" },
                      { key: "issued_at", header: "Issued" },
                      { key: "last_event", header: "Last event" },
                      { key: "apply_status", header: "Apply" },
                    ]}
                    rows={userDevices.items.map((d) => ({
                      id: d.id,
                      status: (
                        <Badge variant={statusVariant(getUserDeviceStatus(d))} size="sm">
                          {getUserDeviceStatus(d)}
                        </Badge>
                      ),
                      device: d.device_name || d.id,
                      server_id: d.server_id,
                      delivery_mode: formatDeliveryMode(d.delivery_mode),
                      issued_at: formatRelative(d.issued_at),
                      last_event: formatRelative(d.revoked_at ?? d.suspended_at ?? d.created_at),
                      apply_status: d.apply_status ?? "—",
                    }))}
                    getRowKey={(row: { id: string }) => row.id}
                  />
                  </div>
                ) : (
                  <p className="users-page__muted">No devices.</p>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={banUserId != null}
        onClose={() => {
          setBanUserId(null);
          setBanToken("");
        }}
        title="Ban user"
      >
        <p className="users-page__muted">Enter the confirmation token to ban this user.</p>
        <label className="users-page__filter">
          Confirm token
          <Input type="password" value={banToken} onChange={(e) => setBanToken(e.target.value)} placeholder="Token" />
        </label>
        <div className="users-page__modal-actions">
          <Button
            type="button"
            variant="default"
            onClick={() => {
              setBanUserId(null);
              setBanToken("");
            }}
          >
            Cancel
          </Button>
          <Button type="button" variant="danger" disabled={!banToken.trim() || actionPending} onClick={handleBanSubmit}>
            Ban
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteUserId != null}
        onClose={() => {
          setDeleteUserId(null);
          setDeleteConfirm("");
        }}
        title="Delete user"
      >
        <p className="users-page__muted">
          This permanently deletes the user and related data. Enter the delete confirmation token (from backend env) to confirm.
        </p>
        <label className="users-page__filter">
          Confirm token
          <Input
            type="password"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Delete confirmation token"
          />
        </label>
        <div className="users-page__modal-actions">
          <Button
            type="button"
            variant="default"
            onClick={() => {
              setDeleteUserId(null);
              setDeleteConfirm("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!deleteConfirm.trim() || actionPending}
            onClick={handleDeleteSubmit}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </PageLayout>
  );
}
