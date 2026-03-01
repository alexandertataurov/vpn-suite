import { useState, useRef, useCallback, useEffect } from "react";

export interface MechanicalToggleProps {
  /** Current value */
  checked: boolean;
  /** Called when toggle state changes (after successful hold) */
  onChange: (checked: boolean) => void;
  /** Hold duration in ms before state flips. Default 500. */
  holdMs?: number;
  /** Label for accessibility */
  "aria-label"?: string;
  /** Disabled */
  disabled?: boolean;
}

/** Sliding UI switch requiring a 500ms hold to prevent accidental clicks. */
export function MechanicalToggle({
  checked,
  onChange,
  holdMs = 500,
  "aria-label": ariaLabel = "Toggle (hold to confirm)",
  disabled = false,
}: MechanicalToggleProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef(checked);
  const trackRef = useRef<HTMLSpanElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (disabled) return;
    targetRef.current = !checked;
    clearTimer();
    const start = Date.now();
    const interval = 16; // ~60fps
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / holdMs) * 100);
      setHoldProgress(pct);
      if (pct >= 100) {
        clearTimer();
        onChange(targetRef.current);
      }
    }, interval);
  }, [checked, onChange, holdMs, disabled, clearTimer]);

  const cancelHold = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (!trackRef.current) return;
    trackRef.current.style.setProperty("--hold-progress", `${holdProgress}%`);
  }, [holdProgress]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className="mechanical-toggle"
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
    >
      <span className="mechanical-toggle-track" ref={trackRef}>
        <span
          className={`mechanical-toggle-thumb ${checked ? "is-checked" : ""}`.trim()}
        />
        {holdProgress > 0 && holdProgress < 100 && (
          <span
            className="mechanical-toggle-hold-fill"
          />
        )}
      </span>
    </button>
  );
}
