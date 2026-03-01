import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@vpn-suite/shared";

export type IconButtonVariant = "primary" | "ghost" | "danger" | "outline";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  className?: string;
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      loading = false,
      disabled,
      icon,
      className,
      "aria-label": ariaLabel,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-label={ariaLabel}
        className={cn(
          "ds-icon-btn",
          `ds-icon-btn--${variant}`,
          `ds-icon-btn--${size}`,
          loading && "ds-icon-btn--loading",
          className
        )}
        {...rest}
      >
        {loading ? (
          <span className="ds-icon-btn__dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
