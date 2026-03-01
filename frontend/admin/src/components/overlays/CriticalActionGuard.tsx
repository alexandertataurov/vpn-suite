import { useState } from "react";
import { Button } from "@/design-system";

export interface CriticalActionGuardProps {
  /** Label for the safety toggle */
  toggleLabel: string;
  /** Label for the reveal button */
  buttonLabel: string;
  /** Called when user confirms and clicks Execute */
  onExecute: () => void;
  /** Disabled state for Execute button */
  disabled?: boolean;
  /** Variant for Execute (danger by default) */
  variant?: "danger" | "secondary";
}

export function CriticalActionGuard({
  toggleLabel,
  buttonLabel,
  onExecute,
  disabled = false,
  variant = "danger",
}: CriticalActionGuardProps) {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="critical-action-guard">
      <label className="critical-action-guard-toggle">
        <input
          type="checkbox"
          checked={unlocked}
          onChange={(e) => setUnlocked(e.target.checked)}
          aria-label={toggleLabel}
        />
        <span className="critical-action-guard-toggle-slider" />
        <span className="critical-action-guard-toggle-label">{toggleLabel}</span>
      </label>
      <div className={`critical-action-guard-action${unlocked ? " critical-action-guard-action--revealed" : ""}`}>
        <Button
          variant={variant}
          onClick={onExecute}
          disabled={disabled}
          className="critical-action-guard-btn"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
