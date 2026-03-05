import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { IconChevronLeft } from "@/lib/icons";

export interface BackButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  to?: string;
  label?: string;
}

export function BackButton({ to, label = "Back", className = "", ...props }: BackButtonProps) {
  const content = (
    <>
      <IconChevronLeft size={20} strokeWidth={1.8} aria-hidden />
      <span>{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} aria-label={label} className={`btn btn-ghost btn-lg ds-button ds-button-ghost ${className}`.trim()}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={`btn btn-ghost btn-lg ds-button ds-button-ghost ${className}`.trim()}
      {...props}
    >
      {content}
    </button>
  );
}
