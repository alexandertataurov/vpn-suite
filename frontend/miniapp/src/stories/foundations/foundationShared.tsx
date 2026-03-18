/**
 * Shared presentation for Foundation stories.
 * Single source for group labels, token cards, typography, and spacing.
 */
import React from "react";

export const FOUNDATION = {
  sectionGap: 32,
  itemGap: 16,
  cardSize: 64,
  cardSizeLg: 80,
  cardBorder: "1px solid rgba(0,0,0,0.08)",
  cardRadius: 12,
  groupLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    color: "var(--color-text-tertiary, #888)",
    marginBottom: 12,
  },
  tokenName: {
    fontSize: 10,
    color: "var(--color-text-muted, #888)",
    lineHeight: 1.4,
  },
  tokenValue: {
    fontSize: 9,
    color: "var(--color-text-tertiary, #aaa)",
    lineHeight: 1.4,
  },
} as const;

export function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p style={FOUNDATION.groupLabel}>{children}</p>;
}

export function FoundationSection({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: FOUNDATION.sectionGap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function TokenGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: FOUNDATION.itemGap,
      }}
    >
      {children}
    </div>
  );
}

export function TokenSlot({
  children,
  label,
  value,
  usage,
}: {
  children: React.ReactNode;
  label: string;
  value?: string;
  usage?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: FOUNDATION.cardSizeLg }}>
      {children}
      <code style={FOUNDATION.tokenName}>{label}</code>
      {value != null && (
        <code style={FOUNDATION.tokenValue}>{value || "—"}</code>
      )}
      {usage && (
        <code style={FOUNDATION.tokenValue}>{usage}</code>
      )}
    </div>
  );
}

export function resolveToken(token: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
}
