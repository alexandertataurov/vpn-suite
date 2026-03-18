import React from "react";

interface FoundationLinksProps {
  figma?: string;
  tokens?: string;
  code?: string;
}

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size, 12px)",
  color: "var(--color-accent)",
  textDecoration: "none",
};

export function FoundationLinks({
  figma,
  tokens,
  code,
}: FoundationLinksProps) {
  const links: { label: string; href?: string }[] = [];
  if (figma) links.push({ label: "Open in Figma", href: figma });
  if (tokens) links.push({ label: "View tokens", href: tokens });
  if (code) links.push({ label: "Code reference", href: code });

  if (links.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--spacing-3, 12px)",
        marginBottom: "var(--spacing-6, 24px)",
      }}
    >
      {links.map(({ label, href }) =>
        href ? (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            {label}
          </a>
        ) : (
          <span key={label} style={{ ...linkStyle, color: "var(--color-text-muted)" }}>
            {label}
          </span>
        )
      )}
    </div>
  );
}
