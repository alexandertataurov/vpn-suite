import {
  Children,
  Fragment,
  isValidElement,
  useRef,
  useLayoutEffect,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { IconCheck } from "../../icons";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type FormFieldState =
  | "idle"
  | "focused"
  | "required_unfilled"
  | "error"
  | "success"
  | "disabled"
  | "readonly"
  | "loading";

export interface FormFieldProps {
  label: string;
  children?: ReactNode;
  input?: ReactNode;
  action?: ReactNode;
  className?: string;
  state?: FormFieldState;
  helperText?: ReactNode;
  errorMessage?: ReactNode;
  successMessage?: ReactNode;
}

/** Content Library 12: form field with validation and optional field action slot. */
export function FormField({
  label,
  input,
  action,
  className = "",
  state = "idle",
  helperText,
  errorMessage,
  successMessage,
}: FormFieldProps) {
  const message =
    state === "error"
      ? errorMessage
      : state === "success"
        ? successMessage
        : helperText;

  return (
    <div className={joinClasses("field-group", `field-group--${state}`, className)}>
      <div className="field-label-row">
        <div className="field-label">{label}</div>
        {state === "required_unfilled" ? (
          <span className="field-label-meta field-label-meta--required" aria-label="Required field">
            <span aria-hidden>·</span>
            <span>required</span>
          </span>
        ) : null}
        {state === "success" ? (
          <span className="field-state-indicator" aria-label="Field valid">
            <IconCheck size={14} strokeWidth={2} aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="field-wrap">
        {input}
        {action != null ? <div className="field-action">{action}</div> : null}
      </div>
      {message != null ? (
        <div className={joinClasses("field-helper", state === "error" && "field-helper--error")}>
          {message}
        </div>
      ) : null}
    </div>
  );
}

export interface SettingsCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  divider?: boolean;
}

/** Content Library 12: settings card with automatic dividers between rows. */
export function SettingsCard({ children, className = "", divider = true, ...props }: SettingsCardProps) {
  const items = Children.toArray(children);

  return (
    <div className={`settings-card ${className}`.trim()} {...props}>
      {divider
        ? items.map((child, index) => {
            const next = items[index + 1];
            const shouldInsertDivider =
              index < items.length - 1 &&
              !(isValidElement(child) && child.type === SettingsDivider) &&
              !(isValidElement(next) && next.type === SettingsDivider);

            return (
              <Fragment key={isValidElement(child) && child.key != null ? child.key : index}>
                {child}
                {shouldInsertDivider ? <SettingsDivider /> : null}
              </Fragment>
            );
          })
        : children}
    </div>
  );
}

export function SettingsDivider() {
  return <div className="settings-divider" />;
}

export interface ToggleRowProps {
  name: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  disabledReason?: ReactNode;
}

/** Content Library 12: toggle setting row with dependency state support. */
export function ToggleRow({
  name,
  description,
  checked,
  onChange,
  className = "",
  disabled = false,
  disabledReason,
}: ToggleRowProps) {
  const showReason = disabled && disabledReason != null;

  return (
    <div className={joinClasses("toggle-setting", disabled && "toggle-setting--disabled", className)}>
      <div className="ts-body">
        <div className="ts-name">{name}</div>
        {description != null ? <div className="ts-desc">{description}</div> : null}
        {showReason ? <div className="ts-disabled-reason">{disabledReason}</div> : null}
      </div>
      <button
        type="button"
        className={`ts-toggle ${checked ? "on" : ""}`.trim()}
        onClick={() => {
          if (disabled) return;
          onChange(!checked);
        }}
        role="switch"
        aria-checked={checked}
        aria-label={name}
        aria-disabled={disabled}
        title={typeof disabledReason === "string" ? disabledReason : undefined}
        disabled={disabled}
      >
        <span className="ts-track" aria-hidden>
          <div className="ts-knob" />
        </span>
      </button>
    </div>
  );
}

export type SegmentedControlBadgeVariant = "positive" | "warning" | "new";

export interface SegmentedControlOption {
  id: string;
  label: ReactNode;
  tag?: ReactNode;
  badge?: {
    label: string;
    variant: SegmentedControlBadgeVariant;
  };
  disabled?: boolean;
  disabledReason?: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  activeId?: string;
  onSelect?: (id: string) => void;
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

/** Content Library 12: segmented control (e.g. Monthly/Annual). */
export function SegmentedControl({
  options,
  activeId,
  onSelect,
  value,
  onChange,
  className = "",
  ariaLabel,
}: SegmentedControlProps) {
  const selectedId = value ?? activeId ?? options[0]?.id ?? "";
  const handleSelect = onChange ?? onSelect ?? (() => undefined);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.id === selectedId));
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty("--seg-count", String(Math.max(1, options.length)));
    el.style.setProperty("--seg-index", String(selectedIndex));
  }, [options.length, selectedIndex]);

  return (
    <div
      ref={rootRef}
      className={`seg-toggle ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      <span className="seg-indicator" aria-hidden />
      {options.map((opt) => {
        const badge = opt.badge ?? (opt.tag != null ? { label: String(opt.tag), variant: "positive" as const } : null);
        const selected = selectedId === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            className={`seg-btn ${selected ? "on" : ""}`.trim()}
            onClick={() => handleSelect(opt.id)}
            disabled={opt.disabled}
            role="tab"
            aria-selected={selected}
            title={opt.disabled ? opt.disabledReason : undefined}
          >
            <span className="seg-btn-copy">
              <span className="seg-btn-label">{opt.label}</span>
              {badge ? <span className={`seg-tag seg-tag--${badge.variant}`}>{badge.label}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
