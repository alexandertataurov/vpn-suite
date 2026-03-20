import { type Page, type Route } from "@playwright/test";
import type {
  WebAppBillingHistoryResponse,
  WebAppCreateInvoiceResponse,
  WebAppIssueDeviceResponse,
  WebAppMeDevice,
  WebAppMeResponse,
  WebAppPaymentStatusOut,
  WebAppReferralMyLinkResponse,
  WebAppReferralStatsResponse,
  WebAppServerItem,
  WebAppServersResponse,
  WebAppSubscriptionOffersResponse,
  WebAppUsageResponse,
} from "@vpn-suite/shared";

type JsonObject = Record<string, unknown>;

interface PlanItem {
  id: string;
  name: string;
  duration_days: number;
  price_amount: number;
  price_currency: string;
  device_limit?: number;
  upsell_methods?: string[];
}

interface PlansResponse {
  items: PlanItem[];
}

export interface MockReply {
  status?: number;
  body?: unknown;
}

export interface MiniappMockOptions {
  session?: WebAppMeResponse;
  plans?: PlansResponse;
  usage?: WebAppUsageResponse;
  billingHistory?: WebAppBillingHistoryResponse;
  servers?: WebAppServersResponse;
  referralLink?: WebAppReferralMyLinkResponse;
  referralStats?: WebAppReferralStatsResponse;
  subscriptionOffers?: WebAppSubscriptionOffersResponse;
  meReplies?: MockReply[];
  onboardingReplies?: MockReply[];
  createInvoiceReplies?: MockReply[];
  paymentStatusReplies?: MockReply[];
  promoValidationReplies?: MockReply[];
  restoreReplies?: MockReply[];
  issueDeviceReplies?: MockReply[];
  replaceDeviceReplies?: MockReply[];
  referralAttachReplies?: MockReply[];
  authReplies?: MockReply[];
}

interface RecordedRequest {
  path: string;
  body: unknown;
}

export interface MiniappMockController {
  state: {
    session: WebAppMeResponse;
    plans: PlansResponse;
    usage: WebAppUsageResponse;
    billingHistory: WebAppBillingHistoryResponse;
    servers: WebAppServersResponse;
    referralLink: WebAppReferralMyLinkResponse;
    referralStats: WebAppReferralStatsResponse;
    subscriptionOffers: WebAppSubscriptionOffersResponse;
  };
  requests: {
    telemetry: RecordedRequest[];
    serverSelect: RecordedRequest[];
    restore: RecordedRequest[];
    referralAttach: RecordedRequest[];
    subscription: RecordedRequest[];
    profile: RecordedRequest[];
    devices: RecordedRequest[];
    auth: RecordedRequest[];
  };
}

function iso(value: string): string {
  return new Date(value).toISOString();
}

export function createPlan(overrides: Partial<PlanItem> = {}): PlanItem {
  return {
    id: "plan-basic",
    name: "Starter",
    duration_days: 30,
    price_amount: 249,
    price_currency: "Stars",
    device_limit: 1,
    upsell_methods: [],
    ...overrides,
  };
}

export function createDevice(overrides: Partial<WebAppMeDevice> = {}): WebAppMeDevice {
  return {
    id: "device-1",
    device_name: "iPhone 15",
    issued_at: iso("2030-01-10T10:00:00Z"),
    revoked_at: null,
    status: "idle",
    ...overrides,
  };
}

export function createSession(overrides: Partial<WebAppMeResponse> = {}): WebAppMeResponse {
  return {
    user: {
      id: 1,
      tg_id: 12345,
      display_name: "Alex",
      email: "alex@example.com",
      phone: "+12025550123",
      locale: "en",
      first_connected_at: iso("2025-01-12T09:00:00Z"),
    },
    subscriptions: [
      {
        id: "sub-basic",
        plan_id: "plan-basic",
        status: "active",
        access_status: "enabled",
        valid_until: iso("2030-05-01T00:00:00Z"),
        device_limit: 1,
        auto_renew: true,
      },
    ],
    devices: [],
    public_ip: "203.0.113.10",
    latest_device_delivery: null,
    onboarding: {
      completed: true,
      step: 3,
      version: 2,
      updated_at: iso("2026-01-02T12:00:00Z"),
    },
    routing: {
      recommended_route: "/devices",
      reason: "no_device",
    },
    ...overrides,
  };
}

function defaultUsage(): WebAppUsageResponse {
  return {
    sessions: 2,
    points: [
      { ts: iso("2026-03-01T00:00:00Z"), bytes_in: 32_000_000, bytes_out: 12_000_000 },
      { ts: iso("2026-03-02T00:00:00Z"), bytes_in: 24_000_000, bytes_out: 8_000_000 },
    ],
  };
}

function defaultBillingHistory(): WebAppBillingHistoryResponse {
  return {
    total: 1,
    items: [
      {
        payment_id: "pay-001",
        status: "paid",
        amount: 249,
        currency: "XTR",
        created_at: iso("2026-02-10T08:00:00Z"),
        plan_name: "Starter",
        invoice_ref: "webapp:telegram_stars:pay-001",
        plan_id: "plan-basic",
      },
    ],
  };
}

function defaultServers(): WebAppServersResponse {
  const items: WebAppServerItem[] = [
    {
      id: "srv-us",
      name: "New York",
      region: "US",
      load_percent: 34,
      avg_ping_ms: 46,
      is_recommended: true,
      is_current: true,
    },
    {
      id: "srv-de",
      name: "Frankfurt",
      region: "DE",
      load_percent: 22,
      avg_ping_ms: 91,
      is_recommended: false,
      is_current: false,
    },
  ];
  return { items, total: items.length, auto_select: true };
}

function defaultReferralLink(): WebAppReferralMyLinkResponse {
  return {
    referral_code: "ABC123",
    payload: "ref_ABC123",
    bot_username: "vpn_suite_bot",
  };
}

function defaultReferralStats(): WebAppReferralStatsResponse {
  return {
    total_referrals: 3,
    rewards_applied: 2,
    earned_days: 14,
    active_referrals: 2,
    pending_rewards: 1,
    pending_reward_days: 7,
    invite_goal: 5,
    invite_progress: 3,
    invite_remaining: 2,
  };
}

function defaultSubscriptionOffers(): WebAppSubscriptionOffersResponse {
  return {
    subscription_id: "sub-basic",
    status: "active",
    valid_until: iso("2030-05-01T00:00:00Z"),
    discount_percent: 20,
    can_pause: true,
    can_resume: false,
    offer_pause: true,
    offer_discount: true,
    offer_downgrade: false,
    reason_group: null,
  };
}

function defaultIssueDeviceResponse(nextId = "device-1"): WebAppIssueDeviceResponse {
  return {
    device_id: nextId,
    config: "[Interface]\nPrivateKey = test\nAddress = 10.0.0.2/32",
    config_awg: "[Interface]\nPrivateKey = test\nAddress = 10.0.0.2/32",
    amnezia_vpn_key: "vpn://test-amnezia-key",
    issued_at: iso("2026-03-09T10:00:00Z"),
    node_mode: "awg",
    peer_created: true,
  };
}

function defaultInvoiceResponse(planId: string): WebAppCreateInvoiceResponse {
  return {
    invoice_id: `invoice-${planId}`,
    payment_id: `payment-${planId}`,
    title: planId,
    description: `Invoice for ${planId}`,
    currency: "XTR",
    star_count: 249,
    payload: `payload-${planId}`,
    server_id: "srv-us",
    subscription_id: "sub-basic",
    invoice_link: "https://t.me/$invoice/mock",
  };
}

function defaultPaymentStatus(planId: string): WebAppPaymentStatusOut {
  return {
    payment_id: `payment-${planId}`,
    status: "completed",
    plan_id: planId,
    valid_until: iso("2030-05-01T00:00:00Z"),
  };
}

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: body == null ? "" : JSON.stringify(body),
  });
}

function nextReply(queue: MockReply[] | undefined): MockReply | null {
  if (!queue || queue.length === 0) return null;
  return queue.shift() ?? null;
}

function withStatus(reply: MockReply | null, fallbackBody: unknown): Required<MockReply> {
  return {
    status: reply?.status ?? 200,
    body: reply?.body ?? fallbackBody,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function activeSubscription(session: WebAppMeResponse) {
  return session.subscriptions[0] ?? null;
}

function setCurrentServer(servers: WebAppServersResponse, serverId?: string, autoSelect = false) {
  servers.auto_select = autoSelect;
  for (const item of servers.items) {
    item.is_current = autoSelect ? item.is_recommended : item.id === serverId;
  }
}

export async function injectTelegram(page: Page, options: { startParam?: string } = {}): Promise<void> {
  const { startParam = "" } = options;
  await page.addInitScript(({ currentStartParam }) => {
    document.documentElement.setAttribute("data-e2e", "true");
    const noop = () => {};
    const listeners = new Map<string, Set<(payload?: unknown) => void>>();
    const mainButton = {
      isVisible: false,
      isActive: true,
      isProgressVisible: false,
      text: "",
      setText(text: string) {
        this.text = text;
      },
      show() {
        this.isVisible = true;
      },
      hide() {
        this.isVisible = false;
      },
      enable() {
        this.isActive = true;
      },
      disable() {
        this.isActive = false;
      },
      showProgress() {
        this.isProgressVisible = true;
      },
      hideProgress() {
        this.isProgressVisible = false;
      },
      onClick: noop,
      offClick: noop,
    };
    const backButton = {
      isVisible: false,
      show() {
        this.isVisible = true;
      },
      hide() {
        this.isVisible = false;
      },
      onClick: noop,
      offClick: noop,
    };
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: {
        initData: "e2e-test",
        initDataUnsafe: {
          query_id: "query-1",
          start_param: currentStartParam,
          user: { id: 12345, language_code: "en" },
        },
        ready: noop,
        expand: noop,
        requestFullscreen: noop,
        exitFullscreen: noop,
        disableVerticalSwipes: noop,
        enableVerticalSwipes: noop,
        enableClosingConfirmation: noop,
        disableClosingConfirmation: noop,
        openLink: noop,
        openTelegramLink: noop,
        openInvoice: noop,
        close: noop,
        hideKeyboard: noop,
        onEvent(event: string, cb: (payload?: unknown) => void) {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)?.add(cb);
        },
        offEvent(event: string, cb: (payload?: unknown) => void) {
          listeners.get(event)?.delete(cb);
        },
        MainButton: mainButton,
        BackButton: backButton,
        HapticFeedback: {
          impactOccurred: noop,
          notificationOccurred: noop,
          selectionChanged: noop,
        },
      },
    };
  }, { currentStartParam: startParam });
}

export async function gotoMiniapp(page: Page, path = "/", search = ""): Promise<void> {
  const query = new URLSearchParams(search);
  if (!query.has("tgWebAppData")) {
    query.set("tgWebAppData", "e2e-test");
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const suffix = query.toString();
  await page.goto(`.${normalized}${suffix ? `?${suffix}` : ""}`);
}

export async function setupMiniappApi(
  page: Page,
  options: MiniappMockOptions = {},
): Promise<MiniappMockController> {
  const state = {
    session: clone(options.session ?? createSession()),
    plans: clone(options.plans ?? { items: [createPlan()] }),
    usage: clone(options.usage ?? defaultUsage()),
    billingHistory: clone(options.billingHistory ?? defaultBillingHistory()),
    servers: clone(options.servers ?? defaultServers()),
    referralLink: clone(options.referralLink ?? defaultReferralLink()),
    referralStats: clone(options.referralStats ?? defaultReferralStats()),
    subscriptionOffers: clone(options.subscriptionOffers ?? defaultSubscriptionOffers()),
  };

  const meReplies = [...(options.meReplies ?? [])];
  const onboardingReplies = [...(options.onboardingReplies ?? [])];
  const createInvoiceReplies = [...(options.createInvoiceReplies ?? [])];
  const paymentStatusReplies = [...(options.paymentStatusReplies ?? [])];
  const promoValidationReplies = [...(options.promoValidationReplies ?? [])];
  const restoreReplies = [...(options.restoreReplies ?? [])];
  const issueDeviceReplies = [...(options.issueDeviceReplies ?? [])];
  const replaceDeviceReplies = [...(options.replaceDeviceReplies ?? [])];
  const referralAttachReplies = [...(options.referralAttachReplies ?? [])];
  const authReplies = [...(options.authReplies ?? [])];

  const requests = {
    telemetry: [] as RecordedRequest[],
    serverSelect: [] as RecordedRequest[],
    restore: [] as RecordedRequest[],
    referralAttach: [] as RecordedRequest[],
    subscription: [] as RecordedRequest[],
    profile: [] as RecordedRequest[],
    devices: [] as RecordedRequest[],
    auth: [] as RecordedRequest[],
  };

  let deviceCounter = state.session.devices.length;

  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const postBody = request.postDataJSON?.();

    if (!path.startsWith("/api/v1/")) {
      await route.continue();
      return;
    }

    if (path === "/api/v1/webapp/telemetry" || path === "/api/v1/log/frontend-error") {
      requests.telemetry.push({ path, body: postBody ?? null });
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (path === "/api/v1/health/ready") {
      await fulfillJson(route, 200, { status: "ok" });
      return;
    }

    if (path === "/api/v1/webapp/auth" && method === "POST") {
      requests.auth.push({ path, body: postBody ?? null });
      const reply = withStatus(nextReply(authReplies), {
        session_token: "e2e-session",
        expires_in: 3600,
      });
      await fulfillJson(route, reply.status, reply.body);
      return;
    }

    if (path === "/api/v1/webapp/me" && method === "GET") {
      const reply = withStatus(nextReply(meReplies), state.session);
      await fulfillJson(route, reply.status, reply.body);
      return;
    }

    if (path === "/api/v1/webapp/me" && method === "PATCH") {
      requests.profile.push({ path, body: postBody ?? null });
      state.session.user = {
        ...(state.session.user ?? {}),
        ...(postBody as JsonObject),
      };
      await fulfillJson(route, 200, { user: state.session.user });
      return;
    }

    if (path === "/api/v1/webapp/logout" && method === "POST") {
      await fulfillJson(route, 200, { status: "ok" });
      return;
    }

    if (path === "/api/v1/subscriptions/me" && method === "PATCH") {
      requests.subscription.push({ path, body: postBody ?? null });
      const subscription = activeSubscription(state.session);
      if (subscription && typeof (postBody as { auto_renew?: boolean })?.auto_renew === "boolean") {
        subscription.auto_renew = (postBody as { auto_renew: boolean }).auto_renew;
      }
      await fulfillJson(route, 200, { ok: true });
      return;
    }

    if (path === "/api/v1/webapp/onboarding/state" && method === "POST") {
      const reply = nextReply(onboardingReplies);
      if (reply) {
        await fulfillJson(route, reply.status ?? 200, reply.body ?? {});
        return;
      }
      const body = postBody as { step?: number; completed?: boolean; version?: number };
      state.session.onboarding = {
        completed: !!body.completed,
        step: body.completed ? 3 : (body.step ?? state.session.onboarding.step ?? 0),
        version: body.version ?? state.session.onboarding.version ?? 2,
        updated_at: iso("2026-03-09T12:00:00Z"),
      };
      await fulfillJson(route, 200, { onboarding: state.session.onboarding });
      return;
    }

    if (path === "/api/v1/webapp/plans") {
      await fulfillJson(route, 200, state.plans);
      return;
    }

    if (path === "/api/v1/webapp/usage") {
      await fulfillJson(route, 200, state.usage);
      return;
    }

    if (path === "/api/v1/webapp/payments/history") {
      await fulfillJson(route, 200, state.billingHistory);
      return;
    }

    if (path === "/api/v1/webapp/support/faq" && method === "GET") {
      await fulfillJson(route, 200, {
        items: [
          { title_key: "support.faq_item_connection_title", body_key: "support.faq_item_connection_body" },
          { title_key: "support.faq_item_install_title", body_key: "support.faq_item_install_body" },
        ],
      });
      return;
    }

    if (path === "/api/v1/webapp/promo/validate" && method === "POST") {
      const reply = withStatus(nextReply(promoValidationReplies), {
        valid: true,
        discount_xtr: 50,
        discounted_price_xtr: 199,
        display_label: "20% off",
      });
      await fulfillJson(route, reply.status, reply.body);
      return;
    }

    if (path === "/api/v1/webapp/payments/create-invoice" && method === "POST") {
      const reply = withStatus(
        nextReply(createInvoiceReplies),
        defaultInvoiceResponse((postBody as { plan_id?: string })?.plan_id ?? "plan-basic"),
      );
      await fulfillJson(route, reply.status, reply.body);
      return;
    }

    if (/^\/api\/v1\/webapp\/payments\/[^/]+\/status$/.test(path) && method === "GET") {
      const paymentId = path.split("/").slice(-2)[0] ?? "payment-plan-basic";
      const planId = paymentId.replace(/^payment-/, "") || "plan-basic";
      const reply = withStatus(nextReply(paymentStatusReplies), defaultPaymentStatus(planId));
      if ((reply.body as { status?: string })?.status === "completed") {
        const subscription = activeSubscription(state.session);
        if (subscription) {
          subscription.status = "active";
          subscription.plan_id = planId;
        }
        state.session.routing = { recommended_route: "/devices", reason: "no_device" };
      }
      await fulfillJson(route, reply.status, reply.body);
      return;
    }

    if (path === "/api/v1/webapp/subscription/restore" && method === "POST") {
      requests.restore.push({ path, body: postBody ?? null });
      const reply = withStatus(nextReply(restoreReplies), {
        status: "restored",
        plan_id: "plan-basic",
        redirect_to: "/plan/checkout/plan-basic",
      });
      if (reply.status < 400) {
        const subscription = activeSubscription(state.session);
        if (subscription) {
          subscription.status = "active";
          subscription.access_status = "enabled";
        }
      }
      await fulfillJson(route, reply.status, reply.body);
      return;
    }

    if (path === "/api/v1/webapp/devices/issue" && method === "POST") {
      requests.devices.push({ path, body: postBody ?? null });
      const nextId = `device-${deviceCounter + 1}`;
      const reply = withStatus(nextReply(issueDeviceReplies), defaultIssueDeviceResponse(nextId));
      if (reply.status < 400) {
        deviceCounter += 1;
        state.session.devices.push(
          createDevice({
            id: (reply.body as { device_id?: string })?.device_id ?? nextId,
            device_name: `Device ${deviceCounter}`,
            status: "config_pending",
          }),
        );
      }
      await fulfillJson(route, reply.status, reply.body);
      return;
    }

    if (/^\/api\/v1\/webapp\/devices\/[^/]+\/replace-with-new$/.test(path) && method === "POST") {
      requests.devices.push({ path, body: postBody ?? null });
      const deviceId = path.split("/")[5] ?? "device-1";
      const reply = withStatus(nextReply(replaceDeviceReplies), defaultIssueDeviceResponse(deviceId));
      if (reply.status < 400) {
        const device = state.session.devices.find((item) => item.id === deviceId);
        if (device) {
          device.issued_at = iso("2026-03-10T10:00:00Z");
          device.status = "config_pending";
        }
      }
      await fulfillJson(route, reply.status, reply.body);
      return;
    }

    if (/^\/api\/v1\/webapp\/devices\/[^/]+\/confirm-connected$/.test(path) && method === "POST") {
      requests.devices.push({ path, body: postBody ?? null });
      const deviceId = path.split("/")[5] ?? "device-1";
      const device = state.session.devices.find((item) => item.id === deviceId);
      if (device) {
        device.status = "connected";
        device.last_connection_confirmed_at = iso("2026-03-10T11:00:00Z");
      }
      state.session.routing = { recommended_route: "/", reason: "connected_user" };
      await fulfillJson(route, 200, {});
      return;
    }

    if (/^\/api\/v1\/webapp\/devices\/[^/]+\/revoke$/.test(path) && method === "POST") {
      requests.devices.push({ path, body: postBody ?? null });
      const deviceId = path.split("/")[5] ?? "device-1";
      const device = state.session.devices.find((item) => item.id === deviceId);
      if (device) {
        device.revoked_at = iso("2026-03-10T11:30:00Z");
        device.status = "revoked";
      }
      await fulfillJson(route, 200, {});
      return;
    }

    if (/^\/api\/v1\/webapp\/devices\/[^/]+$/.test(path) && method === "PATCH") {
      requests.devices.push({ path, body: postBody ?? null });
      const deviceId = path.split("/")[5] ?? "device-1";
      const device = state.session.devices.find((item) => item.id === deviceId);
      const body = postBody as { device_name?: string | null };
      if (device && body?.device_name !== undefined) {
        device.device_name = body.device_name ?? null;
      }
      await fulfillJson(route, 200, { status: "ok" });
      return;
    }

    if (path === "/api/v1/webapp/servers" && method === "GET") {
      await fulfillJson(route, 200, state.servers);
      return;
    }

    if (path === "/api/v1/webapp/servers/select" && method === "POST") {
      requests.serverSelect.push({ path, body: postBody ?? null });
      const body = postBody as { server_id?: string; mode?: "auto" | "manual" };
      setCurrentServer(state.servers, body.server_id, body.mode === "auto");
      await fulfillJson(route, 200, {});
      return;
    }

    if (path === "/api/v1/webapp/referral/attach" && method === "POST") {
      requests.referralAttach.push({ path, body: postBody ?? null });
      const reply = withStatus(nextReply(referralAttachReplies), {
        status: "attached",
        attached: true,
        referrer_user_id: 7,
      });
      await fulfillJson(route, reply.status, reply.body);
      return;
    }

    if (path === "/api/v1/webapp/referral/my-link" && method === "GET") {
      await fulfillJson(route, 200, state.referralLink);
      return;
    }

    if (path === "/api/v1/webapp/referral/stats" && method === "GET") {
      await fulfillJson(route, 200, state.referralStats);
      return;
    }

    if (path === "/api/v1/webapp/subscription/offers" && method === "GET") {
      const reasonGroup = url.searchParams.get("reason_group");
      await fulfillJson(route, 200, {
        ...state.subscriptionOffers,
        reason_group: reasonGroup,
      });
      return;
    }

    if (path === "/api/v1/webapp/subscription/pause" && method === "POST") {
      requests.subscription.push({ path, body: postBody ?? null });
      const subscription = activeSubscription(state.session);
      if (subscription) {
        subscription.status = "active";
        subscription.access_status = "paused";
      }
      state.subscriptionOffers.can_pause = false;
      state.subscriptionOffers.can_resume = true;
      await fulfillJson(route, 200, {});
      return;
    }

    if (path === "/api/v1/webapp/subscription/resume" && method === "POST") {
      requests.subscription.push({ path, body: postBody ?? null });
      const subscription = activeSubscription(state.session);
      if (subscription) {
        subscription.status = "active";
        subscription.access_status = "enabled";
      }
      state.subscriptionOffers.can_pause = true;
      state.subscriptionOffers.can_resume = false;
      await fulfillJson(route, 200, {});
      return;
    }

    if (path === "/api/v1/webapp/subscription/cancel" && method === "POST") {
      requests.subscription.push({ path, body: postBody ?? null });
      const subscription = activeSubscription(state.session);
      if (subscription) {
        const body = (postBody ?? {}) as {
          cancel_at_period_end?: boolean;
          pause_instead?: boolean;
        };
        if (body.pause_instead) {
          subscription.status = "paused";
        } else if (body.cancel_at_period_end) {
          subscription.cancel_at_period_end = true;
        } else {
          subscription.status = "cancelled";
        }
      }
      await fulfillJson(route, 200, {});
      return;
    }

    await route.fulfill({ status: 404, body: `Unhandled API route: ${path}` });
  });

  return { state, requests };
}
