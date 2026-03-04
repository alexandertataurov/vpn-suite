import { Panel, H2, Body, Caption } from "../ui";

export interface HomeHeroPanelProps {
  connected: boolean;
  locationLabel: string;
  planId: string;
  daysLeft: number;
  subStatus: "active" | "expired" | "none";
  deviceCount: number;
  deviceLimit: number | null;
}

export function HomeHeroPanel({
  connected,
  locationLabel,
  planId,
  daysLeft,
  subStatus,
  deviceCount,
  deviceLimit,
}: HomeHeroPanelProps) {
  const primaryLabel = connected ? "Connected" : "Not connected";

  let subLine: string;
  if (connected) {
    subLine = `Location: ${locationLabel}`;
  } else if (subStatus === "none") {
    subLine = "Choose a plan";
  } else if (subStatus === "expired") {
    subLine = "Plan expired";
  } else {
    const daysLabel =
      daysLeft <= 0
        ? "Expires today"
        : daysLeft === 1
          ? "1 day left"
          : `${daysLeft} days left`;
    subLine = planId ? `Plan ${planId} · ${daysLabel}` : daysLabel;
  }

  const contextLine =
    subStatus === "active" && deviceLimit != null
      ? `${deviceCount}/${deviceLimit} devices`
      : null;

  return (
    <Panel
      className={`instrument-card stagger-item ${connected ? "instrument-card--active" : "instrument-card--inactive"} home-hero-panel home-hero-panel--${connected ? "connected" : "disconnected"}`}
    >
      <H2 className="home-hero-primary tracking-trim" tabular>
        {primaryLabel}
      </H2>
      <Body className="home-hero-sub">{subLine}</Body>
      {contextLine && (
        <Caption className="home-hero-context" tabular>
          {contextLine}
        </Caption>
      )}
    </Panel>
  );
}
