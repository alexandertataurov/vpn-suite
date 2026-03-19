import type { KeyboardEvent } from "react";
import "./BillingPeriodToggle.css";

export type BillingPeriodValue = "monthly" | "annual";

export interface BillingPeriodToggleProps {
  value: BillingPeriodValue;
  onChange: (value: BillingPeriodValue) => void;
  discount?: string;
  monthlyLabel?: string;
  annualLabel?: string;
  annualDisabled?: boolean;
  saveLabel?: string;
}

const OPTIONS: BillingPeriodValue[] = ["monthly", "annual"];

function getNextValue(current: BillingPeriodValue, direction: 1 | -1): BillingPeriodValue {
  const currentIndex = OPTIONS.indexOf(current);
  const nextIndex = (currentIndex + direction + OPTIONS.length) % OPTIONS.length;
  return OPTIONS[nextIndex] ?? current;
}

function handleOptionKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  current: BillingPeriodValue,
  onChange: (value: BillingPeriodValue) => void,
) {
  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      event.preventDefault();
      onChange(getNextValue(current, 1));
      break;
    case "ArrowLeft":
    case "ArrowUp":
      event.preventDefault();
      onChange(getNextValue(current, -1));
      break;
    case "Home":
      event.preventDefault();
      onChange("monthly");
      break;
    case "End":
      event.preventDefault();
      onChange("annual");
      break;
    default:
      break;
  }
}

export function BillingPeriodToggle({
  value,
  onChange,
  discount,
  monthlyLabel = "Monthly",
  annualLabel = "Annual",
  annualDisabled = false,
  saveLabel = "Save",
}: BillingPeriodToggleProps) {
  const handleChange = (nextValue: BillingPeriodValue) => {
    if (nextValue === "annual" && annualDisabled) {
      return;
    }
    onChange(nextValue);
  };

  return (
    <div
      className="seg-track"
      role="radiogroup"
      aria-label="Billing period"
      data-value={value}
    >
      <div className="seg-thumb" aria-hidden="true" />

      <button
        type="button"
        className={`seg-option ${value === "monthly" ? "seg-option--active" : ""}`.trim()}
        role="radio"
        aria-checked={value === "monthly"}
        tabIndex={value === "monthly" ? 0 : -1}
        onClick={() => handleChange("monthly")}
        onKeyDown={(event) => handleOptionKeyDown(event, value, handleChange)}
      >
        <span className="seg-label">{monthlyLabel}</span>
      </button>

      <button
        type="button"
        className={`seg-option ${value === "annual" ? "seg-option--active" : ""}`.trim()}
        role="radio"
        aria-checked={value === "annual"}
        tabIndex={value === "annual" ? 0 : -1}
        aria-disabled={annualDisabled}
        disabled={annualDisabled}
        onClick={() => handleChange("annual")}
        onKeyDown={(event) => handleOptionKeyDown(event, value, handleChange)}
      >
        <span className="seg-label">{annualLabel}</span>
        {discount ? <span className="seg-save-badge">{saveLabel} {discount}</span> : null}
      </button>
    </div>
  );
}
