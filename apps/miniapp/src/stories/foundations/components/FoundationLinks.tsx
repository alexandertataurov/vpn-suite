import type { CSSProperties } from "react";

export interface FoundationLinksProps {
  figma?: string;
  tokens?: string;
  code?: string;
}

const LINK_DEFS = [
  { key: "figma", label: "Open in Figma" },
  { key: "tokens", label: "View tokens" },
  { key: "code", label: "Code reference" },
] as const satisfies ReadonlyArray<{ key: keyof FoundationLinksProps; label: string }>;

const styles = {
  container: {
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--spacing-3, 12px)",
    marginBottom: "var(--spacing-6, 24px)",
  } satisfies CSSProperties,
  link: {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--typo-caption-size, 12px)",
    color: "var(--color-accent)",
    textDecoration: "none",
  } satisfies CSSProperties,
} as const;

export function FoundationLinks({ figma, tokens, code }: FoundationLinksProps) {
  const provided: Record<keyof FoundationLinksProps, string | undefined> = { figma, tokens, code };

  const links = LINK_DEFS.flatMap(({ key, label }) => {
    const href = provided[key];
    return href ? [{ label, href }] : [];
  });

  if (links.length === 0) return null;

  return (
    <div style={styles.container}>
      {links.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
