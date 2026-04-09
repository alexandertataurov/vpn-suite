import { forwardRef, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { ButtonPrimitive } from "./ButtonPrimitive";
import type { ButtonProps, TransientState } from "./Button.types";
import {
  getButtonVariantClass,
  getButtonSizeClass,
  getButtonToneClass,
} from "./Button.variants";

const SUCCESS_REVERT_MS = 1500;
const ERROR_REVERT_MS = 2000;

function resolveComponentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "consumer-light" ? "light" : "dark";
}

function Spinner() {
  return (
    <span className="btn-spinner" aria-hidden>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="var(--color-text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="24 12"
        />
      </svg>
    </span>
  );
}

function renderContent(
  state: TransientState,
  loadingLabel: string,
  successLabel: string,
  errorLabel: string,
  children: ReactNode,
  iconLeft?: ReactNode,
  iconRight?: ReactNode,
  iconOnly?: boolean
) {
  if (state === "loading") {
    return (
      <span className="btn-state-stack" data-status="loading">
        <span className="btn-state" data-active="true">
          <span className="btn-content">
            <Spinner />
            <span className="btn-label" aria-live="polite">
              {loadingLabel}
            </span>
          </span>
        </span>
      </span>
    );
  }
  if (state === "success") {
    return (
      <span className="btn-state-stack" data-status="success">
        <span className="btn-state" data-active="true">
          <span className="btn-content">
            <span className="btn-status-icon" aria-hidden>
              ✓
            </span>
            <span className="btn-label">{successLabel}</span>
          </span>
        </span>
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="btn-state-stack" data-status="error">
        <span className="btn-state" data-active="true">
          <span className="btn-content">
            <span className="btn-status-icon" aria-hidden>
              !
            </span>
            <span className="btn-label">{errorLabel}</span>
          </span>
        </span>
      </span>
    );
  }
  return (
    <span className="btn-state-stack" data-status="idle">
      <span className="btn-state" data-active="true">
        <span className="btn-content">
          {iconLeft ? (
            <span className="btn-icon-slot btn-icon-slot--left" aria-hidden>
              {iconLeft}
            </span>
          ) : null}
          {!iconOnly ? <span className="btn-label">{children}</span> : null}
          {iconRight ? (
            <span className="btn-icon-slot btn-icon-slot--right" aria-hidden>
              {iconRight}
            </span>
          ) : null}
        </span>
      </span>
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    tone,
    loading = false,
    loadingText,
    statusText,
    successText,
    errorText,
    fullWidth = false,
    iconLeft: iconLeftProp,
    iconRight: iconRightProp,
    startIcon,
    endIcon,
    iconOnly = false,
    transientState: controlledState,
    status: statusCompat,
    asChild = false,
    disabled,
    className = "",
    children,
    "aria-label": ariaLabel,
    ...props
  },
  ref
) {
  const [internalState, setInternalState] = useState<TransientState>("idle");
  const [revertOver, setRevertOver] = useState(false);
  const themeAttr = resolveComponentTheme();

  const iconLeft = iconLeftProp ?? startIcon;
  const iconRight = iconRightProp ?? endIcon;

  const isControlled = controlledState !== undefined || statusCompat !== undefined;
  const effectiveState: TransientState = isControlled
    ? (controlledState ?? statusCompat ?? "idle")
    : loading
      ? "loading"
      : internalState;

  const displayState: TransientState =
    revertOver && (effectiveState === "success" || effectiveState === "error")
      ? "idle"
      : effectiveState;

  useEffect(() => {
    if (loading) {
      setInternalState("loading");
      setRevertOver(false);
    } else if (!isControlled && effectiveState === "loading") {
      setInternalState("idle");
    }
  }, [isControlled, loading, effectiveState]);

  useEffect(() => {
    if (effectiveState === "success") {
      setRevertOver(false);
      const t = setTimeout(() => {
        setRevertOver(true);
        if (!isControlled) setInternalState("idle");
      }, SUCCESS_REVERT_MS);
      return () => clearTimeout(t);
    }
    if (effectiveState === "error") {
      setRevertOver(false);
      const t = setTimeout(() => {
        setRevertOver(true);
        if (!isControlled) setInternalState("idle");
      }, ERROR_REVERT_MS);
      return () => clearTimeout(t);
    }
    setRevertOver(false);
    return undefined;
  }, [effectiveState, isControlled]);

  const sizeCls = getButtonSizeClass(size);
  const toneCls =
    variant === "primary" && tone && tone !== "default"
      ? getButtonToneClass(tone)
      : "";

  const defaultLabel = typeof children === "string" ? children : "";
  const loadingLabel = loadingText ?? statusText ?? defaultLabel;
  const successLabel = successText ?? "Saved";
  const errorLabel = errorText ?? "Failed";

  const resolvedAriaLabel =
    ariaLabel ??
    (displayState === "loading"
      ? loadingLabel
      : displayState === "success"
        ? successLabel
        : displayState === "error"
          ? errorLabel
          : defaultLabel);

  const mergedClassName = cn(
    "btn",
    getButtonVariantClass(variant),
    sizeCls,
    toneCls,
    iconOnly && "btn-icon-only",
    displayState !== "idle" && "btn-has-status",
    displayState === "loading" && "btn-loading",
    displayState === "success" && "btn-transient-success",
    displayState === "error" && "btn-transient-error",
    fullWidth && "btn-full-width btn--full",
    className
  );

  const primitiveStatus =
    displayState === "loading"
      ? "loading"
      : displayState === "success"
        ? "success"
        : displayState === "error"
          ? "error"
          : "idle";

  if (asChild) {
    return (
      <ButtonPrimitive
        ref={ref}
        status={primitiveStatus}
        asChild
        className={mergedClassName}
        aria-label={resolvedAriaLabel}
        {...props}
        data-theme={themeAttr}
      >
        {children}
      </ButtonPrimitive>
    );
  }

  const content = renderContent(
    displayState,
    loadingLabel,
    successLabel,
    errorLabel,
    children,
    iconLeft,
    iconRight,
    iconOnly
  );

  return (
    <ButtonPrimitive
      ref={ref}
      status={primitiveStatus}
      disabled={disabled}
      className={mergedClassName}
      aria-label={resolvedAriaLabel}
      {...props}
      data-theme={themeAttr}
    >
      {content}
    </ButtonPrimitive>
  );
});
