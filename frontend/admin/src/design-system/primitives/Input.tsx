import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
}

export function Input({ error, success, className = "", ...props }: InputProps) {
  const stateClass = error ? "is-error" : success ? "is-success" : "";
  return (
    <input
      className={["input", stateClass || null, className || null].filter(Boolean).join(" ")}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  );
}
