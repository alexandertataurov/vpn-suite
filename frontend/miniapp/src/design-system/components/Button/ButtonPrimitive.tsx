import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonStatus } from "./Button.types";

export interface ButtonPrimitiveProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Renders as child element (e.g. <a>) instead of <button> */
  asChild?: boolean;
  /** Drives aria-busy, data-loading, disabled when loading */
  status?: ButtonStatus;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Headless button primitive — handles keyboard, aria, focus, disabled.
 * No visual styling; styled layer (Button) applies tokens via className.
 */
export const ButtonPrimitive = forwardRef<
  HTMLButtonElement,
  ButtonPrimitiveProps
>(function ButtonPrimitive(
  {
    asChild = false,
    status = "idle",
    disabled,
    className = "",
    children,
    "aria-label": ariaLabel,
    ...props
  },
  ref
) {
  const isDisabled = disabled ?? status === "loading";

  if (asChild) {
    return (
      <Slot
        ref={ref}
        className={className}
        data-disabled={isDisabled ? "true" : undefined}
        data-loading={status === "loading" ? "true" : undefined}
        data-status={status}
        data-pressable="true"
        aria-busy={status === "loading"}
        aria-disabled={isDisabled}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      disabled={isDisabled}
      data-loading={status === "loading" ? "true" : undefined}
      data-status={status}
      data-pressable="true"
      aria-busy={status === "loading"}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
});
