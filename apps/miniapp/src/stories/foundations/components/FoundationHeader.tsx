import type { CSSProperties } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Status = "Stable" | "Beta" | "Deprecated";

export interface FoundationHeaderProps {
  title: string;
  description: string;
  status?: Status;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/**
 * Shared base for all status badges — only the color tokens differ per variant.
 * Defined once to avoid silent drift between variants.
 */
const STATUS_BADGE_BASE: CSSProperties = {
  padding: "2px 8px",
  borderRadius: "var(--radius-sm, 4px)",
  fontSize: "var(--typo-caption-size, 12px)",
  fontWeight: 600,
};

const STATUS_STYLES: Record<Status, CSSProperties> = {
  Stable: {
    ...STATUS_BADGE_BASE,
    background: "var(--color-success-100, var(--color-success))",
    color: "var(--color-success-600, var(--color-success))",
  },
  Beta: {
    ...STATUS_BADGE_BASE,
    background: "var(--color-warning-100, var(--color-warning))",
    color: "var(--color-warning-600, var(--color-warning))",
  },
  Deprecated: {
    ...STATUS_BADGE_BASE,
    background: "var(--color-error-100, var(--color-error))",
    color: "var(--color-error-600, var(--color-error))",
  },
};

const styles = {
  header: {
    marginBottom: "var(--spacing-6, 24px)",
  } satisfies CSSProperties,

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-3, 12px)",
    marginBottom: "var(--spacing-2, 8px)",
  } satisfies CSSProperties,

  title: {
    margin: 0,
    fontFamily: "var(--font-sans)",
    fontSize: "var(--typo-h1-size, 24px)",
    fontWeight: 600,
    color: "var(--color-text)",
  } satisfies CSSProperties,

  description: {
    margin: 0,
    fontFamily: "var(--font-sans)",
    fontSize: "var(--typo-body-size, 16px)",
    color: "var(--color-text-muted)",
    lineHeight: 1.5,
  } satisfies CSSProperties,
} as const;

// ---------------------------------------------------------------------------
// StatusBadge (internal)
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: Status }) {
  return <span style={STATUS_STYLES[status]}>{status}</span>;
}

// ---------------------------------------------------------------------------
// FoundationHeader
// ---------------------------------------------------------------------------

/**
 * Page-level header for design system documentation pages.
 * Renders a title, status badge, and description in a consistent layout.
 *
 * @example
 * <FoundationHeader
 *   title="Typography"
 *   description="Type scale and text style tokens."
 *   status="Beta"
 * />
 */
export function FoundationHeader({
  title,
  description,
  status = "Stable",
}: FoundationHeaderProps) {
  return (
    <header style={styles.header}>
      <div style={styles.titleRow}>
        <h1 style={styles.title}>{title}</h1>
        <StatusBadge status={status} />
      </div>
      <p style={styles.description}>{description}</p>
    </header>
  );
}