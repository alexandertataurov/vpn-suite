import type { HTMLAttributes, ReactNode } from "react";

export interface FormFieldProps {
  label: string;
  children?: ReactNode;
  /** Input (or custom) + optional field-action slot */
  input?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Content Library 12: form field with label. */
export function FormField({ label, input, action, className = "" }: FormFieldProps) {
  return (
    <div className={`field-group ${className}`.trim()}>
      <div className="field-label">{label}</div>
      <div className="field-wrap">
        {input}
        {action != null ? <div className="field-action">{action}</div> : null}
      </div>
    </div>
  );
}

export interface SettingsCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Content Library 12: settings card with optional dividers between fields. */
export function SettingsCard({ children, className = "", ...props }: SettingsCardProps) {
  return (
    <div className={`settings-card ${className}`.trim()} {...props}>
      {children}
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
}

/** Content Library 12: toggle setting row. */
export function ToggleRow({
  name,
  description,
  checked,
  onChange,
  className = "",
}: ToggleRowProps) {
  return (
    <div className={`toggle-setting ${className}`.trim()}>
      <div className="ts-body">
        <div className="ts-name">{name}</div>
        {description != null ? <div className="ts-desc">{description}</div> : null}
      </div>
      <button
        type="button"
        className={`ts-toggle ${checked ? "on" : ""}`.trim()}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={name}
      >
        <span className="ts-track" aria-hidden>
          <div className="ts-knob" />
        </span>
      </button>
    </div>
  );
}

export interface SegmentedControlOption {
  id: string;
  label: ReactNode;
  tag?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

/** Content Library 12: segmented control (e.g. Monthly/Annual). */
export function SegmentedControl({
  options,
  activeId,
  onSelect,
  className = "",
  ariaLabel,
}: SegmentedControlProps) {
  return (
    <div className={`seg-toggle ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`seg-btn ${activeId === opt.id ? "on" : ""}`.trim()}
          onClick={() => onSelect(opt.id)}
          disabled={opt.disabled}
          role="tab"
          aria-selected={activeId === opt.id}
        >
          {opt.label}
          {opt.tag != null ? <span className="seg-tag">{opt.tag}</span> : null}
        </button>
      ))}
    </div>
  );
}
