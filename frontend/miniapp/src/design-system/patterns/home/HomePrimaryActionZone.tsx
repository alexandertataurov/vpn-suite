import { Link } from "react-router-dom";
import { Button } from "../../components/buttons/Button";
import { IconAlertTriangle } from "../../icons";
import type { ConnectionPhase } from "./HomeHeroPanel";
import {
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryButton,
  MissionSecondaryLink,
  type MissionPrimaryButtonTone,
} from "../mission/Mission";

export type HomePrimaryActionState = "no_plan" | "disconnected" | "connecting" | "connected" | "error";

export interface HomePrimaryActionZoneProps {
  state?: HomePrimaryActionState;
  /** Legacy alias. Prefer `state`. */
  phase?: ConnectionPhase;
  hasPlan?: boolean;
  planTo?: string;
  connectTo?: string;
  setupTo?: string;
  devicesTo?: string;
  serverTo?: string;
  logsTo?: string;
  supportTo?: string;
  onConnect?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  primaryTo?: string;
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
  isLoading?: boolean;
  loadingLabel?: string;
}

function joinClasses(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function connectIcon(spinning = false) {
  return spinning ? (
    <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
      <path d="M20 12a8 8 0 0 0-8-8" />
    </svg>
  ) : (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path d="M12 3v10" />
      <path d="M7.8 6.8a7 7 0 1 0 8.4 0" />
    </svg>
  );
}

function arrowRightIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function cancelIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path d="m7 7 10 10" />
      <path d="m17 7-10 10" />
    </svg>
  );
}

function logsIcon() {
  return <IconAlertTriangle size={16} strokeWidth={1.8} />;
}

function serverIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      <path d="M7 6v12" />
    </svg>
  );
}

function renderPrimaryAction({
  to,
  onClick,
  label,
  tone = "default",
  icon,
  className,
}: {
  to?: string;
  onClick?: () => void;
  label: string;
  tone?: MissionPrimaryButtonTone;
  icon: JSX.Element;
  className: string;
}) {
  if (to) {
    return (
      <MissionPrimaryLink to={to} onClick={onClick} tone={tone} className={className}>
        {icon}
        <span>{label}</span>
      </MissionPrimaryLink>
    );
  }

  return (
    <MissionPrimaryButton onClick={onClick} tone={tone} className={className}>
      {icon}
      <span>{label}</span>
    </MissionPrimaryButton>
  );
}

function renderSecondaryAction({
  to,
  onClick,
  label,
  icon,
  className,
}: {
  to?: string;
  onClick?: () => void;
  label: string;
  icon: JSX.Element;
  className: string;
}) {
  if (to) {
    return (
      <MissionSecondaryLink to={to} onClick={onClick} className={className}>
        {icon}
        <span>{label}</span>
      </MissionSecondaryLink>
    );
  }

  return (
    <MissionSecondaryButton onClick={onClick} className={className}>
      {icon}
      <span>{label}</span>
    </MissionSecondaryButton>
  );
}

export function HomePrimaryActionZone({
  state,
  phase,
  hasPlan,
  planTo = "/plan",
  connectTo,
  setupTo = "/setup",
  devicesTo = "/devices",
  serverTo = "/servers",
  logsTo = "/support/logs",
  supportTo = "/support",
  onConnect,
  onCancel,
  onRetry,
  primaryTo,
  primaryLabel: primaryLabelOverride,
  onPrimaryAction,
  secondaryLabel,
  secondaryTo,
  isLoading = false,
  loadingLabel,
}: HomePrimaryActionZoneProps) {
  if (state == null) {
    const fallbackPhase = phase ?? "inactive";
    const defaultLabel =
      fallbackPhase === "connected" ? "Manage devices" : fallbackPhase === "connecting" ? "View setup" : "Choose plan";
    const primaryLabel = primaryLabelOverride ?? defaultLabel;
    const isEmphasizedPrimary = fallbackPhase === "connecting";
    const primaryTone: MissionPrimaryButtonTone = fallbackPhase === "connecting" ? "warning" : "default";
    const actionClassName = `miniapp-compact-action ${
      isEmphasizedPrimary ? "miniapp-compact-action--primary" : "miniapp-compact-action--secondary"
    }`;
    const primaryIcon = connectIcon(fallbackPhase === "connecting");

    return (
      <div className={`miniapp-compact-actions miniapp-compact-actions--${fallbackPhase}`}>
        {isLoading ? (
          <Button
            variant="primary"
            size="md"
            tone={fallbackPhase === "connecting" ? "warning" : "default"}
            className="miniapp-compact-action miniapp-compact-action--primary"
            loading
            loadingText={loadingLabel ?? (fallbackPhase === "connecting" ? "Connecting…" : "Loading…")}
            disabled
          />
        ) : primaryTo ? (
          isEmphasizedPrimary ? (
            <MissionPrimaryLink to={primaryTo} tone={primaryTone} onClick={onPrimaryAction} className={actionClassName}>
              {primaryIcon}
              <span>{primaryLabel}</span>
            </MissionPrimaryLink>
          ) : (
            <MissionSecondaryLink to={primaryTo} onClick={onPrimaryAction} className={actionClassName}>
              {primaryIcon}
              <span>{primaryLabel}</span>
            </MissionSecondaryLink>
          )
        ) : isEmphasizedPrimary ? (
          <MissionPrimaryButton
            onClick={onPrimaryAction}
            disabled={fallbackPhase === "connecting" && !onPrimaryAction}
            tone={primaryTone}
            className={actionClassName}
          >
            {primaryIcon}
            <span>{primaryLabel}</span>
          </MissionPrimaryButton>
        ) : (
          <MissionSecondaryButton onClick={onPrimaryAction} className={actionClassName}>
            {primaryIcon}
            <span>{primaryLabel}</span>
          </MissionSecondaryButton>
        )}
        {secondaryLabel != null && secondaryTo != null && (
          <Button asChild variant="link" size="sm" className={joinClasses("miniapp-inline-link", isLoading && "miniapp-inline-link--disabled")}>
            <Link to={secondaryTo}>
              <span>{secondaryLabel}</span>
            </Link>
          </Button>
        )}
      </div>
    );
  }

  const actionClassName = "miniapp-compact-action miniapp-compact-action--primary";
  const secondaryActionClassName = "miniapp-compact-action miniapp-compact-action--secondary";
  const ghostLinkTo = state === "error" || state === "no_plan" ? supportTo : serverTo;
  const ghostLabel = state === "connecting"
    ? "Setup help"
    : state === "error" || state === "no_plan"
      ? "Need help?"
      : "Manage server";

  const derivedState = state ?? (!hasPlan ? "no_plan" : phase === "connected" ? "connected" : "disconnected");

  const matrix = {
    no_plan: {
      primary: renderPrimaryAction({
        to: planTo ?? primaryTo,
        onClick: onPrimaryAction,
        label: primaryLabelOverride ?? "Choose plan",
        icon: arrowRightIcon(),
        className: joinClasses(actionClassName, "miniapp-compact-action--navigation"),
      }),
      secondary: null,
    },
    disconnected: {
      primary: renderPrimaryAction({
        to: connectTo ?? primaryTo,
        onClick: onConnect ?? onPrimaryAction,
        label: primaryLabelOverride ?? "Connect",
        icon: connectIcon(false),
        className: actionClassName,
      }),
      secondary: null,
    },
    connecting: {
      primary: renderPrimaryAction({
        to: setupTo ?? primaryTo,
        onClick: onPrimaryAction,
        label: primaryLabelOverride ?? "View setup",
        tone: "warning",
        icon: connectIcon(true),
        className: joinClasses(actionClassName, "miniapp-compact-action--warning"),
      }),
      secondary: renderSecondaryAction({
        onClick: onCancel,
        label: secondaryLabel ?? "Cancel",
        icon: cancelIcon(),
        className: secondaryActionClassName,
      }),
    },
    connected: {
      primary: renderPrimaryAction({
        to: devicesTo ?? primaryTo,
        onClick: onPrimaryAction,
        label: primaryLabelOverride ?? "Manage devices",
        icon: connectIcon(false),
        className: actionClassName,
      }),
      secondary: null,
    },
    error: {
      primary: renderPrimaryAction({
        to: primaryTo,
        onClick: onRetry ?? onPrimaryAction,
        label: primaryLabelOverride ?? "Retry",
        tone: "danger",
        icon: connectIcon(false),
        className: joinClasses(actionClassName, "miniapp-compact-action--danger"),
      }),
      secondary: renderSecondaryAction({
        to: logsTo,
        label: secondaryLabel ?? "View logs",
        icon: logsIcon(),
        className: secondaryActionClassName,
      }),
    },
  } satisfies Record<HomePrimaryActionState, { primary: JSX.Element; secondary: JSX.Element | null }>;

  return (
    <div className={joinClasses(`miniapp-compact-actions miniapp-compact-actions--${derivedState}`, isLoading && "miniapp-compact-actions--transitioning")}>
      {isLoading ? (
        <Button
          variant="primary"
          size="md"
          tone={derivedState === "error" ? "danger" : derivedState === "connecting" ? "warning" : "default"}
          className={joinClasses(actionClassName, derivedState === "connecting" && "miniapp-compact-action--warning", derivedState === "error" && "miniapp-compact-action--danger")}
          loading
          loadingText={
            loadingLabel
              ?? (derivedState === "error" ? "Retrying…" : derivedState === "connecting" ? "Connecting…" : "Loading…")
          }
          disabled
        />
      ) : (
        matrix[derivedState].primary
      )}
      {matrix[derivedState].secondary}
      {ghostLinkTo ? (
        <Button
          asChild
          variant="link"
          size="sm"
          className={joinClasses(
            "miniapp-inline-link",
            "miniapp-inline-link--ghost",
            derivedState === "no_plan" && "miniapp-inline-link--stacked",
          )}
        >
          <Link to={ghostLinkTo}>
            {derivedState === "connected" || derivedState === "disconnected" ? serverIcon() : null}
            <span>{ghostLabel}</span>
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
