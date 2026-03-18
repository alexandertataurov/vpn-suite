import React from "react";

type Status = "Stable" | "Beta" | "Deprecated";

const statusStyles: Record<Status, React.CSSProperties> = {
  Stable: {
    background: "var(--color-success-100, var(--color-success))",
    color: "var(--color-success-600, var(--color-success))",
    padding: "2px 8px",
    borderRadius: "var(--radius-sm, 4px)",
    fontSize: "var(--typo-caption-size, 12px)",
    fontWeight: 600,
  },
  Beta: {
    background: "var(--color-warning-100, var(--color-warning))",
    color: "var(--color-warning-600, var(--color-warning))",
    padding: "2px 8px",
    borderRadius: "var(--radius-sm, 4px)",
    fontSize: "var(--typo-caption-size, 12px)",
    fontWeight: 600,
  },
  Deprecated: {
    background: "var(--color-error-100, var(--color-error))",
    color: "var(--color-error-600, var(--color-error))",
    padding: "2px 8px",
    borderRadius: "var(--radius-sm, 4px)",
    fontSize: "var(--typo-caption-size, 12px)",
    fontWeight: 600,
  },
};

interface FoundationHeaderProps {
  title: string;
  description: string;
  status?: Status;
}

export function FoundationHeader({
  title,
  description,
  status = "Stable",
}: FoundationHeaderProps) {
  return (
    <header
      style={{
        marginBottom: "var(--spacing-6, 24px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-3, 12px)",
          marginBottom: "var(--spacing-2, 8px)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--typo-h1-size, 24px)",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          {title}
        </h1>
        {status && (
          <span style={statusStyles[status]}>{status}</span>
        )}
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-sans)",
          fontSize: "var(--typo-body-size, 16px)",
          color: "var(--color-text-muted)",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
    </header>
  );
}
