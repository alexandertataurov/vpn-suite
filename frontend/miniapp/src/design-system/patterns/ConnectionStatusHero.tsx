import type { HTMLAttributes, ReactNode } from "react";

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
  serverLabel?: string;
  latencyLabel?: string;
  currentIpKeyLabel?: string;
  currentIp?: string;
  durationKeyLabel?: string;
  durationLabel?: string;
  trafficKeyLabel?: string;
  trafficLabel?: string;
  protocolKeyLabel?: string;
  protocolLabel?: string;
  onConnect?: () => void;
  onChangeServer?: () => void;
  onMenu?: () => void;
  /** Override title (default from state) */
  title?: string;
  /** Override hint (default from state) */
  hint?: string;
  /** Right slot: e.g. icon buttons */
  actions?: ReactNode;
}

const DEFAULT_TITLE: Record<ConnectionState, string> = {
  inactive: "Connection inactive",
  connecting: "Connecting…",
  connected: "Connected · Secured",
};

const DEFAULT_HINT: Record<ConnectionState, string> = {
  inactive: "Your traffic is not encrypted",
  connecting: "Establishing secure tunnel",
  connected: "All traffic encrypted via AWG",
};

const BTN_LABEL: Record<ConnectionState, string> = {
  inactive: "Connect Now",
  connecting: "Connecting…",
  connected: "Disconnect",
};

const BTN_ARIA_LABEL: Record<ConnectionState, string> = {
  inactive: "Connect Now",
  connecting: "Manage Connection",
  connected: "Manage Connection",
};

const BTN_CLASS: Record<ConnectionState, string> = {
  inactive: "btn-primary",
  connecting: "btn-primary warning",
  connected: "btn-primary danger",
};

/** Content Library 3a: Connection Status Hero. State-driven; updates all elements per spec table. */
export function ConnectionStatusHero({
  state,
  serverLabel = "amnezia-awg",
  latencyLabel = "--",
  currentIpKeyLabel = "Current IP",
  currentIp = "--",
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
  const latencyValClass = state === "connected" ? "green" : "mut";
  const protocolValClass = state === "inactive" ? "mut" : "teal";
  const durationValClass = state === "connected" ? "teal" : "mut";
  const trafficValClass = state === "connected" ? "green" : "mut";

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
              <div className="card-actions-row">
                {actions ?? (
                  <>
                    {onMenu != null && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={onMenu}
                        aria-label="Menu"
                      >
                        <svg fill="none" viewBox="0 0 18 18" stroke="currentColor" strokeWidth={1.6}>
                          <circle cx="9" cy="5" r="1.2" fill="currentColor" />
                          <circle cx="9" cy="9" r="1.2" fill="currentColor" />
                          <circle cx="9" cy="13" r="1.2" fill="currentColor" />
                        </svg>
                      </button>
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
          <div className="data-cell">
            <div className="dc-key">Server</div>
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
            <div className="dc-key">Latency</div>
            <div className={`dc-val ${latencyValClass}`} id="dcLatency">
              {latencyLabel}
            </div>
          </div>
          <div className="data-cell wide">
            <div className="dc-key">{currentIpKeyLabel}</div>
            <div className="dc-val ip" id="dcIp">
              {currentIp}
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
          <div className="data-cell">
            <div className="dc-key">{protocolKeyLabel}</div>
            <div className={`dc-val ${protocolValClass}`} id="dcProto">
              {protocolLabel}
            </div>
          </div>
        </div>
        {state !== "connected" && (
          <div className="btn-row conn-status-btn-row">
            <button
              type="button"
              className={BTN_CLASS[state]}
              id="connectBtn"
              onClick={onConnect}
              disabled={state === "connecting"}
              aria-label={BTN_ARIA_LABEL[state]}
            >
              {BTN_LABEL[state]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
