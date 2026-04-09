/**
 * Storybook-only compat layer: maps legacy design-system names to current exports.
 * Import from this file in .storybook instead of src/design-system when using
 * Heading, PrimitiveBadge, PrimitiveDivider, Toggle, IconButton.
 */
import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Tabs,
  ToastProvider,
  PageTitle,
  SectionTitle,
} from "../src/design-system";

const BADGE_VARIANT_MAP = {
  nominal: "neutral" as const,
  warning: "warning" as const,
  critical: "danger" as const,
  accent: "accent" as const,
  standby: "neutral" as const,
};

export { Button, Tabs, ToastProvider };

export function Heading({
  level = 1,
  className = "",
  children,
  ...props
}: { level?: 1 | 2 | 3 | 4 | 5 | 6; className?: string; children?: ReactNode } & Record<string, unknown>) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const Comp = level === 1 ? PageTitle : SectionTitle;
  return (
    <Comp as={Tag} className={className} {...props}>
      {children}
    </Comp>
  );
}

export function PrimitiveBadge({
  variant = "nominal",
  size = "sm",
  children,
  ...props
}: {
  variant?: "nominal" | "warning" | "critical" | "accent" | "standby";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
} & Record<string, unknown>) {
  const v = BADGE_VARIANT_MAP[variant] ?? "neutral";
  return (
    <Badge variant={v} size={size} {...props}>
      {children}
    </Badge>
  );
}

export function PrimitiveDivider() {
  return <hr className="my-4 border-0 border-t border-[var(--bd-sub)]" />;
}

export function Toggle({
  checked,
  onCheckedChange,
  "aria-label": ariaLabel,
  ...props
}: {
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
  "aria-label"?: string;
} & Record<string, unknown>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className="inline-flex h-6 w-10 shrink-0 rounded-full border border-[var(--bd-def)] bg-[var(--s2)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--bd-focus)]"
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      <span
        className="block h-5 w-5 rounded-full bg-[var(--tx-pri)] shadow transition-transform"
        style={{ transform: checked ? "translateX(1.125rem)" : "translateX(2px)", marginTop: 2 }}
      />
    </button>
  );
}

export function IconButton({
  children,
  ...props
}: { children?: ReactNode } & Record<string, unknown>) {
  return (
    <Button variant="ghost" size="sm" {...props}>
      {children}
    </Button>
  );
}
