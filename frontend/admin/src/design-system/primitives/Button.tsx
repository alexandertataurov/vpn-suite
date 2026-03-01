import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@vpn-suite/shared";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  iconOnly?: boolean;
  asChild?: boolean;
  children: ReactNode;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      loading = false,
      loadingText,
      fullWidth = false,
      startIcon,
      endIcon,
      iconOnly = false,
      asChild = false,
      disabled,
      children,
      className,
      style,
      "aria-label": ariaLabel,
      ...rest
    },
    ref
  ) => {
    const resolvedAriaLabel = loading && loadingText ? loadingText : ariaLabel;
    const hasA11yLabel = resolvedAriaLabel ?? (typeof children === "string" && children);
    if (iconOnly && !hasA11yLabel && process.env.NODE_ENV !== "production") {
      console.warn("[Button] iconOnly requires aria-label for accessibility");
    }

    const sizeClass = size === "icon" ? "ds-btn--icon" : `ds-btn--${size}`;
    const classes = cn(
      "ds-btn",
      `ds-btn--${variant}`,
      sizeClass,
      loading && "ds-btn--loading",
      fullWidth && "ds-btn--full",
      className
    );

    const content = loading ? (
      <span className="ds-btn__dots" aria-hidden>
        <span /><span /><span />
      </span>
    ) : (
      <>
        {startIcon ? <span className="ds-btn__icon" aria-hidden>{startIcon}</span> : null}
        {children}
        {endIcon ? <span className="ds-btn__icon" aria-hidden>{endIcon}</span> : null}
      </>
    );

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={classes}
          aria-busy={loading}
          aria-label={resolvedAriaLabel}
          {...rest}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={classes}
        style={style}
        aria-busy={loading}
        aria-label={resolvedAriaLabel}
        {...rest}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
