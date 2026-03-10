import { Link } from "react-router-dom";
import { Button } from "../../components/buttons/Button";
import { IconHelpCircle } from "../../icons";
import type { ConnectionPhase } from "./HomeHeroPanel";
import {
  MissionPrimaryButton,
  MissionPrimaryLink,
  type MissionPrimaryButtonTone,
} from "../mission/Mission";

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
    phase === "connected" ? "Manage devices" : phase === "connecting" ? "View setup" : "Choose plan";
  const primaryLabel = primaryLabelOverride ?? defaultLabel;
  const primaryTone: MissionPrimaryButtonTone = phase === "connected"
    ? "default"
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
    <div className="miniapp-compact-actions">
      {primaryTo ? (
        <MissionPrimaryLink to={primaryTo} tone={primaryTone} onClick={onPrimaryAction} className="miniapp-compact-action">
          {primaryIcon}
          <span>{primaryLabel}</span>
        </MissionPrimaryLink>
      ) : (
        <MissionPrimaryButton
          onClick={onPrimaryAction}
          disabled={phase === "connecting" && !onPrimaryAction}
          tone={primaryTone}
          className="miniapp-compact-action"
        >
          {primaryIcon}
          <span>{primaryLabel}</span>
        </MissionPrimaryButton>
      )}
      {secondaryLabel != null && secondaryTo != null && (
        <Button asChild variant="link" size="sm" className="miniapp-inline-link">
          <Link to={secondaryTo}>
            <IconHelpCircle size={14} strokeWidth={1.8} />
            <span>{secondaryLabel}</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
