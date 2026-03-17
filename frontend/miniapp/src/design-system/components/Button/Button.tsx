import { forwardRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { ButtonPrimitive } from "./ButtonPrimitive";
import type { ButtonProps, ButtonStatus } from "./Button.types";
import { getButtonVariantClass, getButtonSizeClass } from "./Button.variants";

const MIN_CH_BUCKETS = [4, 8, 12, 16, 20, 24] as const;

function renderContent(
  resolvedStatus: ButtonStatus,
  loadingLabel: string,
  successLabel: string,
  errorLabel: string,
  children: ReactNode,
  startIcon?: ReactNode,
  endIcon?: ReactNode
) {
  if (resolvedStatus === "loading") {
    return (
      <span className="btn-state-stack" data-status={resolvedStatus}>
        <span className="btn-state" data-active="true">
          <span className="btn-content">
            <span className="btn-spinner" aria-hidden />
            <span className="btn-label" aria-live="polite">
              {loadingLabel}
            </span>
          </span>
        </span>
      </span>
    );
  }
  if (resolvedStatus === "success") {
    return (
      <span className="btn-state-stack" data-status={resolvedStatus}>
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
  if (resolvedStatus === "error") {
    return (
      <span className="btn-state-stack" data-status={resolvedStatus}>
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
    <span className="btn-state-stack" data-status={resolvedStatus}>
      <span className="btn-state" data-active="true">
        <span className="btn-content">
          {startIcon ? (
            <span className="btn-icon-slot" aria-hidden>
              {startIcon}
            </span>
          ) : null}
          <span className="btn-label">{children}</span>
          {endIcon ? (
            <span className="btn-icon-slot" aria-hidden>
              {endIcon}
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
    kind = "default",
    loading = false,
    loadingText,
    fullWidth = false,
    startIcon,
    endIcon,
    iconOnly = false,
    status,
    statusText,
    successText,
    errorText,
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
  const sizeCls =
    effectiveSize === "icon" ? "btn-md btn-icon" : getButtonSizeClass(effectiveSize);
  const connectClass = kind === "connect" ? "connect-button" : "";
  const toneClass = variant === "primary" && tone && tone !== "default" ? tone : "";
  const resolvedStatus: ButtonStatus = status ?? (loading ? "loading" : "idle");

  const defaultLabel = typeof children === "string" ? children : "";
  const loadingLabel = statusText ?? loadingText ?? defaultLabel;
  const successLabel = successText ?? statusText ?? loadingLabel;
  const errorLabel = errorText ?? statusText ?? loadingLabel;
  const resolvedAriaLabel =
    ariaLabel ??
    (resolvedStatus === "loading"
      ? loadingLabel
      : resolvedStatus === "success"
        ? successLabel
        : resolvedStatus === "error"
          ? errorLabel
          : defaultLabel);

  const widthCandidates = [
    defaultLabel,
    loadingLabel,
    successLabel,
    errorLabel,
  ];
  const buttonMinCharacters = Math.max(
    ...widthCandidates.map((c) => c.length),
    0
  );
  const minChClass =
    buttonMinCharacters > 0
      ? `btn-min-ch-${MIN_CH_BUCKETS.find((b) => b >= buttonMinCharacters) ?? 24}`
      : "";

  const mergedClassName = cn(
    "btn",
    getButtonVariantClass(variant),
    sizeCls,
    connectClass,
    toneClass,
    minChClass,
    iconOnly && "btn-icon-only",
    resolvedStatus !== "idle" && "btn-has-status",
    resolvedStatus === "loading" && "btn-loading",
    fullWidth && "btn-full-width",
    className
  );

  if (asChild) {
    return (
      <ButtonPrimitive
        ref={ref}
        status={resolvedStatus}
        asChild
        className={mergedClassName}
        aria-label={resolvedAriaLabel}
        {...props}
      >
        {children}
      </ButtonPrimitive>
    );
  }

  const content = renderContent(
    resolvedStatus,
    loadingLabel,
    successLabel,
    errorLabel,
    children,
    startIcon,
    endIcon
  );

  return (
    <ButtonPrimitive
      ref={ref}
      status={resolvedStatus}
      disabled={disabled}
      className={mergedClassName}
      aria-label={resolvedAriaLabel}
      {...props}
    >
      {content}
    </ButtonPrimitive>
  );
});
