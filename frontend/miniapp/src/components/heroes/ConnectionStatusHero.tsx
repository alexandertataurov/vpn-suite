import type { HTMLAttributes, ReactNode } from "react";
import { Button, ButtonRow } from "@/design-system";

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
  latencyKeyLabel?: string;
  latencyLabel?: string;
  currentIpKeyLabel?: string;
  currentIp?: string;
  showCurrentIpCell?: boolean;
  durationKeyLabel?: string;
  durationLabel?: string;
  trafficKeyLabel?: string;
  trafficLabel?: string;
  protocolKeyLabel?: string;
  protocolLabel?: string;
  onConnect?: () => void;
  onChangeServer?: () => void;
  onMenu?: () => void;
  title?: string;
  hint?: string;
  actions?: ReactNode;
}

const DEFAULT_TITLE: Record<ConnectionState, string> = {
  inactive: "Config inactive",
  connecting: "Config pending",
  connected: "Configuration active",
};

const DEFAULT_HINT: Record<ConnectionState, string> = {
  inactive: "Set up config on a device",
  connecting: "Add device to get config",
  connected: "Last synced with device",
};

const BTN_LABEL: Record<ConnectionState, string> = {
  inactive: "Add device",
  connecting: "Finish setup",
  connected: "Disconnect",
};

const BTN_ARIA_LABEL: Record<ConnectionState, string> = {
  inactive: "Add device",
  connecting: "Finish setup",
  connected: "Manage Connection",
};

const BTN_TONE: Record<ConnectionState, "default" | "warning" | "danger"> = {
  inactive: "default",
  connecting: "warning",
  connected: "danger",
};

/** Content Library 3a: Connection Status Hero. Config-centric copy (mini-app cannot control VPN connection). */
export function ConnectionStatusHero({
  state,
  serverKeyLabel = "Server preset",
  serverLabel = "Fastest available",
  latencyKeyLabel = "Server latency",
  latencyLabel = "--",
  currentIpKeyLabel = "Current IP",
  currentIp = "--",
  showCurrentIpCell = true,
  durationKeyLabel = "Duration",
  durationLabel = "--",
  trafficKeyLabel = "Traffic",
  trafficLabel = "--",
  protocolKeyLabel = "Protocol",
  protocolLabel = "--",
  onConnect,
  onChangeServer,
  onMenu,
  title,
  hint,
  actions,
  className = "",
  ...props
}: ConnectionStatusHeroProps) {
  const cardClass = STATE_CARD_CLASS[state];
  const glowClass = STATE_GLOW_CLASS[state];
  const dotClass = STATE_DOT_CLASS[state];
  const latencyValClass = "mut";
  const durationValClass = "mut";
  const trafficValClass = state === "connected" ? "teal" : "mut";
  const showProtocolPill = protocolLabel != null && protocolLabel !== "--";

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
            <div className="card-hint" id="cardHint">
              {hint ?? DEFAULT_HINT[state]}
            </div>
          </div>
        </div>
        <div className="data-grid conn-status-data-grid">
          <div className="data-cell wide">
            <div className="dc-key">{serverKeyLabel}</div>
            {onChangeServer != null && state !== "inactive" ? (
              <button
                type="button"
                className="dc-val teal conn-server-link"
                onClick={onChangeServer}
                aria-label="Change server"
              >
                {serverLabel}
              </button>
            ) : (
              <div className="dc-val teal">{serverLabel}</div>
            )}
          </div>
          <div className="data-cell">
            <div className="dc-key">{latencyKeyLabel}</div>
            <div className={`dc-val ${latencyValClass}`} id="dcLatency">
              {latencyLabel}
            </div>
          </div>
          <div className="data-cell">
            <div className="dc-key">{durationKeyLabel}</div>
            <div className={`dc-val ${durationValClass}`} id="dcDuration">
              {durationLabel}
            </div>
          </div>
          <div className="data-cell">
            <div className="dc-key">{trafficKeyLabel}</div>
            <div className={`dc-val ${trafficValClass}`} id="dcTraffic">
              {trafficLabel}
            </div>
          </div>
          {showCurrentIpCell ? (
            <div className="data-cell">
              <div className="dc-key">{currentIpKeyLabel}</div>
              <div className="dc-val ip" id="dcIp">
                {currentIp}
              </div>
            </div>
          ) : null}
        </div>
        {state !== "connected" && (
          <ButtonRow className="conn-status-btn-row">
            <Button
              variant="primary"
              size="lg"
              tone={BTN_TONE[state]}
              id="connectBtn"
              onClick={onConnect}
              disabled={state === "connecting"}
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
