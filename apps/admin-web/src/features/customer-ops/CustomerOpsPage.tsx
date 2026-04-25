import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { buildUsersPath } from "@/hooks/useUsers";
import { userKeys } from "@/features/users/services/user.query-keys";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  SectionHeader,
  Skeleton,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  useToast,
} from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { PageErrorState, PageLoadingState } from "@/layout/PageStates";
import { CardTitle, MetaText } from "@/design-system/typography";
import {
  formatDeliveryMode,
  formatRelative,
  getTgRequisites,
  statusVariant,
} from "@/features/users/UsersPage.sections";
import type {
  DeviceList,
  DeviceOut,
  PaymentList,
  PaymentOut,
  PlanList,
  ServerList,
  SubscriptionList,
  SubscriptionOut,
  UserDetail,
  UserList,
  UserOut,
} from "@/shared/types/admin-api";

type UserStatusFilter = "all" | "true" | "false";
type CustomerTab = "profile" | "devices" | "billing" | "payments";
type SortMode = "updated_desc" | "created_desc" | "email_asc" | "tg_asc" | "status";
type DeviceSort = "issued_at_desc" | "issued_at_asc" | "user" | "node" | "status";

interface CustomerFilters {
  search: string;
  userStatus: UserStatusFilter;
  planId: string;
  region: string;
  deviceStatus: string;
  paymentStatus: string;
  paymentProvider: string;
  sort: SortMode;
  deviceSort: DeviceSort;
}

const DEFAULT_FILTERS: CustomerFilters = {
  search: "",
  userStatus: "all",
  planId: "",
  region: "",
  deviceStatus: "",
  paymentStatus: "",
  paymentProvider: "",
  sort: "updated_desc",
  deviceSort: "issued_at_desc",
};

function resolveSearchTarget(value: string): { tgId?: string; email?: string; phone?: string } {
  const query = value.trim();
  if (!query) return {};
  if (/^\d+$/.test(query)) return { tgId: query };
  if (query.startsWith("+")) return { phone: query };
  return { email: query };
}

function parseSelectedUserId(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get("user");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatMoney(payment: PaymentOut): string {
  return `${payment.amount} ${payment.currency}`;
}

function badgeForPayment(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

function badgeForSubscription(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "grace" || status === "paused" || status === "pending") return "warning";
  if (status === "expired" || status === "blocked" || status === "cancelled") return "danger";
  return "neutral";
}

function deviceStatus(device: DeviceOut): "active" | "suspended" | "revoked" {
  if (device.revoked_at) return "revoked";
  if (device.suspended_at) return "suspended";
  return "active";
}

function sortUsers(users: UserOut[], mode: SortMode): UserOut[] {
  const rows = [...users];
  rows.sort((a, b) => {
    if (mode === "email_asc") return (a.email ?? "").localeCompare(b.email ?? "");
    if (mode === "tg_asc") return String(a.tg_id ?? "").localeCompare(String(b.tg_id ?? ""));
    if (mode === "status") return Number(a.is_banned) - Number(b.is_banned);
    const field = mode === "created_desc" ? "created_at" : "updated_at";
    return new Date(b[field]).getTime() - new Date(a[field]).getTime();
  });
  return rows;
}

function buildDevicePath(userId: number | null, filters: CustomerFilters): string {
  const params = new URLSearchParams();
  params.set("limit", "100");
  params.set("offset", "0");
  params.set("sort", filters.deviceSort);
  if (userId != null) params.set("user_id", String(userId));
  if (filters.deviceStatus) params.set("status", filters.deviceStatus);
  return `/devices?${params.toString()}`;
}

function buildPaymentsPath(userId: number | null, filters: CustomerFilters): string {
  const params = new URLSearchParams();
  params.set("limit", "100");
  params.set("offset", "0");
  if (userId != null) params.set("user_id", String(userId));
  if (filters.paymentStatus) params.set("status", filters.paymentStatus);
  if (filters.paymentProvider.trim()) params.set("provider", filters.paymentProvider.trim());
  return `/payments?${params.toString()}`;
}

function buildSubscriptionsPath(userId: number | null, filters: CustomerFilters): string {
  const params = new URLSearchParams();
  params.set("limit", "100");
  params.set("offset", "0");
  if (userId != null) params.set("user_id", String(userId));
  if (filters.planId) params.set("plan_id", filters.planId);
  return `/subscriptions?${params.toString()}`;
}

function CopyIdButton({ value }: { value: string }) {
  const { showToast } = useToast();
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(
          () => showToast({ variant: "success", title: "Copied" }),
          () => showToast({ variant: "warning", title: "Copy failed" })
        );
      }}
    >
      Copy ID
    </Button>
  );
}

export function CustomerOpsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = parseSelectedUserId(searchParams);
  const [draft, setDraft] = useState<CustomerFilters>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<CustomerFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<CustomerTab>("profile");
  const [selectedDevice, setSelectedDevice] = useState<DeviceOut | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentOut | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionOut | null>(null);

  const searchTarget = useMemo(() => resolveSearchTarget(filters.search), [filters.search]);
  const usersPath = useMemo(
    () =>
      buildUsersPath({
        limit: 100,
        offset: 0,
        tgId: searchTarget.tgId,
        email: searchTarget.email,
        phone: searchTarget.phone,
        isBanned: filters.userStatus,
        planId: filters.planId,
        region: filters.region,
      }),
    [filters.planId, filters.region, filters.userStatus, searchTarget.email, searchTarget.phone, searchTarget.tgId]
  );

  const {
    data: userList,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorObject,
    refetch: refetchUsers,
  } = useApiQuery<UserList>([...userKeys.list(usersPath), "customer-ops"], usersPath, {
    retry: 1,
    staleTime: 15_000,
  });

  const { data: selectedUser, isLoading: selectedUserLoading } = useApiQuery<UserDetail>(
    [...userKeys.detail(selectedUserId ?? 0), "customer-ops"],
    `/users/${selectedUserId!}`,
    { enabled: selectedUserId != null, retry: 0 }
  );

  const devicePath = useMemo(() => buildDevicePath(selectedUserId, filters), [filters, selectedUserId]);
  const {
    data: devices,
    isLoading: devicesLoading,
    isError: devicesError,
    refetch: refetchDevices,
  } = useApiQuery<DeviceList>(["customer-ops", "devices", devicePath], devicePath, {
    enabled: selectedUserId != null,
    retry: 1,
    staleTime: 10_000,
  });

  const subscriptionsPath = useMemo(() => buildSubscriptionsPath(selectedUserId, filters), [filters, selectedUserId]);
  const {
    data: subscriptions,
    isLoading: subscriptionsLoading,
    refetch: refetchSubscriptions,
  } = useApiQuery<SubscriptionList>(
    ["customer-ops", "subscriptions", subscriptionsPath],
    subscriptionsPath,
    { enabled: selectedUserId != null, retry: 1, staleTime: 15_000 }
  );

  const paymentsPath = useMemo(() => buildPaymentsPath(selectedUserId, filters), [filters, selectedUserId]);
  const {
    data: payments,
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = useApiQuery<PaymentList>(
    ["customer-ops", "payments", paymentsPath],
    paymentsPath,
    { enabled: selectedUserId != null, retry: 1, staleTime: 15_000 }
  );

  const { data: plans } = useApiQuery<PlanList>(
    ["customer-ops", "plans"],
    "/plans?limit=200&offset=0&include_archived=false",
    { retry: 1, staleTime: 60_000 }
  );

  const { data: servers } = useApiQuery<ServerList>(
    ["customer-ops", "servers"],
    "/servers?limit=200&offset=0",
    { retry: 1, staleTime: 60_000 }
  );

  const sortedUsers = useMemo(() => sortUsers(userList?.items ?? [], filters.sort), [filters.sort, userList?.items]);
  const selectedSummary = sortedUsers.find((user) => user.id === selectedUserId) ?? null;

  useEffect(() => {
    if (selectedUserId != null) return;
    const firstUser = sortedUsers[0];
    if (!firstUser) return;
    const next = new URLSearchParams(searchParams);
    next.set("user", String(firstUser.id));
    setSearchParams(next, { replace: true });
  }, [searchParams, selectedUserId, setSearchParams, sortedUsers]);

  const planOptions = useMemo(
    () => Array.from(new Set((plans?.items ?? []).map((plan) => plan.id))).sort(),
    [plans?.items]
  );

  const regionOptions = useMemo(
    () =>
      Array.from(
        new Set((servers?.items ?? []).map((server) => server.region).filter((value): value is string => Boolean(value)))
      ).sort(),
    [servers?.items]
  );

  const selectUser = useCallback(
    (userId: number) => {
      const next = new URLSearchParams(searchParams);
      next.set("user", String(userId));
      setSearchParams(next, { replace: true });
      setActiveTab("profile");
    },
    [searchParams, setSearchParams]
  );

  const refetchAll = useCallback(() => {
    void refetchUsers();
    void refetchDevices();
    void refetchSubscriptions();
    void refetchPayments();
  }, [refetchDevices, refetchPayments, refetchSubscriptions, refetchUsers]);

  if (usersLoading) {
    return <PageLoadingState title="Customer 360" pageClass="customer-ops-page" bodyHeight={260} />;
  }

  if (usersError) {
    return (
      <PageErrorState
        title="Customer 360"
        pageClass="customer-ops-page"
        message={usersErrorObject instanceof Error ? usersErrorObject.message : "Failed to load customers."}
        onRetry={() => void refetchUsers()}
      />
    );
  }

  const deviceItems = devices?.items ?? [];
  const subscriptionItems = subscriptions?.items ?? selectedUser?.subscriptions ?? [];
  const paymentItems = payments?.items ?? [];
  const activeDevices = deviceItems.filter((device) => !device.revoked_at).length;
  const completedPayments = paymentItems.filter((payment) => payment.status === "completed").length;
  const activeSubscriptions = subscriptionItems.filter((sub) => (sub.effective_status ?? sub.status) === "active").length;

  const userRows = sortedUsers.map((user) => {
    const tg = getTgRequisites(user.meta);
    const display = user.email || (tg?.username ? `@${tg.username}` : null) || `User #${user.id}`;
    return {
      id: String(user.id),
      user: (
        <button
          type="button"
          className="customer-ops-page__user-button"
          onClick={() => selectUser(user.id)}
          aria-label={`Open customer ${user.id}`}
        >
          <span>{display}</span>
          <MetaText>
            #{user.id} · TG {user.tg_id ?? "—"} · {formatRelative(user.updated_at)}
          </MetaText>
        </button>
      ),
      status: (
        <Badge size="sm" variant={user.is_banned ? "danger" : "success"}>
          {user.is_banned ? "Banned" : "Active"}
        </Badge>
      ),
      contact: (
        <div className="customer-ops-page__cell-stack">
          <span>{user.phone ?? "—"}</span>
          <MetaText>{user.email ?? "No email"}</MetaText>
        </div>
      ),
      action: (
        <Button type="button" size="sm" variant={selectedUserId === user.id ? "primary" : "ghost"} onClick={() => selectUser(user.id)}>
          Drill down
        </Button>
      ),
      selected: selectedUserId === user.id,
    };
  });

  return (
    <PageLayout
      title="Customer 360"
      description="Unified drill-down for users, devices, subscriptions, and payments."
      pageClass="customer-ops-page"
      dataTestId="customer-ops-page"
      actions={
        <Button type="button" variant="default" onClick={refetchAll}>
          <RefreshCw size={16} aria-hidden />
          Refresh
        </Button>
      }
    >
      <Card variant="outlined" className="customer-ops-page__filters">
        <SectionHeader label="Advanced filters" note={`${userList?.total ?? 0} users in scope`} />
        <div className="customer-ops-page__filter-grid">
          <label className="input-label customer-ops-page__filter-wide">
            Search
            <span className="customer-ops-page__input-shell">
              <Search size={16} aria-hidden />
              <Input
                value={draft.search}
                onChange={(event) => setDraft((state) => ({ ...state, search: event.target.value }))}
                placeholder="TG ID, email, or phone"
                aria-label="Customer search"
              />
            </span>
          </label>
          <label className="input-label">
            User status
            <select
              className="input"
              value={draft.userStatus}
              onChange={(event) => setDraft((state) => ({ ...state, userStatus: event.target.value as UserStatusFilter }))}
            >
              <option value="all">All</option>
              <option value="false">Active</option>
              <option value="true">Banned</option>
            </select>
          </label>
          <label className="input-label">
            Plan
            <select className="input" value={draft.planId} onChange={(event) => setDraft((state) => ({ ...state, planId: event.target.value }))}>
              <option value="">All plans</option>
              {planOptions.map((planId) => (
                <option key={planId} value={planId}>
                  {planId}
                </option>
              ))}
            </select>
          </label>
          <label className="input-label">
            Region
            <select className="input" value={draft.region} onChange={(event) => setDraft((state) => ({ ...state, region: event.target.value }))}>
              <option value="">All regions</option>
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>
          <label className="input-label">
            Device status
            <select className="input" value={draft.deviceStatus} onChange={(event) => setDraft((state) => ({ ...state, deviceStatus: event.target.value }))}>
              <option value="">All devices</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </label>
          <label className="input-label">
            Payment status
            <select className="input" value={draft.paymentStatus} onChange={(event) => setDraft((state) => ({ ...state, paymentStatus: event.target.value }))}>
              <option value="">All payments</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className="input-label">
            Provider
            <Input
              value={draft.paymentProvider}
              onChange={(event) => setDraft((state) => ({ ...state, paymentProvider: event.target.value }))}
              placeholder="telegram_stars"
            />
          </label>
          <label className="input-label">
            User sort
            <select className="input" value={draft.sort} onChange={(event) => setDraft((state) => ({ ...state, sort: event.target.value as SortMode }))}>
              <option value="updated_desc">Recently updated</option>
              <option value="created_desc">Newest users</option>
              <option value="email_asc">Email A-Z</option>
              <option value="tg_asc">Telegram ID</option>
              <option value="status">Status</option>
            </select>
          </label>
          <label className="input-label">
            Device sort
            <select className="input" value={draft.deviceSort} onChange={(event) => setDraft((state) => ({ ...state, deviceSort: event.target.value as DeviceSort }))}>
              <option value="issued_at_desc">Newest issued</option>
              <option value="issued_at_asc">Oldest issued</option>
              <option value="user">User</option>
              <option value="node">Node</option>
              <option value="status">Status</option>
            </select>
          </label>
          <div className="customer-ops-page__filter-actions">
            <Button type="button" onClick={() => setFilters(draft)}>
              <SlidersHorizontal size={16} aria-hidden />
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft(DEFAULT_FILTERS);
                setFilters(DEFAULT_FILTERS);
              }}
            >
              <X size={16} aria-hidden />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <section className="customer-ops-page__workspace">
        <Card variant="outlined" className="customer-ops-page__list-pane">
          <SectionHeader label="Customers" note={`${sortedUsers.length} loaded`} />
          {userRows.length > 0 ? (
            <div className="data-table-wrap">
              <DataTable
                density="compact"
                columns={[
                  { key: "user", header: "User" },
                  { key: "status", header: "Status" },
                  { key: "contact", header: "Contact" },
                  { key: "action", header: "Action" },
                ]}
                rows={userRows}
                getRowKey={(row) => row.id}
                getRowClassName={(row) => (row.selected ? "customer-ops-page__row--selected" : "")}
              />
            </div>
          ) : (
            <EmptyState message="No customers match the current filter set." />
          )}
        </Card>

        <Card variant="outlined" className="customer-ops-page__detail-pane">
          {!selectedUserId ? (
            <EmptyState message="Select a customer to inspect devices, billing, and payments." />
          ) : selectedUserLoading && !selectedUser ? (
            <Skeleton height={260} />
          ) : (
            <>
              <div className="customer-ops-page__detail-head">
                <div>
                  <CardTitle as="h2">
                    {selectedUser?.email || selectedSummary?.email || `User #${selectedUserId}`}
                  </CardTitle>
                  <MetaText>
                    TG {selectedUser?.tg_id ?? selectedSummary?.tg_id ?? "—"} · {selectedUser?.is_banned ? "banned" : "active"}
                  </MetaText>
                </div>
                <div className="customer-ops-page__kpis">
                  <Badge variant={activeSubscriptions > 0 ? "success" : "neutral"}>{activeSubscriptions} active subs</Badge>
                  <Badge variant={activeDevices > 0 ? "success" : "neutral"}>{activeDevices} active devices</Badge>
                  <Badge variant={completedPayments > 0 ? "success" : "neutral"}>{completedPayments} paid</Badge>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CustomerTab)}>
                <TabsList className="customer-ops-page__tabs">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="devices">Devices</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>

                <TabsPanel value="profile">
                  <ProfilePanel user={selectedUser} devices={deviceItems} subscriptions={subscriptionItems} payments={paymentItems} />
                </TabsPanel>

                <TabsPanel value="devices">
                  <DevicesPanel
                    loading={devicesLoading}
                    error={devicesError}
                    devices={deviceItems}
                    onOpenDevice={setSelectedDevice}
                  />
                </TabsPanel>

                <TabsPanel value="billing">
                  <BillingPanel
                    loading={subscriptionsLoading}
                    subscriptions={subscriptionItems}
                    onOpenSubscription={setSelectedSubscription}
                  />
                </TabsPanel>

                <TabsPanel value="payments">
                  <PaymentsPanel
                    loading={paymentsLoading}
                    payments={paymentItems}
                    onOpenPayment={setSelectedPayment}
                  />
                </TabsPanel>
              </Tabs>
            </>
          )}
        </Card>
      </section>

      <DeviceInspector device={selectedDevice} onClose={() => setSelectedDevice(null)} />
      <PaymentModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      <SubscriptionModal subscription={selectedSubscription} onClose={() => setSelectedSubscription(null)} />
    </PageLayout>
  );
}

function ProfilePanel({
  user,
  devices,
  subscriptions,
  payments,
}: {
  user: UserDetail | undefined;
  devices: DeviceOut[];
  subscriptions: SubscriptionOut[];
  payments: PaymentOut[];
}) {
  if (!user) return <Skeleton height={180} />;
  const tg = getTgRequisites(user.meta);
  const paidAmount = payments
    .filter((payment) => payment.status === "completed")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return (
    <div className="customer-ops-page__profile-grid">
      <section className="customer-ops-page__summary">
        <SectionHeader label="Identity" />
        <dl className="customer-ops-page__dl">
          <dt>User ID</dt>
          <dd>{user.id}</dd>
          <dt>Telegram</dt>
          <dd>{tg?.username ? `@${tg.username}` : user.tg_id ?? "—"}</dd>
          <dt>Email</dt>
          <dd>{user.email ?? "—"}</dd>
          <dt>Phone</dt>
          <dd>{user.phone ?? "—"}</dd>
          <dt>Created</dt>
          <dd>{formatRelative(user.created_at)}</dd>
        </dl>
      </section>
      <section className="customer-ops-page__summary">
        <SectionHeader label="Account state" />
        <div className="customer-ops-page__metric-grid">
          <Metric label="Subscriptions" value={String(subscriptions.length)} />
          <Metric label="Devices" value={String(devices.length)} />
          <Metric label="Payments" value={String(payments.length)} />
          <Metric label="Paid volume" value={String(paidAmount)} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="customer-ops-page__metric">
      <MetaText>{label}</MetaText>
      <strong>{value}</strong>
    </div>
  );
}

function DevicesPanel({
  loading,
  error,
  devices,
  onOpenDevice,
}: {
  loading: boolean;
  error: boolean;
  devices: DeviceOut[];
  onOpenDevice: (device: DeviceOut) => void;
}) {
  if (loading) return <Skeleton height={180} />;
  if (error) return <ErrorState message="Failed to load devices." />;
  if (devices.length === 0) return <EmptyState message="No devices match the current filters for this user." />;

  return (
    <div className="data-table-wrap">
      <DataTable
        density="compact"
        columns={[
          { key: "status", header: "Status" },
          { key: "device", header: "Device" },
          { key: "server", header: "Server" },
          { key: "mode", header: "Mode" },
          { key: "issued", header: "Issued" },
          { key: "action", header: "Inspect" },
        ]}
        rows={devices.map((device) => {
          const status = deviceStatus(device);
          return {
            id: device.id,
            status: (
              <Badge size="sm" variant={statusVariant(status)}>
                {status}
              </Badge>
            ),
            device: device.device_name ?? device.id,
            server: device.server_id,
            mode: formatDeliveryMode(device.delivery_mode),
            issued: formatRelative(device.issued_at),
            action: (
              <Button type="button" size="sm" variant="ghost" onClick={() => onOpenDevice(device)}>
                Open
              </Button>
            ),
          };
        })}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}

function BillingPanel({
  loading,
  subscriptions,
  onOpenSubscription,
}: {
  loading: boolean;
  subscriptions: SubscriptionOut[];
  onOpenSubscription: (subscription: SubscriptionOut) => void;
}) {
  if (loading) return <Skeleton height={180} />;
  if (subscriptions.length === 0) return <EmptyState message="No subscriptions match the current filters." />;

  return (
    <div className="data-table-wrap">
      <DataTable
        density="compact"
        columns={[
          { key: "plan", header: "Plan" },
          { key: "status", header: "Status" },
          { key: "access", header: "Access" },
          { key: "valid", header: "Valid until" },
          { key: "devices", header: "Limit" },
          { key: "action", header: "Inspect" },
        ]}
        rows={subscriptions.map((sub) => {
          const status = sub.effective_status ?? sub.status;
          return {
            id: sub.id,
            plan: sub.plan_id,
            status: (
              <Badge size="sm" variant={badgeForSubscription(status)}>
                {status}
              </Badge>
            ),
            access: sub.access_status ?? "—",
            valid: formatRelative(sub.valid_until),
            devices: sub.device_limit,
            action: (
              <Button type="button" size="sm" variant="ghost" onClick={() => onOpenSubscription(sub)}>
                Open
              </Button>
            ),
          };
        })}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}

function PaymentsPanel({
  loading,
  payments,
  onOpenPayment,
}: {
  loading: boolean;
  payments: PaymentOut[];
  onOpenPayment: (payment: PaymentOut) => void;
}) {
  if (loading) return <Skeleton height={180} />;
  if (payments.length === 0) return <EmptyState message="No payments match the current filters." />;

  return (
    <div className="data-table-wrap">
      <DataTable
        density="compact"
        columns={[
          { key: "status", header: "Status" },
          { key: "provider", header: "Provider" },
          { key: "amount", header: "Amount" },
          { key: "subscription", header: "Subscription" },
          { key: "created", header: "Created" },
          { key: "action", header: "Inspect" },
        ]}
        rows={payments.map((payment) => ({
          id: payment.id,
          status: (
            <Badge size="sm" variant={badgeForPayment(payment.status)}>
              {payment.status}
            </Badge>
          ),
          provider: payment.provider,
          amount: formatMoney(payment),
          subscription: payment.subscription_id,
          created: formatRelative(payment.created_at),
          action: (
            <Button type="button" size="sm" variant="ghost" onClick={() => onOpenPayment(payment)}>
              Open
            </Button>
          ),
        }))}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}

function DeviceInspector({ device, onClose }: { device: DeviceOut | null; onClose: () => void }) {
  return (
    <Drawer open={device != null} onClose={onClose} title={device ? `Device ${device.device_name ?? device.id}` : "Device"} size="lg">
      {device && (
        <div className="customer-ops-page__inspector">
          <SectionHeader label="Device detail" />
          <dl className="customer-ops-page__dl">
            <dt>ID</dt>
            <dd>{device.id}</dd>
            <dt>User</dt>
            <dd>{device.user_id}</dd>
            <dt>Subscription</dt>
            <dd>{device.subscription_id}</dd>
            <dt>Server</dt>
            <dd>{device.server_id}</dd>
            <dt>Mode</dt>
            <dd>{formatDeliveryMode(device.delivery_mode)}</dd>
            <dt>Allowed IPs</dt>
            <dd>{device.allowed_ips ?? "—"}</dd>
            <dt>Apply status</dt>
            <dd>{device.apply_status ?? "—"}</dd>
            <dt>Last error</dt>
            <dd>{device.last_error ?? "—"}</dd>
          </dl>
          <CopyIdButton value={device.id} />
        </div>
      )}
    </Drawer>
  );
}

function PaymentModal({ payment, onClose }: { payment: PaymentOut | null; onClose: () => void }) {
  return (
    <Modal open={payment != null} onClose={onClose} title="Payment detail">
      {payment && (
        <div className="customer-ops-page__modal-body">
          <div className="customer-ops-page__modal-title">
            <CreditCard size={18} aria-hidden />
            <strong>{formatMoney(payment)}</strong>
            <Badge size="sm" variant={badgeForPayment(payment.status)}>
              {payment.status}
            </Badge>
          </div>
          <dl className="customer-ops-page__dl">
            <dt>ID</dt>
            <dd>{payment.id}</dd>
            <dt>User</dt>
            <dd>{payment.user_id}</dd>
            <dt>Subscription</dt>
            <dd>{payment.subscription_id}</dd>
            <dt>Provider</dt>
            <dd>{payment.provider}</dd>
            <dt>External ID</dt>
            <dd>{payment.external_id}</dd>
            <dt>Created</dt>
            <dd>{new Date(payment.created_at).toLocaleString()}</dd>
          </dl>
          <CopyIdButton value={payment.id} />
        </div>
      )}
    </Modal>
  );
}

function SubscriptionModal({
  subscription,
  onClose,
}: {
  subscription: SubscriptionOut | null;
  onClose: () => void;
}) {
  return (
    <Modal open={subscription != null} onClose={onClose} title="Subscription detail">
      {subscription && (
        <div className="customer-ops-page__modal-body">
          <Badge size="sm" variant={badgeForSubscription(subscription.effective_status ?? subscription.status)}>
            {subscription.effective_status ?? subscription.status}
          </Badge>
          <dl className="customer-ops-page__dl">
            <dt>ID</dt>
            <dd>{subscription.id}</dd>
            <dt>User</dt>
            <dd>{subscription.user_id}</dd>
            <dt>Plan</dt>
            <dd>{subscription.plan_id}</dd>
            <dt>Access</dt>
            <dd>{subscription.access_status ?? "—"}</dd>
            <dt>Billing</dt>
            <dd>{subscription.billing_status ?? "—"}</dd>
            <dt>Renewal</dt>
            <dd>{subscription.renewal_status ?? "—"}</dd>
            <dt>Valid until</dt>
            <dd>{new Date(subscription.valid_until).toLocaleString()}</dd>
            <dt>Grace until</dt>
            <dd>{subscription.grace_until ? new Date(subscription.grace_until).toLocaleString() : "—"}</dd>
          </dl>
          <CopyIdButton value={subscription.id} />
        </div>
      )}
    </Modal>
  );
}
