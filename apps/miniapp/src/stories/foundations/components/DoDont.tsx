import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DoDontVariant = "do" | "dont";

interface DoDontColumn {
  content: ReactNode;
  label: string;
  variant: DoDontVariant;
}

export interface DoDontProps {
  do: ReactNode;
  dont: ReactNode;
  doLabel?: string;
  dontLabel?: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const VARIANT_COLOR: Record<DoDontVariant, string> = {
  do: "var(--color-success)",
  dont: "var(--color-error)",
};

const styles = {
  root: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--spacing-4, 16px)",
    marginTop: "var(--spacing-4, 16px)",
  } satisfies React.CSSProperties,

  label: (variant: DoDontVariant): React.CSSProperties => ({
    fontSize: "var(--typo-caption-size, 12px)",
    fontWeight: 600,
    color: VARIANT_COLOR[variant],
    marginBottom: "var(--spacing-2, 8px)",
  }),

  column: (variant: DoDontVariant): React.CSSProperties => ({
    flex: 1,
    minWidth: 0,
    padding: "var(--spacing-4, 16px)",
    borderRadius: "var(--radius-md, 8px)",
    border: `1px solid ${VARIANT_COLOR[variant]}`,
    background: "var(--color-surface)",
  }),
} as const;

// ---------------------------------------------------------------------------
// Column (internal)
// ---------------------------------------------------------------------------

function DoDontColumn({ content, label, variant }: DoDontColumn) {
  return (
    <div>
      <div style={styles.label(variant)}>{label}</div>
      <div style={styles.column(variant)}>{content}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DoDont
// ---------------------------------------------------------------------------

/**
 * Side-by-side Do / Don't comparison block for design system documentation.
 *
 * @example
 * <DoDont
 *   do={<Button>Submit</Button>}
 *   dont={<Button>Click here to submit the form</Button>}
 * />
 */
export function DoDont({
  do: doContent,
  dont: dontContent,
  doLabel = "Do",
  dontLabel = "Don't",
}: DoDontProps) {
  return (
    <div style={styles.root}>
      <DoDontColumn content={doContent} label={doLabel} variant="do" />
      <DoDontColumn content={dontContent} label={dontLabel} variant="dont" />
    </div>
  );
}