import type { HTMLAttributes, ReactNode } from "react";
import { Button, ButtonRow, MissionProgressBar, type MissionHealthTone } from "@/design-system";

export type ConnectionState = "inactive" | "connecting" | "connected";

const STATE_CARD_CLASS: Record<ConnectionState, string> = {
  inactive: "",
  connecting: "s-connecting",
  connected: "s-connected",
};

const STATE_GLOW_CLASS: Record<ConnectionState, string> = {
  inactive: "g-red",
  connecting: "g-amber",
  connected: "g-green",
};

const STATE_DOT_CLASS: Record<ConnectionState, string> = {
  inactive: "",
  connecting: "connecting",
  connected: "online",
};

export interface ConnectionStatusHeroProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  state: ConnectionState;
  serverKeyLabel?: string;
  serverLabel?: string;
  currentIpKeyLabel?: string;
  currentIp?: string;
  showCurrentIpCell?: boolean;
  protocolKeyLabel?: string;
  protocolLabel?: string;
  onConnect?: () => void;
  onChangeServer?: () => void;
  onMenu?: () => void;
  title?: string;
  hint?: string;
  actions?: ReactNode;
  metrics?: Array<{
    keyLabel: string;
    valueLabel: string;
    percent: number;
    tone?: MissionHealthTone;
  }>;
}

const DEFAULT_TITLE: Record<ConnectionState, string> = {
  inactive: "No active plan",
  connecting: "Setup pending",
  connected: "Setup confirmed",
};

const DEFAULT_HINT: Record<ConnectionState, string> = {
  inactive: "Choose a plan before you issue a device config.",
  connecting: "Finish setup in your VPN app, then confirm it here.",
  connected: "This confirms setup, not a live VPN connection.",
};

const BTN_LABEL: Record<ConnectionState, string> = {
  inactive: "Add device",
  connecting: "View setup",
  connected: "Manage devices",
};

const BTN_ARIA_LABEL: Record<ConnectionState, string> = {
  inactive: "Add device",
  connecting: "View setup",
  connected: "Manage devices",
};

const BTN_TONE: Record<ConnectionState, "default" | "warning" | "danger"> = {
  inactive: "default",
  connecting: "warning",
  connected: "default",
};

/** Content Library 3a: Connection Status Hero. Config-centric copy (mini-app cannot control VPN connection). */
export function ConnectionStatusHero({
  state,
  serverKeyLabel = "Server preset",
  serverLabel = "Fastest available",
  currentIpKeyLabel = "Current IP",
  currentIp = "--",
  showCurrentIpCell = true,
  protocolKeyLabel = "Protocol",
  protocolLabel = "--",
  onConnect,
  onChangeServer,
  onMenu,
  title,
  hint,
  actions,
  metrics = [],
  className = "",
  ...props
}: ConnectionStatusHeroProps) {
  const cardClass = STATE_CARD_CLASS[state];
  const glowClass = STATE_GLOW_CLASS[state];
  const dotClass = STATE_DOT_CLASS[state];
  const showProtocolPill = protocolLabel != null && protocolLabel !== "--";
  const showServerRail = serverLabel != null && serverLabel !== "";
  const showIpRail = showCurrentIpCell && currentIp != null && currentIp !== "--";
  const hasContextRail = showServerRail || showIpRail;

  return (
    <div
      className={["conn-card", cardClass, "stagger-1", className].filter(Boolean).join(" ")}
      id="connCard"
      {...props}
    >
      <div className={`card-glow ${glowClass}`} id="cardGlow" aria-hidden />
      <div className="card-body">
        <div className="card-header">
          <div className={`status-dot ${dotClass}`} aria-hidden />
          <div className="card-title-block">
            <div className="card-title-row">
              <div className="card-title" id="cardTitle">
                {title ?? DEFAULT_TITLE[state]}
              </div>
              {showProtocolPill ? (
                <div className="conn-proto-pill" aria-label={`${protocolKeyLabel}: ${protocolLabel}`}>
                  {protocolLabel}
                </div>
              ) : null}
              <div className="card-actions-row">
                {actions ?? (
                  <>
                    {onMenu != null && (
                      <Button
                        variant="ghost"
                        size="icon"
                        iconOnly
                        className="icon-btn"
                        onClick={onMenu}
                        aria-label="Menu"
                      >
                        <svg fill="none" viewBox="0 0 18 18" stroke="currentColor" strokeWidth={1.6}>
                          <circle cx="9" cy="5" r="1.2" fill="currentColor" />
                          <circle cx="9" cy="9" r="1.2" fill="currentColor" />
                          <circle cx="9" cy="13" r="1.2" fill="currentColor" />
                        </svg>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <p className="card-hint" id="cardHint">
              {hint ?? DEFAULT_HINT[state]}
            </p>
          </div>
        </div>
        {metrics.length > 0 ? (
          <div className="hero-visual-grid" aria-label="Connection overview">
            {metrics.map((metric) => (
              <div key={metric.keyLabel} className="hero-visual-tile">
                <div className="hero-visual-topline">
                  <span className="hero-visual-key">{metric.keyLabel}</span>
                  <span className="hero-visual-value">{metric.valueLabel}</span>
                </div>
                <MissionProgressBar
                  percent={metric.percent}
                  tone={metric.tone ?? "healthy"}
                  staticFill
                  ariaLabel={`${metric.keyLabel} ${metric.valueLabel}`}
                  className="hero-visual-progress"
                />
              </div>
            ))}
          </div>
        ) : null}
        {hasContextRail ? (
          <div className="conn-context-rail" aria-label="Connection context">
            {showServerRail ? (
              <div className="conn-context-chip">
                <span className="conn-context-key">{serverKeyLabel}</span>
                {onChangeServer != null && state !== "inactive" ? (
                  <button
                    type="button"
                    className="conn-context-value conn-context-value--link"
                    onClick={onChangeServer}
                    aria-label="Change server"
                  >
                    {serverLabel}
                  </button>
                ) : (
                  <span className="conn-context-value">{serverLabel}</span>
                )}
              </div>
            ) : null}
            {showIpRail ? (
              <div className="conn-context-chip">
                <span className="conn-context-key">{currentIpKeyLabel}</span>
                <span className="conn-context-value conn-context-value--ip" id="dcIp">
                  {currentIp}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
        {onConnect != null && (
          <ButtonRow className="conn-status-btn-row">
            <Button
              variant="primary"
              size="lg"
              tone={BTN_TONE[state]}
              id="connectBtn"
              onClick={onConnect}
              disabled={false}
              aria-label={BTN_ARIA_LABEL[state]}
            >
              {BTN_LABEL[state]}
            </Button>
          </ButtonRow>
        )}
      </div>
    </div>
  );
}
