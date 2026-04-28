import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/layout/PageLayout";
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  SectionHeader,
  Skeleton,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  useToast,
} from "@/design-system/primitives";
import { MetaText } from "@/design-system/typography";
import { useApi } from "@/core/api/context";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { userKeys } from "@/features/users/services/user.query-keys";
import { billingKeys } from "@/features/billing/services/billing.query-keys";
import type { PlanList, SubscriptionOut, UserDetail, UserList, UserOut } from "@/shared/types/admin-api";
import "./news.css";

type ParseMode = "HTML" | "MarkdownV2" | "plain";
type TargetMode = "all" | "filters" | "user_ids" | "tg_ids";

interface BroadcastResponse {
  broadcast_id: string;
  status: string;
}

interface BroadcastStatus {
  id: string;
  status: string;
  created_at?: string;
  finished_at?: string;
  total: number;
  sent: number;
  failed: number;
  last_error: string;
  text?: string;
}

interface DirectMessageResponse {
  user_id: number;
  tg_id: number;
  status: string;
  error?: string | null;
}

interface GrantResponse {
  status: string;
  user_id: number;
  subscription?: SubscriptionOut | null;
  promo_code?: string | null;
  event_id?: string | null;
  notified: boolean;
}

interface UserRow extends Record<string, unknown> {
  id: string;
  tg: string;
  contact: string;
  status: JSX.Element;
  actions: JSX.Element;
}

interface BroadcastRow extends Record<string, unknown> {
  id: string;
  created: string;
  status: JSX.Element;
  delivery: string;
  message: string;
}

const MAX_MESSAGE_LENGTH = 3500;

function parseModePayload(mode: ParseMode): "HTML" | "MarkdownV2" | null {
  if (mode === "plain") return null;
  return mode;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function userLabel(user: UserOut | UserDetail | null): string {
  if (!user) return "No user selected";
  return `#${user.id} / TG ${user.tg_id ?? "-"}`;
}

function buildUsersPath(search: string): string {
  const params = new URLSearchParams({ limit: "10", offset: "0" });
  const value = search.trim();
  if (/^\d+$/.test(value)) params.set("tg_id", value);
  else if (value.startsWith("+")) params.set("phone", value);
  else if (value) params.set("email", value);
  return `/users?${params.toString()}`;
}

function useUserSearch(search: string) {
  const path = useMemo(() => buildUsersPath(search), [search]);
  return useApiQuery<UserList>([...userKeys.list(path)], path, {
    enabled: search.trim().length > 0,
    retry: 1,
  });
}

function MessageComposer({
  text,
  mode,
  label,
  onTextChange,
  onModeChange,
}: {
  text: string;
  mode: ParseMode;
  label: string;
  onTextChange: (value: string) => void;
  onModeChange: (value: ParseMode) => void;
}) {
  const remaining = MAX_MESSAGE_LENGTH - text.length;
  const isTooLong = remaining < 0;
  return (
    <div className="news-page__composer">
      <label className="input-wrap">
        <span className="input-label">Message</span>
        <textarea
          className={`input news-page__textarea${isTooLong ? " is-error" : ""}`}
          rows={9}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Example: <b>Service update</b> New locations are available."
          aria-label={`${label} message body`}
        />
        <span className={`input-hint${isTooLong ? " is-error" : ""}`}>
          {remaining} characters remaining. Telegram formatting is rendered by the bot.
        </span>
      </label>

      <div className="news-page__format-row" role="group" aria-label="Message format">
        {(["HTML", "MarkdownV2", "plain"] as ParseMode[]).map((value) => (
          <Button
            key={value}
            type="button"
            variant={mode === value ? "default" : "secondary"}
            onClick={() => onModeChange(value)}
          >
            {value === "plain" ? "Plain text" : value}
          </Button>
        ))}
      </div>

      <Card variant="outlined" className="news-page__preview">
        <MetaText>Preview</MetaText>
        <div className="news-page__preview-body">
          {text.trim() ? text : "Your message preview will appear here."}
        </div>
      </Card>
    </div>
  );
}

function UserPicker({
  selectedUser,
  label,
  onSelect,
}: {
  selectedUser: UserOut | UserDetail | null;
  label: string;
  onSelect: (user: UserOut) => void;
}) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUserSearch(search);
  const rows = (data?.items ?? []).map<UserRow>((user) => ({
    id: String(user.id),
    tg: String(user.tg_id ?? "-"),
    contact: user.email || user.phone || "-",
    status: <Badge variant={user.is_banned ? "danger" : "success"}>{user.is_banned ? "Banned" : "Active"}</Badge>,
    actions: (
      <Button type="button" size="sm" variant="secondary" onClick={() => onSelect(user)}>
        Select
      </Button>
    ),
  }));

  return (
    <Card variant="outlined" className="news-page__picker">
      <div className="news-page__picker-head">
        <div>
          <SectionHeader label="User" note={userLabel(selectedUser)} />
        </div>
        {selectedUser ? <Badge variant="info">Selected</Badge> : null}
      </div>
      <label className="input-wrap">
        <span className="input-label">Find by TG ID, email, or phone</span>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="123456789 or user@email"
          aria-label={`${label} user search`}
        />
      </label>
      {isLoading ? (
        <Skeleton height={120} />
      ) : rows.length > 0 ? (
        <DataTable
          columns={[
            { key: "id", header: "ID" },
            { key: "tg", header: "TG" },
            { key: "contact", header: "Contact" },
            { key: "status", header: "Status" },
            { key: "actions", header: "" },
          ]}
          rows={rows}
          getRowKey={(row) => row.id}
        />
      ) : search.trim() ? (
        <EmptyState title="No users found" description="Try a different TG ID, email, or phone." />
      ) : null}
    </Card>
  );
}

export function NewsPage() {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaignText, setCampaignText] = useState("");
  const [campaignMode, setCampaignMode] = useState<ParseMode>("HTML");
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [includeBanned, setIncludeBanned] = useState(false);
  const [explicitIds, setExplicitIds] = useState("");
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [status, setStatus] = useState<BroadcastStatus | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserOut | UserDetail | null>(null);
  const [directText, setDirectText] = useState("");
  const [directMode, setDirectMode] = useState<ParseMode>("HTML");
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [directResult, setDirectResult] = useState<DirectMessageResponse | null>(null);

  const [grantKind, setGrantKind] = useState<"trial" | "extension" | "discount">("trial");
  const [trialHours, setTrialHours] = useState("72");
  const [deviceLimit, setDeviceLimit] = useState("1");
  const [extensionDays, setExtensionDays] = useState("7");
  const [extensionReason, setExtensionReason] = useState("Manual support grant");
  const [discountPercent, setDiscountPercent] = useState("50");
  const [discountValidUntil, setDiscountValidUntil] = useState("");
  const [notifyUser, setNotifyUser] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [grantResult, setGrantResult] = useState<GrantResponse | null>(null);

  const usersPath = useMemo(() => {
    const params = new URLSearchParams({ limit: "50", offset: "0" });
    if (filterSearch.trim()) {
      const value = filterSearch.trim();
      if (/^\d+$/.test(value)) params.set("tg_id", value);
      else if (value.startsWith("+")) params.set("phone", value);
      else params.set("email", value);
    }
    if (!includeBanned) params.set("is_banned", "false");
    return `/users?${params.toString()}`;
  }, [filterSearch, includeBanned]);
  const { data: recipientPreview } = useApiQuery<UserList>([...userKeys.list(usersPath)], usersPath, {
    enabled: targetMode === "filters",
    retry: 1,
  });
  const { data: plans } = useApiQuery<PlanList>([...billingKeys.plans()], "/plans?limit=100&offset=0&include_archived=false", {
    staleTime: 60_000,
  });
  const { data: selectedDetail } = useApiQuery<UserDetail>(
    selectedUser ? [...userKeys.detail(selectedUser.id)] : [...userKeys.all, "detail", "none"],
    selectedUser ? `/users/${selectedUser.id}` : "/users/0",
    { enabled: selectedUser != null, retry: 1 }
  );
  const { data: history, refetch: refetchHistory } = useApiQuery<BroadcastStatus[]>(
    ["news", "broadcasts"],
    "/admin/news/broadcasts?limit=20",
    { retry: 1 }
  );

  const userForGrant = selectedDetail ?? selectedUser;
  const activeSubscription = selectedDetail?.subscriptions?.[0] ?? null;
  const defaultPlanId = plans?.items[0]?.id ?? "";
  const recipientCount =
    targetMode === "all" ? "all active users" : targetMode === "filters" ? `${recipientPreview?.total ?? 0} users` : `${explicitIds.split(",").filter(Boolean).length} users`;
  const campaignInvalid = !campaignText.trim() || campaignText.length > MAX_MESSAGE_LENGTH || isBroadcasting;
  const directInvalid = !selectedUser || !directText.trim() || directText.length > MAX_MESSAGE_LENGTH || isSendingDirect;

  const sendCampaign = async () => {
    if (campaignInvalid) return;
    if (targetMode !== "user_ids" && targetMode !== "tg_ids" && !confirmBulk) return;
    const ids = explicitIds
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map(Number)
      .filter((value) => Number.isFinite(value));
    const target =
      targetMode === "filters"
        ? { kind: "filters", include_banned: includeBanned, filters: { search: filterSearch.trim() || undefined, is_banned: includeBanned ? undefined : false } }
        : targetMode === "user_ids"
          ? { kind: "user_ids", user_ids: ids, include_banned: includeBanned }
          : targetMode === "tg_ids"
            ? { kind: "tg_ids", tg_ids: ids, include_banned: includeBanned }
            : { kind: "all", include_banned: includeBanned };
    setIsBroadcasting(true);
    try {
      const response = await api.post<BroadcastResponse>("/admin/news/broadcast", {
        text: campaignText.trim(),
        parse_mode: parseModePayload(campaignMode),
        include_banned: includeBanned,
        target,
      });
      setBroadcastId(response.broadcast_id);
      setStatus(null);
      void refetchHistory();
      toast.showToast({ variant: "success", title: "Campaign queued" });
    } catch (error) {
      toast.showToast({ variant: "danger", title: error instanceof Error ? error.message : "Campaign failed" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const refreshStatus = async () => {
    if (!broadcastId) return;
    const next = await api.get<BroadcastStatus>(`/admin/news/broadcast/${broadcastId}`);
    setStatus(next);
    void refetchHistory();
  };

  const sendDirect = async () => {
    if (directInvalid || !selectedUser) return;
    setIsSendingDirect(true);
    try {
      const response = await api.post<DirectMessageResponse>("/admin/news/direct", {
        user_id: selectedUser.id,
        text: directText.trim(),
        parse_mode: parseModePayload(directMode),
      });
      setDirectResult(response);
      toast.showToast({ variant: response.status === "sent" ? "success" : "warning", title: `Message ${response.status}` });
    } catch (error) {
      toast.showToast({ variant: "danger", title: error instanceof Error ? error.message : "Direct message failed" });
    } finally {
      setIsSendingDirect(false);
    }
  };

  const grant = async () => {
    if (!userForGrant || isGranting) return;
    setIsGranting(true);
    try {
      const planId = defaultPlanId;
      const body =
        grantKind === "trial"
          ? { user_id: userForGrant.id, plan_id: planId, duration_hours: Number(trialHours), device_limit: Number(deviceLimit), notify_user: notifyUser }
          : grantKind === "extension"
            ? { user_id: userForGrant.id, subscription_id: activeSubscription?.id, days: Number(extensionDays), reason: extensionReason, notify_user: notifyUser }
            : { user_id: userForGrant.id, discount_percent: Number(discountPercent), valid_until: new Date(discountValidUntil).toISOString(), notify_user: notifyUser };
      const response = await api.post<GrantResponse>(`/admin/grants/${grantKind}`, body);
      setGrantResult(response);
      void queryClient.invalidateQueries({ queryKey: [...userKeys.all] });
      void queryClient.invalidateQueries({ queryKey: [...billingKeys.all] });
      toast.showToast({ variant: "success", title: "Grant applied" });
    } catch (error) {
      toast.showToast({ variant: "danger", title: error instanceof Error ? error.message : "Grant failed" });
    } finally {
      setIsGranting(false);
    }
  };

  const historyRows = (history ?? []).map<BroadcastRow>((item) => ({
    id: item.id,
    created: formatDate(item.created_at),
    status: <Badge variant={item.status === "completed" ? "success" : item.status === "failed" ? "danger" : "warning"}>{item.status}</Badge>,
    delivery: `${item.sent}/${item.total} sent, ${item.failed} failed`,
    message: item.text ? item.text.slice(0, 80) : "-",
  }));

  return (
    <PageLayout
      title="News"
      description="Compose customer updates, send personal Telegram messages, and grant retention offers."
      pageClass="news-page"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} variant="bordered">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="personal">Personal message</TabsTrigger>
          <TabsTrigger value="grants">Grants</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsPanel value="campaigns">
          <div className="news-page__grid">
            <Card>
              <SectionHeader label="Campaign composer" note={`Target: ${recipientCount}`} />
              <MessageComposer label="Campaign" text={campaignText} mode={campaignMode} onTextChange={setCampaignText} onModeChange={setCampaignMode} />
            </Card>
            <Card>
              <SectionHeader label="Audience" note="Confirm before queueing multi-user sends." />
              <div className="news-page__form">
                <label className="input-wrap">
                  <span className="input-label">Target</span>
                  <select className="input" value={targetMode} onChange={(event) => setTargetMode(event.target.value as TargetMode)}>
                    <option value="all">All active users</option>
                    <option value="filters">Users matching filters</option>
                    <option value="user_ids">Explicit user IDs</option>
                    <option value="tg_ids">Explicit Telegram IDs</option>
                  </select>
                </label>
                {targetMode === "filters" ? (
                  <label className="input-wrap">
                    <span className="input-label">Filter search</span>
                    <Input value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="TG ID, email, or phone" />
                  </label>
                ) : null}
                {targetMode === "user_ids" || targetMode === "tg_ids" ? (
                  <label className="input-wrap">
                    <span className="input-label">IDs</span>
                    <Input value={explicitIds} onChange={(event) => setExplicitIds(event.target.value)} placeholder="1, 2, 3" />
                  </label>
                ) : null}
                <label className="news-page__check">
                  <input type="checkbox" checked={includeBanned} onChange={(event) => setIncludeBanned(event.target.checked)} />
                  Include banned users
                </label>
                <label className="news-page__check">
                  <input type="checkbox" checked={confirmBulk} onChange={(event) => setConfirmBulk(event.target.checked)} />
                  I confirm this send can reach multiple users
                </label>
                <div className="news-page__actions">
                  <Button type="button" onClick={sendCampaign} disabled={campaignInvalid || (!confirmBulk && targetMode !== "user_ids" && targetMode !== "tg_ids")}>
                    {isBroadcasting ? "Queueing..." : "Queue campaign"}
                  </Button>
                  {broadcastId ? <Button type="button" variant="secondary" onClick={refreshStatus}>Refresh status</Button> : null}
                </div>
                {status ? (
                  <Card variant="outlined" className="news-page__status">
                    <strong>{status.status}</strong>
                    <span>{status.sent} / {status.total} sent, {status.failed} failed</span>
                    {status.last_error ? <MetaText>{status.last_error}</MetaText> : null}
                  </Card>
                ) : null}
              </div>
            </Card>
          </div>
        </TabsPanel>

        <TabsPanel value="personal">
          <div className="news-page__grid">
            <UserPicker label="Personal" selectedUser={selectedUser} onSelect={setSelectedUser} />
            <Card>
              <SectionHeader label="Direct Telegram message" note={userLabel(selectedUser)} />
              <MessageComposer label="Personal" text={directText} mode={directMode} onTextChange={setDirectText} onModeChange={setDirectMode} />
              <div className="news-page__actions">
                <Button type="button" onClick={sendDirect} disabled={directInvalid}>
                  {isSendingDirect ? "Sending..." : "Send personal message"}
                </Button>
              </div>
              {directResult ? (
                <Card variant="outlined" className="news-page__status">
                  <strong>{directResult.status}</strong>
                  <span>TG {directResult.tg_id}</span>
                  {directResult.error ? <MetaText>{directResult.error}</MetaText> : null}
                </Card>
              ) : null}
            </Card>
          </div>
        </TabsPanel>

        <TabsPanel value="grants">
          <div className="news-page__grid">
            <UserPicker label="Grants" selectedUser={selectedUser} onSelect={setSelectedUser} />
            <Card>
              <SectionHeader label="Grant" note={userLabel(userForGrant)} />
              <div className="news-page__form">
                <label className="input-wrap">
                  <span className="input-label">Grant type</span>
                  <select className="input" value={grantKind} onChange={(event) => setGrantKind(event.target.value as typeof grantKind)}>
                    <option value="trial">Free trial</option>
                    <option value="extension">Subscription extension</option>
                    <option value="discount">Discount code</option>
                  </select>
                </label>
                {grantKind === "trial" ? (
                  <>
                    <MetaText>Plan: {defaultPlanId || "No active plan available"}</MetaText>
                    <label className="input-wrap"><span className="input-label">Duration hours</span><Input type="number" min={1} value={trialHours} onChange={(event) => setTrialHours(event.target.value)} /></label>
                    <label className="input-wrap"><span className="input-label">Device limit</span><Input type="number" min={1} value={deviceLimit} onChange={(event) => setDeviceLimit(event.target.value)} /></label>
                  </>
                ) : null}
                {grantKind === "extension" ? (
                  <>
                    <MetaText>Subscription: {activeSubscription?.id ?? "Select a user with a subscription"}</MetaText>
                    <label className="input-wrap"><span className="input-label">Days</span><Input type="number" min={1} value={extensionDays} onChange={(event) => setExtensionDays(event.target.value)} /></label>
                    <label className="input-wrap"><span className="input-label">Reason</span><Input value={extensionReason} onChange={(event) => setExtensionReason(event.target.value)} /></label>
                  </>
                ) : null}
                {grantKind === "discount" ? (
                  <>
                    <label className="input-wrap"><span className="input-label">Discount percent</span><Input type="number" min={1} max={100} value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} /></label>
                    <label className="input-wrap"><span className="input-label">Valid until</span><Input type="datetime-local" value={discountValidUntil} onChange={(event) => setDiscountValidUntil(event.target.value)} /></label>
                  </>
                ) : null}
                <label className="news-page__check">
                  <input type="checkbox" checked={notifyUser} onChange={(event) => setNotifyUser(event.target.checked)} />
                  Notify user in Telegram
                </label>
                <Button
                  type="button"
                  onClick={grant}
                  disabled={!userForGrant || isGranting || (grantKind === "trial" && !defaultPlanId) || (grantKind === "extension" && !activeSubscription) || (grantKind === "discount" && !discountValidUntil)}
                >
                  {isGranting ? "Granting..." : "Apply grant"}
                </Button>
                {grantResult ? (
                  <Card variant="outlined" className="news-page__status">
                    <strong>{grantResult.status}</strong>
                    {grantResult.promo_code ? <span>Code: {grantResult.promo_code}</span> : null}
                    {grantResult.event_id ? <MetaText>event: {grantResult.event_id}</MetaText> : null}
                  </Card>
                ) : null}
              </div>
            </Card>
          </div>
        </TabsPanel>

        <TabsPanel value="history">
          <Card>
            <SectionHeader label="Recent campaigns" note="Redis-backed queue history keeps the latest jobs." />
            {historyRows.length > 0 ? (
              <DataTable
                columns={[
                  { key: "id", header: "ID" },
                  { key: "created", header: "Created" },
                  { key: "status", header: "Status" },
                  { key: "delivery", header: "Delivery" },
                  { key: "message", header: "Message" },
                ]}
                rows={historyRows}
                getRowKey={(row) => row.id}
              />
            ) : (
              <EmptyState title="No campaigns yet" description="Queued broadcasts will appear here." />
            )}
          </Card>
        </TabsPanel>
      </Tabs>
    </PageLayout>
  );
}
