import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../utils/cn";

export type PrimitiveButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type PrimitiveButtonSize = "sm" | "md";
export type PrimitiveButtonIconPosition = "start" | "end";

export interface PrimitiveButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: PrimitiveButtonVariant;
  size?: PrimitiveButtonSize;
  icon?: ReactNode;
  iconPosition?: PrimitiveButtonIconPosition;
  iconOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, PrimitiveButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    icon,
    iconPosition = "start",
    iconOnly = false,
    loading = false,
    fullWidth = false,
    asChild = false,
    disabled,
    className = "",
    children,
    "aria-label": ariaLabel,
    ...props
  },
  ref
) {
  const resolvedAriaLabel = ariaLabel ?? (typeof children === "string" ? children : undefined);
  if (iconOnly && !resolvedAriaLabel && process.env.NODE_ENV !== "production") {
    console.warn("[PrimitiveButton] iconOnly requires aria-label for accessibility");
  }

  const content = (
    <>
      {icon && iconPosition === "start" ? <span aria-hidden>{icon}</span> : null}
      {children}
      {icon && iconPosition === "end" ? <span aria-hidden>{icon}</span> : null}
    </>
  );

  const mergedClassName = cn(
    "ds-button",
    fullWidth && "ds-button-full",
    className
  );

  const sharedProps = {
    ref,
    className: mergedClassName,
    "data-variant": variant,
    "data-size": size,
    "aria-busy": loading,
    "aria-label": resolvedAriaLabel,
    disabled: disabled ?? loading,
    ...props,
  };

  if (asChild) {
    return (
      <Slot {...sharedProps}>
        {content}
      </Slot>
    );
  }

  return (
    <button type="button" {...sharedProps}>
      {content}
    </button>
  );
});
