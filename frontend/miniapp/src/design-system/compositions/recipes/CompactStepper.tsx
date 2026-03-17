import type { HTMLAttributes } from "react";

export interface CompactStepperItem {
  id: string;
  label: string;
  description?: string;
  state: "complete" | "current" | "upcoming";
}

export interface CompactStepperProps extends HTMLAttributes<HTMLOListElement> {
  items: readonly CompactStepperItem[];
}

export function CompactStepper({
  items,
  className = "",
  ...props
}: CompactStepperProps) {
  return (
    <ol className={["compact-stepper", className].filter(Boolean).join(" ")} {...props}>
      {items.map((item, index) => (
        <li key={item.id} className="compact-stepper__item" data-state={item.state}>
          <span className="compact-stepper__index" aria-hidden>
            {item.state === "complete" ? "✓" : index + 1}
          </span>
          <span className="compact-stepper__copy">
            <span className="compact-stepper__label">{item.label}</span>
            {item.description ? <span className="compact-stepper__description">{item.description}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
