import type { ConnectionPhase } from "./HomeHeroPanel";
import {
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryLink,
  type MissionPrimaryButtonTone,
} from "./MissionPrimitives";

export interface HomePrimaryActionZoneProps {
  phase: ConnectionPhase;
  primaryTo?: string;
  /** When set and phase is inactive, overrides default "Connect" label (e.g. "Get a plan"). */
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export function HomePrimaryActionZone({
  phase,
  primaryTo,
  primaryLabel: primaryLabelOverride,
  onPrimaryAction,
  secondaryLabel,
  secondaryTo,
}: HomePrimaryActionZoneProps) {
  const defaultLabel =
    phase === "connected" ? "Disconnect" : phase === "connecting" ? "Connecting…" : "Connect";
  const primaryLabel = phase === "inactive" && primaryLabelOverride != null ? primaryLabelOverride : defaultLabel;
  const primaryTone: MissionPrimaryButtonTone = phase === "connected"
    ? "danger"
    : phase === "connecting"
      ? "warning"
      : "default";

  const primaryIcon = phase === "connecting"
    ? (
        <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
          <path d="M20 12a8 8 0 0 0-8-8" />
        </svg>
      )
    : (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path d="M12 3v10" />
          <path d="M7.8 6.8a7 7 0 1 0 8.4 0" />
        </svg>
      );

  return (
    <div className="btn-row">
      {primaryTo && phase === "inactive" ? (
        <MissionPrimaryLink to={primaryTo} tone={primaryTone} onClick={onPrimaryAction}>
          {primaryIcon}
          <span>{primaryLabel}</span>
        </MissionPrimaryLink>
      ) : (
        <MissionPrimaryButton onClick={onPrimaryAction} disabled={phase === "connecting"} tone={primaryTone}>
          {primaryIcon}
          <span>{primaryLabel}</span>
        </MissionPrimaryButton>
      )}
      {secondaryLabel != null && secondaryTo != null && (
        <MissionSecondaryLink to={secondaryTo}>
          <span>{secondaryLabel}</span>
        </MissionSecondaryLink>
      )}
    </div>
  );
}
