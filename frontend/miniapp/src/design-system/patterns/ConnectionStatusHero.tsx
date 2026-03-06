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
  currentIp?: string;
  durationLabel?: string;
  trafficLabel?: string;
  protocolLabel?: string;
  onConnect?: () => void;
  onChangeServer?: () => void;
  onNotifications?: () => void;
  onMenu?: () => void;
  notificationCount?: number;
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
  inactive: "Connect",
  connecting: "Connecting…",
  connected: "Disconnect",
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
  currentIp = "--",
  durationLabel = "--",
  trafficLabel = "--",
  protocolLabel = "--",
  onConnect,
  onChangeServer,
  onNotifications,
  onMenu,
  notificationCount,
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
      className={`conn-card ${cardClass} stagger-1 ${className}`.trim()}
      id="connCard"
      {...props}
    >
      <div className={`card-glow ${glowClass}`} id="cardGlow" aria-hidden />
      <div className="card-body">
        <div className="card-header">
          <div className={`status-dot ${dotClass}`} aria-hidden />
          <div className="card-title-block">
            <div className="card-title" id="cardTitle">
              {title ?? DEFAULT_TITLE[state]}
            </div>
            <div className="card-hint" id="cardHint">
              {hint ?? DEFAULT_HINT[state]}
            </div>
          </div>
          <div className="card-actions-row">
            {actions ?? (
              <>
                {onNotifications != null && (
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ position: "relative" }}
                    onClick={onNotifications}
                    aria-label="Notifications"
                  >
                    <svg fill="none" viewBox="0 0 18 18" stroke="currentColor" strokeWidth={1.6}>
                      <path d="M9 2a4.5 4.5 0 0 1 4.5 4.5V9l1.5 2.5H3L4.5 9V6.5A4.5 4.5 0 0 1 9 2z" />
                      <path d="M7.5 14a1.5 1.5 0 0 0 3 0" />
                    </svg>
                    {notificationCount != null && notificationCount > 0 && (
                      <div className="notif-badge" id="notifBadge">
                        {notificationCount}
                      </div>
                    )}
                  </button>
                )}
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
        <div className="data-grid" style={{ marginTop: 14 }}>
          <div className="data-cell">
            <div className="dc-key">Server</div>
            <div className="dc-val teal">{serverLabel}</div>
          </div>
          <div className="data-cell">
            <div className="dc-key">Latency</div>
            <div className={`dc-val ${latencyValClass}`} id="dcLatency">
              {latencyLabel}
            </div>
          </div>
          <div className="data-cell wide">
            <div className="dc-key">Current IP</div>
            <div className="dc-val ip" id="dcIp">
              {currentIp}
            </div>
          </div>
          <div className="data-cell">
            <div className="dc-key">Duration</div>
            <div className={`dc-val ${durationValClass}`} id="dcDuration">
              {durationLabel}
            </div>
          </div>
          <div className="data-cell">
            <div className="dc-key">Traffic</div>
            <div className={`dc-val ${trafficValClass}`} id="dcTraffic">
              {trafficLabel}
            </div>
          </div>
          <div className="data-cell">
            <div className="dc-key">Protocol</div>
            <div className={`dc-val ${protocolValClass}`} id="dcProto">
              {protocolLabel}
            </div>
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className={BTN_CLASS[state]}
            id="connectBtn"
            onClick={onConnect}
            disabled={state === "connecting"}
          >
            {BTN_LABEL[state]}
          </button>
          <button type="button" className="btn-secondary" onClick={onChangeServer}>
            Change Server
          </button>
        </div>
      </div>
    </div>
  );
}
