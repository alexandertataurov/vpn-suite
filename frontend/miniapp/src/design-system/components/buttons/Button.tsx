import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../../utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";
export type ButtonTone = "default" | "warning" | "danger";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  kind?: "default" | "connect";
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  iconOnly?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  outline: "btn-outline",
  danger: "btn-danger",
  link: "btn-link",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
  icon: "btn-icon",
};

/** Class string for link-styled-as-button (e.g. ButtonLink). */
export function getButtonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  const sizeCls = size === "icon" ? "btn-sm btn-icon" : sizeClass[size];
  return `btn ${variantClass[variant]} ${sizeCls} ${extra}`.trim();
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    tone,
    kind = "default",
    loading = false,
    loadingText,
    fullWidth = false,
    startIcon,
    endIcon,
    iconOnly = false,
    asChild = false,
    disabled,
    className = "",
    children,
    "aria-label": ariaLabel,
    ...props
  },
  ref
) {
  const effectiveSize = kind === "connect" ? "lg" : size;

  const resolvedAriaLabel = loading && loadingText ? loadingText : ariaLabel;
  const hasA11yLabel = resolvedAriaLabel ?? (typeof children === "string" && children);

  if (iconOnly && !hasA11yLabel && process.env.NODE_ENV !== "production") {
    console.warn("[Button] iconOnly requires aria-label for accessibility");
  }

  const sizeCls = effectiveSize === "icon" ? "btn-sm btn-icon" : sizeClass[effectiveSize];
  const connectClass = kind === "connect" ? "connect-button" : "";
  const toneClass = variant === "primary" && tone && tone !== "default" ? tone : "";

  const content = loading ? (
    <>
      <span className="btn-spinner" aria-hidden />
      {loadingText ? <span aria-live="polite">{loadingText}</span> : children}
    </>
  ) : (
    <>
      {startIcon ? <span className="btn-icon-slot" aria-hidden>{startIcon}</span> : null}
      {children}
      {endIcon ? <span className="btn-icon-slot" aria-hidden>{endIcon}</span> : null}
    </>
  );

  const mergedClassName = cx(
        "btn",
        variantClass[variant],
        sizeCls,
        connectClass,
        toneClass,
        fullWidth && "btn-full-width",
        className
      );

  if (asChild) {
    return (
      <Slot ref={ref} className={mergedClassName} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button ref={ref} type="button"
      className={mergedClassName}
      disabled={disabled ?? loading}
      aria-busy={loading}
      aria-label={resolvedAriaLabel}
      {...props}
    >
      {content}
    </button>
  );
});
