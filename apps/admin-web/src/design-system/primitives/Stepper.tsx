import type { ReactNode } from "react";

type StepState = "pending" | "active" | "completed" | "error";

export interface StepDefinition {
  id: string;
  label: ReactNode;
  subLabel?: ReactNode;
  /**
   * One-based index label or custom marker (e.g. ✓).
   */
  marker?: ReactNode;
  state: StepState;
}

interface StepperProps {
  steps: StepDefinition[];
  className?: string;
}

export function Stepper({ steps, className = "" }: StepperProps) {
  if (!steps.length) return null;

  return (
    <div className={["stepper", className || null].filter(Boolean).join(" ")} aria-label="Progress">
      {steps.map((step, index) => {
        const classes = ["step", step.state];
        return (
          <div key={step.id ?? index} className={classes.join(" ")}>
            <div className="step-circle">{step.marker ?? index + 1}</div>
            <div className="step-label">{step.label}</div>
            {step.subLabel && <div className="step-sub">{step.subLabel}</div>}
          </div>
        );
      })}
    </div>
  );
}

interface VerticalStepperProps {
  steps: StepDefinition[];
  className?: string;
}

export function VerticalStepper({ steps, className = "" }: VerticalStepperProps) {
  if (!steps.length) return null;

  return (
    <div className={["stepper-vertical", className || null].filter(Boolean).join(" ")}>
      {steps.map((step, index) => {
        const classes = ["step-v", step.state];
        return (
          <div key={step.id ?? index} className={classes.join(" ")}>
            <div className="step-v-track">
              <div className="step-v-circle">{step.marker ?? index + 1}</div>
            </div>
            <div className="step-v-body">
              <div className="step-v-title">{step.label}</div>
              {step.subLabel && <div className="step-v-desc">{step.subLabel}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

