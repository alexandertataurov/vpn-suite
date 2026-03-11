import type { KeyboardEvent } from "react";
import { Skeleton } from "../../components/feedback/Skeleton";
import {
  MissionCard,
  MissionStatusDot,
  type MissionStatusTone,
  type MissionTone,
} from "../mission/Mission";

export type ConnectionPhase = "inactive" | "connecting" | "connected";
export type HomeHeroVariant =
  | "connected"
  | "connecting"
  | "reconnecting"
  | "degraded"
  | "error"
  | "disconnected"
  | "onboarding"
  | "loading";
export type HomeHeroRouteQuality = "optimal" | "degraded" | "forced";
type ValueTone = "mut" | "green" | "amber" | "teal" | "red";

export interface HomeHeroPanelProps {
  variant?: HomeHeroVariant;
  /** Legacy alias. Prefer `variant`. */
  phase?: ConnectionPhase;
  statusText?: string;
  statusHint?: string;
  subscriptionLabel?: string;
  subscriptionShortLabel?: string;
  subscriptionTone?: ValueTone;
  latencyLabel?: string;
  latencyTone?: ValueTone;
  latencyContextLabel?: string;
  bandwidthLabel?: string;
  bandwidthTone?: ValueTone;
  timeLeftLabel?: string;
  timeLeftTone?: ValueTone;
  timeLeftActionLabel?: string;
  onTimeLeftPress?: () => void;
  onSubscriptionPress?: () => void;
  lastUpdated?: string;
  isDataStale?: boolean;
  flashLatency?: boolean;
  attemptCount?: number;
  backoffLabel?: string;
  onboardingTitle?: string;
  onboardingDescription?: string;
  serverFlag?: string;
  serverLocation?: string;
  serverId?: string;
  routeQuality?: HomeHeroRouteQuality;
  routeQualityLabel?: string;
  isServerLoading?: boolean;
  showServerRow?: boolean;
  onServerSelect?: () => void;
  onHeroPress?: () => void;
  heroActionLabel?: string;
}

const phaseClassMap: Record<ConnectionPhase, HomeHeroVariant> = {
  inactive: "disconnected",
  connecting: "connecting",
  connected: "connected",
};

const toneClassMap: Record<ValueTone, string> = {
  mut: "mut",
  green: "green",
  amber: "amber",
  teal: "teal",
  red: "red",
};

const variantClassMap: Record<HomeHeroVariant, { tone: MissionTone; glow: Exclude<MissionTone, "blue"> | null; dot: MissionStatusTone }> = {
  connected: { tone: "green", glow: "green", dot: "online" },
  connecting: { tone: "amber", glow: "amber", dot: "connecting" },
  reconnecting: { tone: "amber", glow: "amber", dot: "connecting" },
  degraded: { tone: "amber", glow: "amber", dot: "warning" },
  error: { tone: "red", glow: "red", dot: "error" },
  disconnected: { tone: "blue", glow: null, dot: "idle" },
  onboarding: { tone: "blue", glow: null, dot: "idle" },
  loading: { tone: "blue", glow: null, dot: "idle" },
};

const variantCopyMap: Record<HomeHeroVariant, { title: string; hint: string }> = {
  connected: {
    title: "Tunnel active",
    hint: "Traffic is protected through the fastest healthy route.",
  },
  connecting: {
    title: "Connecting",
    hint: "We are restoring the secure tunnel and checking route health.",
  },
  reconnecting: {
    title: "Reconnecting",
    hint: "The tunnel dropped briefly. We are retrying the last healthy route.",
  },
  degraded: {
    title: "Tunnel active",
    hint: "Traffic is protected, but latency is elevated and route quality is degraded.",
  },
  error: {
    title: "Tunnel failed",
    hint: "The secure tunnel could not be restored. Retry or inspect logs before reconnecting.",
  },
  disconnected: {
    title: "Protection paused",
    hint: "The tunnel is offline. Reconnect to resume secure routing.",
  },
  onboarding: {
    title: "Finish setup",
    hint: "Import your configuration and complete onboarding before the tunnel can start.",
  },
  loading: {
    title: "Loading",
    hint: "Fetching connection status and device telemetry.",
  },
};

const routeQualityToneMap: Record<HomeHeroRouteQuality, ValueTone> = {
  optimal: "green",
  degraded: "amber",
  forced: "red",
};

const routeQualityLabelMap: Record<HomeHeroRouteQuality, string> = {
  optimal: "Optimal route",
  degraded: "Degraded route",
  forced: "Forced route",
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function onKeyActivate(event: KeyboardEvent<HTMLElement>, callback: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  callback();
}

/**
 * HomeHeroPanel renders the primary connection status surface.
 *
 * Typography reference: `design-system-foundations-typography--reference`
 * Color semantics: `design-system-foundations-color--semantic-rules`
 * Breakpoints: `design-system-foundations-breakpoints--breakpoint-matrix`
 *
 * @token --typo-display-size latency value emphasis
 * @token --typo-h1-size primary connection headline
 * @token --status-green/amber/red latency and route-health semantics
 */
export function HomeHeroPanel({
  variant,
  phase,
  statusText,
  statusHint,
  subscriptionLabel = "No plan",
  subscriptionShortLabel,
  subscriptionTone = "mut",
  latencyLabel = "Unavailable",
  latencyTone = "mut",
  latencyContextLabel,
  bandwidthLabel = "0 GB",
  bandwidthTone = "mut",
  timeLeftLabel = "Not started",
  timeLeftTone = "mut",
  timeLeftActionLabel,
  onTimeLeftPress,
  onSubscriptionPress,
  lastUpdated,
  isDataStale = false,
  flashLatency = false,
  attemptCount,
  backoffLabel,
  onboardingTitle = "Import your AmneziaVPN profile",
  onboardingDescription = "Use the onboarding flow to add your .conf file, validate access, and create the first secure tunnel.",
  serverFlag = "🇩🇪",
  serverLocation,
  serverId,
  routeQuality,
  routeQualityLabel,
  isServerLoading,
  showServerRow = true,
  onServerSelect,
  onHeroPress,
  heroActionLabel,
}: HomeHeroPanelProps) {
  const resolvedVariant = variant ?? phaseClassMap[phase ?? "inactive"];
  const variantState = variantClassMap[resolvedVariant];
  const variantCopy = variantCopyMap[resolvedVariant];
  const resolvedStatusText = statusText ?? variantCopy.title;
  const resolvedStatusHint = statusHint ?? (
    resolvedVariant === "reconnecting" && (attemptCount != null || backoffLabel != null)
      ? [
          attemptCount != null ? `Attempt ${attemptCount}.` : null,
          backoffLabel != null ? `Retrying ${backoffLabel}.` : null,
        ].filter(Boolean).join(" ")
      : variantCopy.hint
  );
  const isLoadingVariant = resolvedVariant === "loading";
  const showMetrics = resolvedVariant !== "onboarding";
  const subscriptionValue = subscriptionShortLabel ?? subscriptionLabel;
  const resolvedRouteQuality = routeQuality ?? (
    resolvedVariant === "degraded" ? "degraded" : resolvedVariant === "error" ? "forced" : "optimal"
  );
  const resolvedRouteQualityLabel = routeQualityLabel ?? routeQualityLabelMap[resolvedRouteQuality];
  const serverIdentityLabel = serverLocation != null
    ? `${serverFlag} ${serverLocation}${serverId ? ` ${serverId}` : ""}`
    : resolvedVariant === "connecting" || resolvedVariant === "reconnecting"
      ? "Selecting server..."
      : "Server not selected";
  const showServerLoading = isServerLoading ?? (resolvedVariant === "connecting" || resolvedVariant === "reconnecting" || isLoadingVariant);
  const isInteractive = onHeroPress != null;
  const showTimeLeftAction = !isLoadingVariant && timeLeftActionLabel != null && onTimeLeftPress != null;
  const showExpiredRenewal = showTimeLeftAction && timeLeftActionLabel === "RENEW NOW";
  const isEmptyState = resolvedVariant === "disconnected" && !showServerRow;
  const interactiveLabel = heroActionLabel ?? (
    resolvedVariant === "connected" || resolvedVariant === "degraded"
      ? "Open disconnect confirmation"
      : "Start connection"
  );

  return (
    <MissionCard
      tone={variantState.tone}
      glowTone={variantState.glow}
      className={joinClasses(
        "home-hero",
        `home-hero--${resolvedVariant}`,
        isEmptyState && "home-hero--empty",
        isDataStale && "home-hero--stale",
        isInteractive && "home-hero--interactive",
      )}
      onClick={onHeroPress}
      onKeyDown={onHeroPress != null ? (event) => onKeyActivate(event, onHeroPress) : undefined}
      role={onHeroPress != null ? "button" : undefined}
      tabIndex={onHeroPress != null ? 0 : undefined}
      aria-label={onHeroPress != null ? interactiveLabel : undefined}
    >
      <div className="home-hero-status">
        <MissionStatusDot tone={variantState.dot} />
        <div className="home-hero-status-copy">
          {isLoadingVariant ? (
            <div className="home-hero-loading-copy" aria-hidden>
              <Skeleton variant="shimmer" width="62%" height={28} />
              <Skeleton variant="shimmer" width="78%" height={14} />
            </div>
          ) : (
            <>
              <div className={joinClasses("kv", "home-hero-title", isEmptyState && "home-hero-title--empty")}>{resolvedStatusText}</div>
              <p className={joinClasses("home-hero-sub", "type-body-sm", `home-hero-sub--${resolvedVariant}`)}>
                {resolvedStatusHint}
              </p>
            </>
          )}
        </div>
      </div>
      {showServerRow ? (
        <button
          type="button"
          className={joinClasses(
            "home-hero-server",
            showServerLoading && "home-hero-server--loading",
            onServerSelect == null && "home-hero-server--static",
          )}
          onClick={(event) => {
            event.stopPropagation();
            onServerSelect?.();
          }}
          disabled={onServerSelect == null}
          aria-label={showServerLoading ? "Selecting server" : "Open server switcher"}
        >
          <span className="home-hero-server-main">
            {showServerLoading ? (
              <Skeleton variant="shimmer" width="66%" height={14} />
            ) : serverLocation != null ? (
              <span className="home-hero-server-id">
                <span className="home-hero-server-flag" aria-hidden>{serverFlag}</span>
                <span className="home-hero-server-location">{serverLocation}</span>
                {serverId ? <span className="home-hero-server-node">{serverId}</span> : null}
              </span>
            ) : (
              <span className="home-hero-server-id">{serverIdentityLabel}</span>
            )}
          </span>
          <span className={joinClasses("home-hero-server-quality", `home-hero-server-quality--${resolvedRouteQuality}`)}>
            {showServerLoading ? (
              <Skeleton variant="shimmer" width={94} height={14} />
            ) : (
              <>
                <span className={joinClasses("home-hero-server-quality-dot", toneClassMap[routeQualityToneMap[resolvedRouteQuality]])} />
                <span>{resolvedRouteQualityLabel}</span>
              </>
            )}
          </span>
        </button>
      ) : null}

      {showMetrics ? (
        <>
          <div className="data-grid home-hero-metrics">
            <div className="data-cell home-hero-metric home-hero-metric--live">
              <div className="dc-key">Latency</div>
              {isLoadingVariant ? (
                <Skeleton variant="shimmer" width="68%" height={20} />
              ) : (
                <div
                  className={joinClasses(
                    "home-hero-metric-main",
                    isDataStale && "home-hero-metric-main--stale",
                  )}
                >
                  <span
                    className={joinClasses(
                      "dc-val",
                      toneClassMap[latencyTone],
                      "home-hero-metric-value",
                      "home-hero-metric-value--live",
                      isDataStale && "home-hero-metric-value--stale",
                      flashLatency && "home-hero-metric-value--flash",
                    )}
                  >
                    {latencyLabel}
                  </span>
                  {latencyContextLabel ? (
                    <span className={joinClasses("home-hero-metric-context", toneClassMap[latencyTone])}>
                      {latencyContextLabel}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            {onTimeLeftPress != null ? (
              <button
                type="button"
                className={joinClasses(
                  "data-cell",
                  "home-hero-metric",
                  "home-hero-metric--live",
                  "home-hero-metric--interactive",
                  timeLeftTone === "amber" && "home-hero-metric--warning",
                  timeLeftTone === "red" && !showExpiredRenewal && "home-hero-metric--critical",
                  showExpiredRenewal && "home-hero-metric--expired",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  onTimeLeftPress();
                }}
                aria-label={showExpiredRenewal ? "Renew now" : `Time left ${timeLeftLabel}. Renew`}
              >
                <div className="dc-key">Time left</div>
                {isLoadingVariant ? (
                  <Skeleton variant="shimmer" width="58%" height={20} />
                ) : (
                  <div className="home-hero-metric-main">
                    <span
                      className={joinClasses(
                        "dc-val",
                        toneClassMap[timeLeftTone],
                        "home-hero-metric-value",
                        "home-hero-metric-value--live",
                        isDataStale && "home-hero-metric-value--stale",
                      )}
                    >
                      {showExpiredRenewal ? timeLeftActionLabel : timeLeftLabel}
                    </span>
                    {showTimeLeftAction && !showExpiredRenewal ? (
                      <span className={joinClasses("home-hero-metric-action", toneClassMap[timeLeftTone])}>
                        {timeLeftActionLabel}
                      </span>
                    ) : null}
                  </div>
                )}
              </button>
            ) : (
              <div className="data-cell home-hero-metric home-hero-metric--live">
                <div className="dc-key">Time left</div>
                {isLoadingVariant ? (
                  <Skeleton variant="shimmer" width="58%" height={20} />
                ) : (
                  <div className="home-hero-metric-main">
                    <span
                      className={joinClasses(
                        "dc-val",
                        toneClassMap[timeLeftTone],
                        "home-hero-metric-value",
                        "home-hero-metric-value--live",
                        isDataStale && "home-hero-metric-value--stale",
                      )}
                    >
                      {timeLeftLabel}
                    </span>
                  </div>
                )}
              </div>
            )}
            {onSubscriptionPress != null ? (
              <button
                type="button"
                className={joinClasses(
                  "data-cell",
                  "home-hero-metric",
                  "home-hero-metric--reference",
                  "home-hero-metric--interactive",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  onSubscriptionPress();
                }}
                aria-label={`Open subscription details for ${subscriptionLabel}`}
              >
                <div className="dc-key">Current subscription</div>
                {isLoadingVariant ? (
                  <Skeleton variant="shimmer" width="82%" height={16} />
                ) : (
                  <div
                    className={joinClasses(
                      "dc-val",
                      toneClassMap[subscriptionTone],
                      "home-hero-metric-value",
                      "home-hero-metric-value--reference",
                      "home-hero-metric-value--truncate",
                      isDataStale && "home-hero-metric-value--stale",
                    )}
                    title={subscriptionLabel}
                  >
                    {subscriptionValue}
                  </div>
                )}
              </button>
            ) : (
              <div className="data-cell home-hero-metric home-hero-metric--reference">
                <div className="dc-key">Current subscription</div>
                {isLoadingVariant ? (
                  <Skeleton variant="shimmer" width="82%" height={16} />
                ) : (
                  <div
                    className={joinClasses(
                      "dc-val",
                      toneClassMap[subscriptionTone],
                      "home-hero-metric-value",
                      "home-hero-metric-value--reference",
                      "home-hero-metric-value--truncate",
                      isDataStale && "home-hero-metric-value--stale",
                    )}
                    title={subscriptionLabel}
                  >
                    {subscriptionValue}
                  </div>
                )}
              </div>
            )}
            <div className="data-cell home-hero-metric home-hero-metric--reference">
              <div className="dc-key">Total bandwidth</div>
              {isLoadingVariant ? (
                <Skeleton variant="shimmer" width="72%" height={16} />
              ) : (
                <div
                  className={joinClasses(
                    "dc-val",
                    toneClassMap[bandwidthTone],
                    "home-hero-metric-value",
                    "home-hero-metric-value--reference",
                    isDataStale && "home-hero-metric-value--stale",
                  )}
                >
                  {bandwidthLabel}
                </div>
              )}
            </div>
          </div>
          {lastUpdated && !isLoadingVariant ? (
            <div className={joinClasses("home-hero-updated", isDataStale && "home-hero-updated--stale")}>
              {isDataStale ? (
                <svg className="home-hero-updated-icon" fill="none" viewBox="0 0 16 16" stroke="currentColor" aria-hidden>
                  <path d="M13 3v4H9" />
                  <path d="M13 7a5 5 0 1 0 1 3" />
                </svg>
              ) : null}
              <span>Updated {lastUpdated}</span>
            </div>
          ) : isLoadingVariant ? (
            <Skeleton variant="shimmer" width={110} height={12} className="home-hero-updated home-hero-updated--placeholder" />
          ) : null}
        </>
      ) : (
        <div className="home-hero-onboarding">
          <div className="home-hero-onboarding-title">{onboardingTitle}</div>
          <p className="home-hero-onboarding-copy">{onboardingDescription}</p>
        </div>
      )}
    </MissionCard>
  );
}
