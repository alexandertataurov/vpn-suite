import { forwardRef, type ReactNode } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";
import { Field } from "../layout/Field";

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: ReactNode;
  error?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { label, description, error, id: idProp, className = "", ...props },
  ref
) {
  const id = idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);

  const control = (
    <span className="search-input-inner">
      <span className="search-input-icon" aria-hidden>
        <SearchIcon />
      </span>
      <input
        ref={ref}
        id={id}
        type="search"
        className={cn("input", "search-input", error && "input-error", className)}
        aria-invalid={!!error}
        aria-describedby={error && id ? `${id}-error` : description && id ? `${id}-hint` : undefined}
        autoComplete="off"
        {...props}
      />
    </span>
  );

  if (label != null || description != null || error != null) {
    return (
      <Field id={id} label={label} description={description} error={error} className="search-input-wrap">
        {control}
      </Field>
    );
  }

  return <div className="search-input-wrap">{control}</div>;
});
