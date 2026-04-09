/**
 * Shared presentation for Foundation stories.
 * Single source for group labels, token cards, typography, and spacing.
 */
import type { CSSProperties, ReactNode } from "react";
import React from "react";

export const FOUNDATION = {
  sectionGap: 32,
  itemGap: 16,
  cardSize: 64,
  cardSizeLg: 80,
  cardBorder: "1px solid var(--color-border-subtle, rgba(0,0,0,0.08))",
  cardRadius: 12,
  groupLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    color: "var(--color-text-tertiary)",
    marginBottom: 12,
  },
  tokenName: {
    fontSize: 10,
    color: "var(--color-text-muted)",
    lineHeight: 1.4,
  },
  tokenValue: {
    fontSize: 9,
    color: "var(--color-text-tertiary)",
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

const FOUNDATION_PREVIEW_BASE: CSSProperties = {
  display: "flex",
  width: "100%",
  borderRadius: FOUNDATION.cardRadius,
  border: FOUNDATION.cardBorder,
  background: "var(--color-surface)",
};

export function FoundationPreview({
  children,
  style,
}: {
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return <div style={{ ...FOUNDATION_PREVIEW_BASE, ...style }}>{children}</div>;
}

export function FoundationCenteredPreview({
  children,
  minHeight = FOUNDATION.cardSize,
  padding = 8,
  style,
}: {
  children: ReactNode;
  minHeight?: number;
  padding?: number;
  style?: CSSProperties;
}) {
  return (
    <FoundationPreview
      style={{
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        padding,
        ...style,
      }}
    >
      {children}
    </FoundationPreview>
  );
}

export function FoundationCodePreview({
  children,
  minHeight = FOUNDATION.cardSize,
  padding = 8,
  style,
}: {
  children: ReactNode;
  minHeight?: number;
  padding?: number;
  style?: CSSProperties;
}) {
  return (
    <FoundationCenteredPreview minHeight={minHeight} padding={padding} style={style}>
      <code
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--typo-meta-size)",
          color: "var(--color-text)",
          lineHeight: 1.4,
        }}
      >
        {children}
      </code>
    </FoundationCenteredPreview>
  );
}

export function FoundationColorPreview({ token }: { token: string }) {
  const isCheckerboard = token.includes("on-accent") || token.includes("overlay");

  return (
    <FoundationPreview
      style={{
        width: FOUNDATION.cardSize,
        height: FOUNDATION.cardSize,
        background: `var(${token})`,
        backgroundImage: isCheckerboard
          ? `linear-gradient(45deg, var(--color-border-subtle, #ddd) 25%, transparent 25%),
             linear-gradient(-45deg, var(--color-border-subtle, #ddd) 25%, transparent 25%),
             linear-gradient(45deg, transparent 75%, var(--color-border-subtle, #ddd) 75%),
             linear-gradient(-45deg, transparent 75%, var(--color-border-subtle, #ddd) 75%),
             var(${token})`
          : undefined,
        backgroundSize: isCheckerboard
          ? "8px 8px, 8px 8px, 8px 8px, 8px 8px, 100%"
          : undefined,
        backgroundPosition: isCheckerboard
          ? "0 0, 0 4px, 4px -4px, -4px 0px, 0 0"
          : undefined,
      }}
    />
  );
}

export function FoundationSquarePreview({
  children,
  size = FOUNDATION.cardSize,
  style,
}: {
  children?: ReactNode;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <FoundationPreview
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
      {children}
    </FoundationPreview>
  );
}

export function FoundationBarPreview({ token }: { token: string }) {
  return (
    <FoundationPreview
      style={{
        height: FOUNDATION.cardSize,
        alignItems: "flex-end",
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          width: `var(${token})`,
          minWidth: `var(${token})`,
          height: 8,
          background: "var(--color-accent)",
          opacity: 0.5,
          borderRadius: "var(--radius-sm)",
        }}
      />
    </FoundationPreview>
  );
}

export function FoundationTypographyPreview({
  token,
  weight = 400,
  children = "The quick brown fox",
}: {
  token: string;
  weight?: number;
  children?: ReactNode;
}) {
  return (
    <FoundationCenteredPreview
      minHeight={64}
      style={{
        justifyContent: "flex-start",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: `var(${token})`,
          fontWeight: weight,
          color: "var(--color-text)",
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        {children}
      </p>
    </FoundationCenteredPreview>
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
