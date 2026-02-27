import { Panel, ButtonLink } from "@vpn-suite/shared/ui";

export interface ConnectionStatusCardProps {
  connected: boolean;
  locationLabel: string;
  primaryActionLabel: string;
  primaryActionTo: string;
  onPrimaryClick?: () => void;
}

export function ConnectionStatusCard({
  connected,
  locationLabel,
  primaryActionLabel,
  primaryActionTo,
  onPrimaryClick,
}: ConnectionStatusCardProps) {
  return (
    <Panel
      className={`card connection-status-card ${
        connected ? "is-connected" : "is-disconnected"
      }`}
    >
      <div className="connection-status-row">
        <span
          className={`connection-status-dot ${connected ? "connected" : "disconnected"}`}
          aria-hidden
        />
        <span className="connection-status-label">
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <p className="connection-status-location text-muted fs-sm mb-md">
        Location: {locationLabel}
      </p>
      <ButtonLink
        to={primaryActionTo}
        kind="connect"
        className="connection-status-cta"
        onClick={onPrimaryClick}
      >
        {primaryActionLabel}
      </ButtonLink>
    </Panel>
  );
}
