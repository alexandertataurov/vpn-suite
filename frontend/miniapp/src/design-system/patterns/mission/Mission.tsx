import { useEffect, useRef } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Button, getButtonClassName } from "../../components/buttons/Button";
import type { ButtonTone } from "../../components/buttons/Button";
import { percentClass } from "@/lib/percentClass";

export type MissionTone = "blue" | "green" | "amber" | "red";
export type MissionChipTone = "neutral" | "blue" | "green" | "amber" | "red";
export type MissionAlertTone = "info" | "warning" | "error" | "success";
export type MissionPrimaryButtonTone = "default" | "warning" | "danger";
export type MissionStatusTone = "inactive" | "connecting" | "online" | "warning" | "error" | "idle";
export type MissionHealthTone = "healthy" | "warning" | "danger";

const CARD_EDGE_CLASS_MAP: Record<MissionTone, string> = {
  blue: "e-blue",
  green: "e-green",
  amber: "e-amber",
  red: "e-red",
};

const CARD_GLOW_CLASS_MAP: Partial<Record<MissionTone, string>> = {
  green: "g-green",
  amber: "g-amber",
  red: "g-red",
};

const CHIP_CLASS_MAP: Record<MissionChipTone, string> = {
  neutral: "cn",
  blue: "cb",
  green: "cg",
  amber: "ca",
  red: "cr",
};

const ALERT_CLASS_MAP: Record<MissionAlertTone, string> = {
  info: "state-alert-info",
  warning: "state-alert-warning",
  error: "state-alert-error",
  success: "state-alert-success",
};

const PRIMARY_BUTTON_TONE_CLASS_MAP: Record<MissionPrimaryButtonTone, string> = {
  default: "",
  warning: "warning",
  danger: "danger",
};

const STATUS_DOT_CLASS_MAP: Record<MissionStatusTone, string> = {
  inactive: "status-dot",
  connecting: "status-dot connecting",
  online: "status-dot online",
  warning: "status-dot warning",
  error: "status-dot error",
  idle: "status-dot idle",
};

const HEALTH_FILL_CLASS_MAP: Record<MissionHealthTone, string> = {
  healthy: "",
  warning: "warning",
  danger: "danger",
};

const OP_EDGE_CLASS_MAP: Record<MissionTone, string> = {
  blue: "e-b",
  green: "e-g",
  amber: "e-a",
  red: "e-r",
};

const OP_ICON_CLASS_MAP: Record<MissionTone, string> = {
  blue: "n",
  green: "g",
  amber: "a",
  red: "r",
};

function joinClasses(...classes: Array<string | null | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

export interface MissionCardProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  as?: "article" | "section" | "div";
  tone?: MissionTone;
  glowTone?: Exclude<MissionTone, "blue"> | null;
}

export function MissionCard({
  children,
  as = "article",
  tone = "blue",
  glowTone = null,
  className,
  ...props
}: MissionCardProps) {
  const Component = as;
  return (
    <Component
      className={joinClasses("card", "mission-card", CARD_EDGE_CLASS_MAP[tone], className)}
      {...props}
    >
      {glowTone ? (
        <div className={joinClasses("card-glow", CARD_GLOW_CLASS_MAP[glowTone])} aria-hidden />
      ) : null}
      {children}
    </Component>
  );
}

export interface MissionChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  children: ReactNode;
  tone?: MissionChipTone;
}

export function MissionChip({ children, tone = "neutral", className, ...props }: MissionChipProps) {
  return (
    <span className={joinClasses("chip", CHIP_CLASS_MAP[tone], className)} {...props}>
      {children}
    </span>
  );
}

export interface MissionModuleHeadProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  chip?: ReactNode;
}

export function MissionModuleHead({ label, chip, className, ...props }: MissionModuleHeadProps) {
  return (
    <div className={joinClasses("module-head", className)} {...props}>
      <span className="dc-key type-label">{label}</span>
      {chip}
    </div>
  );
}

export interface MissionAlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  tone: MissionAlertTone;
  title: ReactNode;
  message: ReactNode;
  actions?: ReactNode;
}

export function MissionAlert({
  tone,
  title,
  message,
  actions,
  className,
  ...props
}: MissionAlertProps) {
  return (
    <div className={joinClasses("state-alert", ALERT_CLASS_MAP[tone], className)} {...props}>
      <div className="state-alert-title type-label">{title}</div>
      <div className="state-alert-message type-body-sm">{message}</div>
      {actions ? <div className="state-alert-actions">{actions}</div> : null}
    </div>
  );
}

export interface MissionPrimaryButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  tone?: MissionPrimaryButtonTone;
}

export function MissionPrimaryButton({
  children,
  tone = "default",
  className,
  type = "button",
  ...props
}: MissionPrimaryButtonProps) {
  return (
    <Button
      variant="primary"
      size="md"
      tone={tone as ButtonTone}
      type={type}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}

export interface MissionSecondaryButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
}

export function MissionSecondaryButton({
  children,
  className,
  type = "button",
  ...props
}: MissionSecondaryButtonProps) {
  return (
    <Button variant="secondary" size="md" type={type} className={className} {...props}>
      {children}
    </Button>
  );
}

export interface MissionPrimaryLinkProps extends Omit<LinkProps, "className" | "children"> {
  children: ReactNode;
  tone?: MissionPrimaryButtonTone;
  className?: string;
}

export function MissionPrimaryLink({
  children,
  tone = "default",
  className,
  ...props
}: MissionPrimaryLinkProps) {
  return (
    <Link
      className={joinClasses(getButtonClassName("primary", "md", PRIMARY_BUTTON_TONE_CLASS_MAP[tone]), className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export interface MissionSecondaryLinkProps extends Omit<LinkProps, "className" | "children"> {
  children: ReactNode;
  className?: string;
}

export function MissionSecondaryLink({
  children,
  className,
  ...props
}: MissionSecondaryLinkProps) {
  return (
    <Link className={joinClasses(getButtonClassName("secondary", "md"), className)} {...props}>
      {children}
    </Link>
  );
}

export interface MissionPrimaryAnchorProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  children: ReactNode;
  tone?: MissionPrimaryButtonTone;
}

export function MissionPrimaryAnchor({
  children,
  tone = "default",
  className,
  ...props
}: MissionPrimaryAnchorProps) {
  return (
    <a
      className={joinClasses(getButtonClassName("primary", "md", PRIMARY_BUTTON_TONE_CLASS_MAP[tone]), className)}
      {...props}
    >
      {children}
    </a>
  );
}

export interface MissionSecondaryAnchorProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  children: ReactNode;
}

export function MissionSecondaryAnchor({
  children,
  className,
  ...props
}: MissionSecondaryAnchorProps) {
  return (
    <a className={joinClasses(getButtonClassName("secondary", "md"), className)} {...props}>
      {children}
    </a>
  );
}

export interface MissionProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  percent: number;
  tone?: MissionHealthTone;
  staticFill?: boolean;
  ariaLabel?: string;
}

interface MissionProgressFillProps {
  className: string;
  percent: number;
}

function MissionProgressFill({ className, percent }: MissionProgressFillProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fillRef.current?.style.setProperty("--pct", String(Math.max(0, Math.min(100, percent))));
  }, [percent]);

  return <div ref={fillRef} className={className} />;
}

export function MissionProgressBar({
  percent,
  tone = "healthy",
  staticFill = false,
  ariaLabel = "Progress",
  className,
  ...props
}: MissionProgressBarProps) {
  const normalizedPercent = Math.max(0, Math.min(100, percent));
  const fillClassName = joinClasses(
    "h-fill",
    staticFill && "static",
    HEALTH_FILL_CLASS_MAP[tone],
    percentClass(normalizedPercent),
  );

  return (
    <div
      className={joinClasses("h-track", className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalizedPercent)}
      {...props}
    >
      <MissionProgressFill className={fillClassName} percent={normalizedPercent} />
    </div>
  );
}

export interface MissionStatusDotProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  tone?: MissionStatusTone;
}

export function MissionStatusDot({ tone = "inactive", className, ...props }: MissionStatusDotProps) {
  return (
    <span className={joinClasses(STATUS_DOT_CLASS_MAP[tone], className)} {...props} aria-hidden />
  );
}

interface MissionOperationBaseProps {
  tone: MissionTone;
  iconTone?: MissionTone;
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  trailing?: ReactNode;
  showChevron?: boolean;
  className?: string;
}

function MissionOperationChevron() {
  return (
    <span className="op-chev" aria-hidden>
      <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2">
        <path d="M5 2l4 5-4 5" />
      </svg>
    </span>
  );
}

function MissionOperationContent({
  icon,
  title,
  description,
  trailing,
  showChevron,
  iconTone,
}: Pick<
  MissionOperationBaseProps,
  "icon" | "title" | "description" | "trailing" | "showChevron" | "iconTone"
>) {
  return (
    <>
      <span className={joinClasses("op-ico", OP_ICON_CLASS_MAP[iconTone ?? "blue"])} aria-hidden>
        {icon}
      </span>
      <span className="op-body">
        <span className="op-name type-h3">{title}</span>
        <span className="op-desc type-body-sm">{description}</span>
      </span>
      {trailing ?? (showChevron ? <MissionOperationChevron /> : null)}
    </>
  );
}

export interface MissionOperationButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "title">,
    MissionOperationBaseProps {}

export function MissionOperationButton({
  tone,
  iconTone = tone,
  icon,
  title,
  description,
  trailing,
  showChevron = true,
  className,
  type = "button",
  ...props
}: MissionOperationButtonProps) {
  return (
    <button
      type={type}
      className={joinClasses("op", OP_EDGE_CLASS_MAP[tone], className)}
      {...props}
    >
      <MissionOperationContent
        icon={icon}
        iconTone={iconTone}
        title={title}
        description={description}
        trailing={trailing}
        showChevron={showChevron}
      />
    </button>
  );
}

export interface MissionOperationLinkProps
  extends Omit<LinkProps, "children" | "className" | "title">,
    MissionOperationBaseProps {}

export function MissionOperationLink({
  tone,
  iconTone = tone,
  icon,
  title,
  description,
  trailing,
  showChevron = true,
  className,
  ...props
}: MissionOperationLinkProps) {
  return (
    <Link
      className={joinClasses("op", OP_EDGE_CLASS_MAP[tone], className)}
      {...props}
    >
      <MissionOperationContent
        icon={icon}
        iconTone={iconTone}
        title={title}
        description={description}
        trailing={trailing}
        showChevron={showChevron}
      />
    </Link>
  );
}

export interface MissionOperationArticleProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "title">,
    MissionOperationBaseProps {
  as?: "article" | "div";
}

export function MissionOperationArticle({
  as = "article",
  tone,
  iconTone = tone,
  icon,
  title,
  description,
  trailing,
  showChevron = false,
  className,
  ...props
}: MissionOperationArticleProps) {
  const Component = as;
  return (
    <Component className={joinClasses("op", OP_EDGE_CLASS_MAP[tone], className)} {...props}>
      <MissionOperationContent
        icon={icon}
        iconTone={iconTone}
        title={title}
        description={description}
        trailing={trailing}
        showChevron={showChevron}
      />
    </Component>
  );
}
