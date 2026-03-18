// Why: explicit exports keep the shared package surface controlled and auditable.
export { useDebounce } from "./hooks/useDebounce";
export { useLocalStorage } from "./hooks/useLocalStorage";

export { cn } from "./utils/cn";
export { getErrorMessage } from "./utils/error";
export {
  formatDate,
  formatDateDisplay,
  formatDateLong,
  formatDateTime,
  formatRelative,
  formatPct,
  formatPercent01,
  formatTime,
  formatTimeAxis,
  formatDurationShort,
  formatBytes,
  formatRate,
  safeNumber,
} from "./utils/format";
export {
  STATUS_TOKENS,
  serverStatusToVariant,
  userStatusToVariant,
  subscriptionStatusToVariant,
  paymentStatusToVariant,
  streamStatusToVariant,
  containerStatusToVariant,
  deviceStatusToVariant,
  connectionStatusToVariant,
  alertSeverityToVariant,
  dataStatusToVariant,
} from "./utils/statusMap";

export { ApiError, isApiErrorBody, type ApiErrorBody } from "./types/api-error";

export type { ApiResponse, ApiResponseMeta, PaginatedList } from "./types/api.types";
export type {
  LiveClusterState,
  LiveConnectionState,
  LiveNodeState,
  WebappTelemetryEventType,
  WebappTelemetryPayloadBase,
  WebVitalTelemetryPayload,
  WebappTelemetryEventMap,
  WebappTelemetryPayloadFor,
  MiniappEventName,
  AdminEventName,
  AnalyticsEventName,
  SharedEventProperties,
} from "./types/telemetry.types";
export type { StatusMapVariant, StatusVariant } from "./utils/statusMap";

export {
  EVENT_VERSION,
  APP_NAMES,
  initPostHog,
  getPostHog,
  initFaro,
  getFaroTraceContext,
  isFaroInitialized,
  track,
  identify,
  reset,
  setContext,
  setBackendSink,
  trackError,
  trackTiming,
  getAppName,
} from "./analytics";
export type { PostHogConfig, FaroConfig, TrackPayload, TrackOptions, IdentifyOptions } from "./analytics";
export type { FormatDateTimeOptions, TimeZoneMode } from "./utils/format";
export type {
  WebAppAuthResponse,
  WebAppBillingHistoryItem,
  WebAppBillingHistoryResponse,
  WebAppBillingHistoryStatus,
  WebAppCreateInvoiceResponse,
  WebAppIssueDeviceResponse,
  WebAppMeDevice,
  WebAppLogoutResponse,
  WebAppMeProfileUpdate,
  WebAppMeProfileUpdateResponse,
  WebAppMeResponse,
  WebAppMeRouting,
  WebAppMeSubscription,
  WebAppMeUser,
  WebAppOnboardingState,
  WebAppOnboardingStateRequest,
  WebAppOnboardingStateResponse,
  WebAppPaymentStatusOut,
  WebAppPromoValidateResponse,
  WebAppReferralMyLinkResponse,
  WebAppReferralStatsResponse,
  WebAppServerItem,
  WebAppServersResponse,
  WebAppSubscriptionOffersResponse,
  UserAccessResponse,
  UserAccessStatus,
  WebAppUsagePoint,
  WebAppUsageResponse,
} from "./types/webapp";
