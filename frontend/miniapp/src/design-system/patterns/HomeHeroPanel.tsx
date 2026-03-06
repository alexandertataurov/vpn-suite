import {
  MissionCard,
  MissionStatusDot,
  type MissionStatusTone,
  type MissionTone,
} from "./MissionPrimitives";

export type ConnectionPhase = "inactive" | "connecting" | "connected";
type ValueTone = "mut" | "green" | "amber" | "teal" | "red";

export interface HomeHeroPanelProps {
  phase: ConnectionPhase;
  statusText: string;
  statusHint: string;
  subscriptionLabel: string;
  subscriptionTone: ValueTone;
  latencyLabel: string;
  latencyTone: ValueTone;
  bandwidthLabel: string;
  bandwidthTone: ValueTone;
  timeLeftLabel: string;
  timeLeftTone: ValueTone;
}

const phaseClassMap: Record<ConnectionPhase, { tone: MissionTone; glow: Exclude<MissionTone, "blue">; dot: MissionStatusTone }> = {
  inactive: { tone: "red", glow: "red", dot: "inactive" },
  connecting: { tone: "amber", glow: "amber", dot: "connecting" },
  connected: { tone: "green", glow: "green", dot: "online" },
};

const toneClassMap: Record<ValueTone, string> = {
  mut: "mut",
  green: "green",
  amber: "amber",
  teal: "teal",
  red: "red",
};

export function HomeHeroPanel({
  phase,
  statusText,
  statusHint,
  subscriptionLabel,
  subscriptionTone,
  latencyLabel,
  latencyTone,
  bandwidthLabel,
  bandwidthTone,
  timeLeftLabel,
  timeLeftTone,
}: HomeHeroPanelProps) {
  const phaseState = phaseClassMap[phase];

  return (
    <MissionCard tone={phaseState.tone} glowTone={phaseState.glow} className="home-hero">
      <div className="home-hero-status">
        <MissionStatusDot tone={phaseState.dot} />
        <div className="home-hero-status-copy">
          <div className="kv home-hero-title">{statusText}</div>
          <p className="home-hero-sub type-body-sm">{statusHint}</p>
        </div>
      </div>

      <div className="data-grid">
        <div className="data-cell">
          <div className="dc-key">Current subscription</div>
          <div className={`dc-val ${toneClassMap[subscriptionTone]}`}>{subscriptionLabel}</div>
        </div>
        <div className="data-cell">
          <div className="dc-key">Latency</div>
          <div className={`dc-val ${toneClassMap[latencyTone]}`}>{latencyLabel}</div>
        </div>
        <div className="data-cell">
          <div className="dc-key">Total bandwidth</div>
          <div className={`dc-val ${toneClassMap[bandwidthTone]}`}>{bandwidthLabel}</div>
        </div>
        <div className="data-cell">
          <div className="dc-key">Time left</div>
          <div className={`dc-val ${toneClassMap[timeLeftTone]}`}>{timeLeftLabel}</div>
        </div>
      </div>
    </MissionCard>
  );
}
