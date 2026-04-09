import type { ReactNode } from "react";

export function Card({
  icon,
  title,
  description,
  href,
  children,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  href?: string;
  children?: ReactNode;
}) {
  const content = (
    <>
      {icon && (
        <div
          style={{
            marginBottom: 12,
            color: "var(--color-text-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          margin: 0,
          fontFamily: "var(--font-display), monospace",
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-text-primary)",
        }}
      >
        {title}
      </h3>
      {description && (
        <div
          style={{
            margin: "8px 0 0",
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--color-text-secondary)",
          }}
        >
          {description}
        </div>
      )}
      {href && (
        <span
          style={{
            display: "inline-block",
            marginTop: 8,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            transition: "color 150ms ease",
          }}
          className="ds-card-cta"
        >
          View story →
        </span>
      )}
      {children}
    </>
  );

  const wrapperStyle = {
    display: "block",
    padding: 24,
    background: "var(--color-elevated)",
    border: "1px solid var(--color-border-subtle)",
    boxShadow: "none",
    transition: "box-shadow 150ms ease, border-color 150ms ease",
    textDecoration: "none",
    color: "inherit",
  } as const;

  if (href) {
    return (
      <a
        href={href}
        style={wrapperStyle}
        className="ds-card ds-card-link"
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 24px rgba(14, 165, 233, 0.12)";
          e.currentTarget.style.borderColor = "var(--color-border-focus)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = "2px solid var(--color-border-focus)";
          e.currentTarget.style.outlineOffset = "2px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = "none";
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <div style={wrapperStyle} className="ds-card">
      {content}
    </div>
  );
}
