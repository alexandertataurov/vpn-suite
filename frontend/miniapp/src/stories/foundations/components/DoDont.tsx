import React from "react";

interface DoDontProps {
  do: React.ReactNode;
  dont: React.ReactNode;
  doLabel?: string;
  dontLabel?: string;
}

const columnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "var(--spacing-4, 16px)",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--color-border)",
};

export function DoDont({
  do: doContent,
  dont: dontContent,
  doLabel = "Do",
  dontLabel = "Don't",
}: DoDontProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-4, 16px)",
        marginTop: "var(--spacing-4, 16px)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--spacing-4, 16px)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "var(--typo-caption-size, 12px)",
              fontWeight: 600,
              color: "var(--color-success)",
              marginBottom: "var(--spacing-2, 8px)",
            }}
          >
            {doLabel}
          </div>
          <div
            style={{
              ...columnStyle,
              background: "var(--color-surface)",
              borderColor: "var(--color-success)",
            }}
          >
            {doContent}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "var(--typo-caption-size, 12px)",
              fontWeight: 600,
              color: "var(--color-error)",
              marginBottom: "var(--spacing-2, 8px)",
            }}
          >
            {dontLabel}
          </div>
          <div
            style={{
              ...columnStyle,
              background: "var(--color-surface)",
              borderColor: "var(--color-error)",
            }}
          >
            {dontContent}
          </div>
        </div>
      </div>
    </div>
  );
}
