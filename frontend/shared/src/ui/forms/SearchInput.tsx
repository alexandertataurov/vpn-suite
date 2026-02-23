import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

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
  error?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { label, error, id: idProp, className = "", ...props },
  ref
) {
  const id = idProp ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="input-wrap search-input-wrap">
      {label ? (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      ) : null}
      <span className="search-input-inner">
        <span className="search-input-icon" aria-hidden>
          <SearchIcon />
        </span>
        <input
          ref={ref}
          id={id}
          type="search"
          className={`input search-input ${error ? "input-error" : ""} ${className}`.trim()}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          {...props}
        />
      </span>
      {error ? (
        <span id={`${id}-error`} className="input-error-msg" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
});
