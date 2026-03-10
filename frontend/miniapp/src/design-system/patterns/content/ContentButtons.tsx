import type { HTMLAttributes, ReactNode } from "react";

export interface ButtonRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Content Library 11: two-column button row (1fr 1fr). */
export function ButtonRow({ children, className = "", ...props }: ButtonRowProps) {
  return <div className={`btn-row ${className}`.trim()} {...props}>{children}</div>;
}

export interface ButtonRowAutoProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Content Library 11: primary + auto-width secondary. */
export function ButtonRowAuto({ children, className = "", ...props }: ButtonRowAutoProps) {
  return <div className={`btn-row-auto ${className}`.trim()} {...props}>{children}</div>;
}

export interface CardFooterLinkProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

/** Content Library 13: "see all" card footer link. */
export function CardFooterLink({
  children,
  onClick,
  disabled,
  className = "",
  ...props
}: CardFooterLinkProps) {
  return (
    <div
      className={`card-footer-link ${disabled ? "is-disabled" : ""} ${className}`.trim()}
      role="button"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      {...props}
    >
      {children}
      <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
        <path d="M2 7h10M8 4l3 3-3 3" />
      </svg>
    </div>
  );
}
