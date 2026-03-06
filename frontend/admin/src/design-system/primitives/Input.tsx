import type { InputHTMLAttributes } from "react";

type InputSize = "sm" | "md" | "lg";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: boolean;
  success?: boolean;
  size?: InputSize;
  /** ID of the element that describes this input (hint or error). Sets aria-describedby. */
  describedById?: string;
}

export function Input({
  error,
  success,
  size = "md",
  className = "",
  describedById,
  "aria-describedby": ariaDescribedBy,
  ...props
}: InputProps) {
  const stateClass = error ? "is-error" : success ? "is-success" : "";
  const sizeClass = size !== "md" ? `input-${size}` : null;
  return (
    <input
      className={["input", sizeClass, stateClass || null, className || null].filter(Boolean).join(" ")}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={describedById ?? ariaDescribedBy ?? undefined}
      {...props}
    />
  );
}
