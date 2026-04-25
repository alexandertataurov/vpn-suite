import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  Input,
  Modal,
  SectionHeader,
  Skeleton,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
} from "@/design-system/primitives";
import { CardTitle, MetaText } from "@/design-system/typography";
import type { SubscriptionOut, UserDetail, UserOut } from "@/shared/types/admin-api";
import type { UserDeviceListOut } from "@/hooks/useUsers";

export interface TgRequisites {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
  allows_write_to_pm?: boolean;
}

export interface IssueServerListItem {
  id: string;
  is_active: boolean;
  region?: string | null;
  kind?: "awg_node" | "legacy_wg_relay";
}

export interface IssueResponse {
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

export type DeliveryMode = "awg_native" | "wireguard_universal" | "legacy_wg_via_relay";
export type BannedFilter = "all" | "true" | "false";
export type UserDetailTab = "overview" | "subscriptions" | "devices" | "actions";

export function getTgRequisites(meta: Record<string, unknown> | null | undefined): TgRequisites | null {
  const tg = meta?.tg;
  if (!tg || typeof tg !== "object" || Array.isArray(tg)) return null;
  return tg as TgRequisites;
}

export function formatDeliveryMode(mode: DeliveryMode | null | undefined): string {
  if (mode === "legacy_wg_via_relay") return "Legacy WG via relay";
  if (mode === "wireguard_universal") return "Plain WG";
  return "AmneziaWG";
}

export function getIssuedConfigText(issue: IssueResponse | null): string | null {
  if (!issue) return null;
  if (issue.delivery_mode === "legacy_wg_via_relay" || issue.delivery_mode === "wireguard_universal") {
    return issue.config_wg ?? issue.config ?? null;
  }
  return issue.config_awg ?? issue.config ?? issue.config_wg ?? null;
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return date.toLocaleDateString();
}

export function getUserDeviceStatus(
  device: UserDeviceListOut["items"][number]
): "active" | "suspended" | "revoked" {
  if (device.revoked_at) return "revoked";
  if (device.suspended_at) return "suspended";
  return "active";
}

export function statusVariant(
  status: "active" | "suspended" | "revoked"
): "success" | "warning" | "danger" {
  if (status === "revoked") return "danger";
  if (status === "suspended") return "warning";
  return "success";
}

export interface UserFiltersState {
  search: string;
  isBanned: BannedFilter;
  planId: string;
  region: string;
}

interface UsersFilterBarProps {
  draft: UserFiltersState;
  onDraftChange: Dispatch<SetStateAction<UserFiltersState>>;
  onApply: () => void;
  onReset: () => void;
  planOptions: string[];
  regionOptions: string[];
}

export function UsersFilterBar({
  draft,
  onDraftChange,
  onApply,
  onReset,
  planOptions,
  regionOptions,
}: UsersFilterBarProps) {
  return (
    <Card variant="outlined">
      <div className="users-page__toolbar">
        <label className="users-page__field users-page__field--search">
          Search
          <Input
            size="sm"
            value={draft.search}
            onChange={(event) =>
              onDraftChange((state) => ({ ...state, search: event.target.value }))
            }
            placeholder="TG ID, email, or phone"
            aria-label="User search"
          />
          <MetaText className="users-page__muted">
            Numeric values target TG ID; values with &quot;+&quot; target phone; everything else targets email.
          </MetaText>
        </label>

        <label className="users-page__field">
          Status
          <select
            className="input users-page__select"
            value={draft.isBanned}
            onChange={(event) =>
              onDraftChange((state) => ({
                ...state,
                isBanned: event.target.value as BannedFilter,
              }))
            }
            aria-label="Status"
          >
            <option value="all">All</option>
            <option value="false">Active</option>
            <option value="true">Banned</option>
          </select>
        </label>

        <label className="users-page__field">
          Plan
          <select
            className="input users-page__select"
            value={draft.planId}
            onChange={(event) =>
              onDraftChange((state) => ({ ...state, planId: event.target.value }))
            }
            aria-label="Plan"
          >
            <option value="">All plans</option>
            {planOptions.map((planId) => (
              <option key={planId} value={planId}>
                {planId}
              </option>
            ))}
          </select>
        </label>

        <label className="users-page__field">
          Region
          <select
            className="input users-page__select"
            value={draft.region}
            onChange={(event) =>
              onDraftChange((state) => ({ ...state, region: event.target.value }))
            }
            aria-label="Region"
          >
            <option value="">All regions</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <div className="users-page__toolbar-actions">
          <Button type="button" onClick={onApply}>
            Apply
          </Button>
          <Button type="button" variant="default" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface UsersListPaneProps {
  rows: Array<Record<string, ReactNode> & { id: string; isSelected?: boolean }>;
  total: number;
  offset: number;
  limit: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function UsersListPane({
  rows,
  total,
  offset,
  limit,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: UsersListPaneProps) {
  return (
    <Card variant="outlined" className="users-page__pane users-page__pane--list">
      <div className="users-page__pane-head">
        <SectionHeader
          label="Users"
          note={total > 0 ? `${offset + 1}-${Math.min(offset + limit, total)} of ${total}` : "0 users"}
        />
        <div className="users-page__pager">
          <Button type="button" variant="default" size="sm" onClick={onPrev} disabled={!canPrev}>
            Prev
          </Button>
          <Button type="button" variant="default" size="sm" onClick={onNext} disabled={!canNext}>
            Next
          </Button>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="data-table-wrap users-page__table-wrap" aria-label="Users list">
          <DataTable
            density="compact"
            columns={[
              { key: "user", header: "User" },
              { key: "status", header: "Status" },
              { key: "context", header: "Context" },
              { key: "action", header: "Inspect" },
            ]}
            rows={rows}
            getRowKey={(row) => row.id}
            getRowClassName={(row) => (row.isSelected ? "users-page__row users-page__row--active" : "users-page__row")}
          />
        </div>
      ) : (
        <EmptyState message="No users match these filters. Adjust the search or filter scope." />
      )}
    </Card>
  );
}

interface UserDetailWorkspaceProps {
  open: boolean;
  desktop: boolean;
  selectedUserId: number | null;
  selectedSummary: UserOut | null;
  userDetail: UserDetail | undefined;
  isUserLoading: boolean;
  userDevices: UserDeviceListOut | undefined;
  isUserDevicesLoading: boolean;
  detailTab: UserDetailTab;
  onDetailTabChange: (value: UserDetailTab) => void;
  onClose: () => void;
  overviewPanel: ReactNode;
  subscriptionsPanel: ReactNode;
  devicesPanel: ReactNode;
  actionsPanel: ReactNode;
}

function UserDetailWorkspaceContent({
  selectedSummary,
  userDetail,
  isUserLoading,
  detailTab,
  onDetailTabChange,
  overviewPanel,
  subscriptionsPanel,
  devicesPanel,
  actionsPanel,
}: Omit<UserDetailWorkspaceProps, "desktop" | "open" | "selectedUserId" | "onClose" | "userDevices" | "isUserDevicesLoading">) {
  const title = userDetail
    ? userDetail.email || getTgRequisites(userDetail.meta)?.username || `User #${userDetail.id}`
    : selectedSummary
      ? selectedSummary.email || `User #${selectedSummary.id}`
      : "Select a user";

  const subtitle = userDetail
    ? `TG ${userDetail.tg_id ?? "—"} · updated ${formatRelative(userDetail.updated_at)}`
    : selectedSummary
      ? `TG ${selectedSummary.tg_id ?? "—"} · updated ${formatRelative(selectedSummary.updated_at)}`
      : "Choose a row from the list to inspect subscriptions, devices, and account actions.";

  return (
    <div className="users-page__detail-shell" data-testid="user-detail-workspace">
      <div className="users-page__detail-head">
        <div className="users-page__detail-head-copy">
          <CardTitle as="h2">{title}</CardTitle>
          <MetaText>{subtitle}</MetaText>
        </div>
        {userDetail && (
          <Badge variant={userDetail.is_banned ? "danger" : "success"} size="sm">
            {userDetail.is_banned ? "Banned" : "Active"}
          </Badge>
        )}
      </div>

      {isUserLoading && !userDetail ? (
        <Skeleton height={320} />
      ) : userDetail ? (
        <Tabs value={detailTab} onValueChange={(value) => onDetailTabChange(value as UserDetailTab)}>
          <TabsList className="users-page__tabs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
          <TabsPanel value="overview">{overviewPanel}</TabsPanel>
          <TabsPanel value="subscriptions">{subscriptionsPanel}</TabsPanel>
          <TabsPanel value="devices">{devicesPanel}</TabsPanel>
          <TabsPanel value="actions">{actionsPanel}</TabsPanel>
        </Tabs>
      ) : (
        <div className="users-page__detail-empty">
          <EmptyState message="Select a user to open the operator workspace." />
        </div>
      )}
    </div>
  );
}

export function UserDetailWorkspace(props: UserDetailWorkspaceProps) {
  if (!props.desktop) {
    return (
      <Drawer
        open={props.open && props.selectedUserId != null}
        onClose={props.onClose}
        title={props.userDetail ? `User #${props.userDetail.id}` : "User detail"}
        size="lg"
        data-testid="users-detail-drawer"
      >
        <UserDetailWorkspaceContent
          selectedSummary={props.selectedSummary}
          userDetail={props.userDetail}
          isUserLoading={props.isUserLoading}
          detailTab={props.detailTab}
          onDetailTabChange={props.onDetailTabChange}
          overviewPanel={props.overviewPanel}
          subscriptionsPanel={props.subscriptionsPanel}
          devicesPanel={props.devicesPanel}
          actionsPanel={props.actionsPanel}
        />
      </Drawer>
    );
  }

  return (
    <Card variant="outlined" className="users-page__pane users-page__pane--detail">
      <UserDetailWorkspaceContent
        selectedSummary={props.selectedSummary}
        userDetail={props.userDetail}
        isUserLoading={props.isUserLoading}
        detailTab={props.detailTab}
        onDetailTabChange={props.onDetailTabChange}
        overviewPanel={props.overviewPanel}
        subscriptionsPanel={props.subscriptionsPanel}
        devicesPanel={props.devicesPanel}
        actionsPanel={props.actionsPanel}
      />
    </Card>
  );
}

interface UserOverviewPanelProps {
  userDetail: UserDetail;
  userDevices: UserDeviceListOut | undefined;
  isUserDevicesLoading: boolean;
  actionError: string | null;
}

export function UserOverviewPanel({
  userDetail,
  userDevices,
  isUserDevicesLoading,
  actionError,
}: UserOverviewPanelProps) {
  const tg = getTgRequisites(userDetail.meta);
  const userDeviceSummary = (userDevices?.items ?? []).reduce(
    (acc, device) => {
      const status = getUserDeviceStatus(device);
      acc[status] += 1;
      return acc;
    },
    { active: 0, suspended: 0, revoked: 0 }
  );

  const subscriptionSummary = userDetail.subscriptions.reduce<Record<string, number>>((acc, sub) => {
    const key = sub.effective_status || sub.status;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="users-page__panel-stack">
      {actionError && (
        <p className="users-page__detail-error" role="alert">
          {actionError}
        </p>
      )}

      <section className="users-page__summary-grid">
        <div className="users-page__summary-card">
          <MetaText className="users-page__summary-label">Identity</MetaText>
          <dl className="users-page__detail-dl">
            <dt>ID</dt>
            <dd>{userDetail.id}</dd>
            <dt>TG ID</dt>
            <dd>{userDetail.tg_id ?? "—"}</dd>
            <dt>Email</dt>
            <dd>{userDetail.email ?? "—"}</dd>
            <dt>Phone</dt>
            <dd>{userDetail.phone ?? "—"}</dd>
            <dt>Created</dt>
            <dd>{formatRelative(userDetail.created_at)}</dd>
            <dt>Updated</dt>
            <dd>{formatRelative(userDetail.updated_at)}</dd>
          </dl>
        </div>

        <div className="users-page__summary-card">
          <MetaText className="users-page__summary-label">Operational context</MetaText>
          <div className="users-page__badge-row">
            {Object.keys(subscriptionSummary).length > 0 ? (
              Object.entries(subscriptionSummary).map(([status, count]) => (
                <Badge
                  key={status}
                  size="sm"
                  variant={status === "active" ? "success" : status === "expired" ? "danger" : "warning"}
                >
                  {status}: {count}
                </Badge>
              ))
            ) : (
              <Badge size="sm" variant="neutral">
                No subscriptions
              </Badge>
            )}
          </div>
          {isUserDevicesLoading ? (
            <Skeleton height={72} />
          ) : (
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
          )}
        </div>
      </section>

      {tg && (
        <section className="users-page__section">
          <SectionHeader label="Telegram" />
          <dl className="users-page__detail-dl users-page__detail-dl--compact">
            <dt>Display</dt>
            <dd>
              {tg.username ? `@${tg.username}` : [tg.first_name, tg.last_name].filter(Boolean).join(" ") || "—"}
            </dd>
            <dt>Language</dt>
            <dd>{tg.language_code ?? "—"}</dd>
            <dt>Premium</dt>
            <dd>{tg.is_premium ? "Yes" : "No"}</dd>
            <dt>PM write</dt>
            <dd>{tg.allows_write_to_pm ? "Yes" : "No"}</dd>
            <dt>Photo</dt>
            <dd>
              {tg.photo_url ? (
                <a href={tg.photo_url} target="_blank" rel="noopener noreferrer">
                  Open photo
                </a>
              ) : (
                "—"
              )}
            </dd>
          </dl>
        </section>
      )}
    </div>
  );
}

interface UserSubscriptionsPanelProps {
  subscriptions: SubscriptionOut[];
}

export function UserSubscriptionsPanel({ subscriptions }: UserSubscriptionsPanelProps) {
  if (subscriptions.length === 0) {
    return <EmptyState message="No subscriptions are attached to this user." />;
  }

  const rows = subscriptions.map((subscription) => {
    const effectiveStatus = subscription.effective_status || subscription.status;
    return {
      id: subscription.id,
      plan: subscription.plan_id,
      status: (
        <Badge
          size="sm"
          variant={
            effectiveStatus === "active"
              ? "success"
              : effectiveStatus === "expired"
                ? "danger"
                : "warning"
          }
        >
          {effectiveStatus}
        </Badge>
      ),
      validity: (
        <div className="users-page__row-stack">
          <span>{formatRelative(subscription.valid_until)}</span>
          <MetaText>From {formatRelative(subscription.valid_from)}</MetaText>
        </div>
      ),
      device_limit: subscription.device_limit,
    };
  });

  return (
    <div className="data-table-wrap">
      <DataTable
        density="compact"
        columns={[
          { key: "plan", header: "Plan" },
          { key: "status", header: "Status" },
          { key: "validity", header: "Validity" },
          { key: "device_limit", header: "Device limit" },
        ]}
        rows={rows}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}

interface UserDevicesPanelProps {
  userDevices: UserDeviceListOut | undefined;
  isUserDevicesLoading: boolean;
  onGoToActions: () => void;
}

export function UserDevicesPanel({
  userDevices,
  isUserDevicesLoading,
  onGoToActions,
}: UserDevicesPanelProps) {
  if (isUserDevicesLoading) {
    return <Skeleton height={180} />;
  }

  if (!userDevices || userDevices.items.length === 0) {
    return (
      <div className="users-page__empty-panel">
        <EmptyState message="No devices have been issued yet." />
        <Button type="button" variant="default" onClick={onGoToActions}>
          Issue first device
        </Button>
      </div>
    );
  }

  const rows = userDevices.items.map((device) => ({
    id: device.id,
    status: (
      <Badge variant={statusVariant(getUserDeviceStatus(device))} size="sm">
        {getUserDeviceStatus(device)}
      </Badge>
    ),
    device: device.device_name || device.id,
    server_id: device.server_id,
    mode: formatDeliveryMode(device.delivery_mode),
    issued_at: formatRelative(device.issued_at),
    last_event: formatRelative(device.revoked_at ?? device.suspended_at ?? device.created_at),
    apply_status: device.apply_status ?? "—",
  }));

  return (
    <div className="data-table-wrap">
      <DataTable
        density="compact"
        columns={[
          { key: "status", header: "Status" },
          { key: "device", header: "Device" },
          { key: "server_id", header: "Server" },
          { key: "mode", header: "Mode" },
          { key: "issued_at", header: "Issued" },
          { key: "last_event", header: "Last event" },
          { key: "apply_status", header: "Apply" },
        ]}
        rows={rows}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}

interface UserActionsPanelProps {
  userDetail: UserDetail;
  editEmail: string;
  setEditEmail: (value: string) => void;
  editPhone: string;
  setEditPhone: (value: string) => void;
  editMeta: string;
  setEditMeta: (value: string) => void;
  onResetFields: () => void;
  onSaveProfile: () => void;
  issueSubId: string;
  setIssueSubId: (value: string) => void;
  issueServerId: string;
  setIssueServerId: (value: string) => void;
  issueDeviceName: string;
  setIssueDeviceName: (value: string) => void;
  issueDeliveryMode: DeliveryMode;
  setIssueDeliveryMode: (value: DeliveryMode) => void;
  onIssueDevice: () => void;
  hasLegacyRelay: boolean;
  legacyRelayUnavailableReason: string | null;
  issueResponse: IssueResponse | null;
  issuePreviewOpen: boolean;
  onToggleIssuePreview: () => void;
  onCopyIssuedConfig: () => void;
  onOpenBan: () => void;
  onUnban: () => void;
  onOpenDelete: () => void;
  profileError: string | null;
  issueError: string | null;
  dangerError: string | null;
  actionPending: boolean;
}

export function UserActionsPanel({
  userDetail,
  editEmail,
  setEditEmail,
  editPhone,
  setEditPhone,
  editMeta,
  setEditMeta,
  onResetFields,
  onSaveProfile,
  issueSubId,
  setIssueSubId,
  issueServerId,
  setIssueServerId,
  issueDeviceName,
  setIssueDeviceName,
  issueDeliveryMode,
  setIssueDeliveryMode,
  onIssueDevice,
  hasLegacyRelay,
  legacyRelayUnavailableReason,
  issueResponse,
  issuePreviewOpen,
  onToggleIssuePreview,
  onCopyIssuedConfig,
  onOpenBan,
  onUnban,
  onOpenDelete,
  profileError,
  issueError,
  dangerError,
  actionPending,
}: UserActionsPanelProps) {
  const issuedConfigText = getIssuedConfigText(issueResponse);

  return (
    <div className="users-page__panel-stack">
      <section className="users-page__section">
        <SectionHeader label="Profile edit" />
        {profileError && (
          <p className="users-page__detail-error" role="alert">
            {profileError}
          </p>
        )}
        <div className="users-page__form-grid">
          <label className="users-page__field">
            Email
            <Input value={editEmail} onChange={(event) => setEditEmail(event.target.value)} placeholder="email" />
          </label>
          <label className="users-page__field">
            Phone
            <Input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} placeholder="phone" />
          </label>
          <label className="users-page__field users-page__field--full">
            Meta (JSON)
            <textarea
              className="input users-page__textarea"
              value={editMeta}
              onChange={(event) => setEditMeta(event.target.value)}
              rows={8}
            />
          </label>
          <div className="users-page__toolbar-actions users-page__toolbar-actions--left">
            <Button type="button" variant="default" onClick={onResetFields} disabled={actionPending}>
              Reset fields
            </Button>
            <Button type="button" onClick={onSaveProfile} disabled={actionPending}>
              Save profile
            </Button>
          </div>
        </div>
      </section>

      <section className="users-page__section">
        <SectionHeader label="Issue device" />
        {issueError && (
          <p className="users-page__detail-error" role="alert">
            {issueError}
          </p>
        )}
        <div className="users-page__form-grid">
          <label className="users-page__field">
            Subscription ID
            <Input
              value={issueSubId}
              onChange={(event) => setIssueSubId(event.target.value)}
              placeholder={userDetail.subscriptions[0]?.id ?? "subscription id"}
            />
            <MetaText className="users-page__muted">
              Use an active subscription. The first available subscription is preselected.
            </MetaText>
          </label>
          <label className="users-page__field">
            Server ID
            <Input
              value={issueServerId}
              onChange={(event) => setIssueServerId(event.target.value)}
              placeholder="leave empty for auto placement"
            />
          </label>
          <label className="users-page__field">
            Device name
            <Input
              value={issueDeviceName}
              onChange={(event) => setIssueDeviceName(event.target.value)}
              placeholder="e.g. iphone"
            />
          </label>
          <label className="users-page__field">
            Delivery mode
            <select
              className="input users-page__select"
              value={issueDeliveryMode}
              onChange={(event) => setIssueDeliveryMode(event.target.value as DeliveryMode)}
            >
              <option value="awg_native">AmneziaWG</option>
              <option value="wireguard_universal">Plain WireGuard</option>
              <option value="legacy_wg_via_relay" disabled={!hasLegacyRelay}>
                Legacy WG via relay
              </option>
            </select>
            {!hasLegacyRelay && (
              <MetaText className="users-page__muted">{legacyRelayUnavailableReason}</MetaText>
            )}
          </label>
          <div className="users-page__toolbar-actions users-page__toolbar-actions--left">
            <Button type="button" onClick={onIssueDevice} disabled={actionPending}>
              Issue device
            </Button>
          </div>
        </div>

        {issueResponse && (
          <div className="users-page__issue-result">
            <div className="users-page__issue-result-copy">
              <CardTitle as="h3">Device issued</CardTitle>
              <MetaText>
                {issueResponse.device_id} on {issueResponse.server_id} · {formatRelative(issueResponse.issued_at)}
              </MetaText>
            </div>
            <div className="users-page__badge-row">
              <Badge size="sm" variant="success">
                {formatDeliveryMode(issueResponse.delivery_mode)}
              </Badge>
              {issueResponse.client_facing_server_id && (
                <Badge size="sm" variant="neutral">
                  client-facing: {issueResponse.client_facing_server_id}
                </Badge>
              )}
            </div>
            <div className="users-page__toolbar-actions users-page__toolbar-actions--left">
              <Button type="button" variant="default" onClick={onCopyIssuedConfig}>
                Copy issued config
              </Button>
              {issuedConfigText && (
                <Button type="button" variant="ghost" onClick={onToggleIssuePreview}>
                  {issuePreviewOpen ? "Hide config preview" : "Show config preview"}
                </Button>
              )}
            </div>
            {issuedConfigText && issuePreviewOpen && (
              <label className="users-page__field users-page__field--full">
                Config preview
                <textarea className="input users-page__textarea" readOnly rows={10} value={issuedConfigText} />
              </label>
            )}
          </div>
        )}
      </section>

      <section className="users-page__danger-zone">
        <SectionHeader label="Danger zone" />
        {dangerError && (
          <p className="users-page__detail-error" role="alert">
            {dangerError}
          </p>
        )}
        <MetaText className="users-page__muted">
          Ban and delete require confirmation tokens. Keep these actions for verified abuse or support incidents.
        </MetaText>
        <div className="users-page__toolbar-actions users-page__toolbar-actions--left">
          {!userDetail.is_banned ? (
            <Button type="button" variant="danger" onClick={onOpenBan} disabled={actionPending}>
              Ban user
            </Button>
          ) : (
            <Button type="button" variant="default" onClick={onUnban} disabled={actionPending}>
              Unban user
            </Button>
          )}
          <Button type="button" variant="danger" onClick={onOpenDelete} disabled={actionPending}>
            Delete user
          </Button>
        </div>
      </section>
    </div>
  );
}

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "danger";
  pending: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  pending,
  value,
  onValueChange,
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="users-page__muted">{description}</p>
      <label className="users-page__field">
        Confirm token
        <Input
          type="password"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Token"
        />
      </label>
      <div className="users-page__modal-actions">
        <Button type="button" variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant={confirmVariant} onClick={onConfirm} disabled={pending}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
