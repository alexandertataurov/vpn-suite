import "../presentation/foundationStories.css";

import type { CSSProperties, ReactNode } from "react";

export const FOUNDATION = {
  sectionMaxWidth: 960,
  sectionGap: 32,
  groupGap: 20,
  itemGap: 16,
  cardRadius: 12,
  cardBorder: "1px solid var(--color-border-subtle)",
  cardSize: 64,
  cardSizeLg: 80,
  previewMaxWidth: 520,
} as const;

export function FoundationSection({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section className="foundation-shell" style={style}>
      {children}
    </section>
  );
}
FoundationSection.displayName = "FoundationSection";

export function FoundationIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="foundation-intro">
      <p className="foundation-intro__kicker">Foundations</p>
      <h2 className="foundation-intro__title">{title}</h2>
      <p className="foundation-intro__description">{description}</p>
    </header>
  );
}
FoundationIntro.displayName = "FoundationIntro";

export function FoundationGroup({
  children,
}: {
  children: ReactNode;
}) {
  return <section className="foundation-group">{children}</section>;
}
FoundationGroup.displayName = "FoundationGroup";

export function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="foundation-group-label">{children}</p>;
}
GroupLabel.displayName = "GroupLabel";

export function FoundationGrid({
  children,
  minColumn = 240,
}: {
  children: ReactNode;
  minColumn?: number;
}) {
  return (
    <div
      className="foundation-grid"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minColumn}px, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}
FoundationGrid.displayName = "FoundationGrid";

export function TokenGrid({ children }: { children: ReactNode }) {
  return <div className="foundation-token-grid">{children}</div>;
}
TokenGrid.displayName = "TokenGrid";

const PREVIEW_BASE: CSSProperties = {
  display: "flex",
  width: "100%",
  borderRadius: FOUNDATION.cardRadius,
  border: FOUNDATION.cardBorder,
  background: "var(--color-surface)",
  overflow: "hidden",
};

export function FoundationPreview({
  children,
  style,
}: {
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return <div style={{ ...PREVIEW_BASE, ...style }}>{children}</div>;
}
FoundationPreview.displayName = "FoundationPreview";

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
FoundationCenteredPreview.displayName = "FoundationCenteredPreview";

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
      <code className="foundation-code">{children}</code>
    </FoundationCenteredPreview>
  );
}
FoundationCodePreview.displayName = "FoundationCodePreview";

const CHECKERBOARD_SIZE = "8px";

const CHECKERBOARD_TOKEN_MATCHERS = ["on-accent", "overlay"] as const;

function shouldUseCheckerboardBackdrop(token: string): boolean {
  return CHECKERBOARD_TOKEN_MATCHERS.some((matcher) => token.includes(matcher));
}

function getCheckerboardBackgroundStyle(
  token: string,
): Pick<CSSProperties, "backgroundImage" | "backgroundSize" | "backgroundPosition"> {
  return {
    backgroundImage: `
      linear-gradient(45deg, var(--color-border-subtle) 25%, transparent 25%),
      linear-gradient(-45deg, var(--color-border-subtle) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--color-border-subtle) 75%),
      linear-gradient(-45deg, transparent 75%, var(--color-border-subtle) 75%),
      var(${token})
    `,
    backgroundSize: `${CHECKERBOARD_SIZE} ${CHECKERBOARD_SIZE}, ${CHECKERBOARD_SIZE} ${CHECKERBOARD_SIZE}, ${CHECKERBOARD_SIZE} ${CHECKERBOARD_SIZE}, ${CHECKERBOARD_SIZE} ${CHECKERBOARD_SIZE}, 100%`,
    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px, 0 0",
  };
}

export function FoundationColorPreview({ token }: { token: string }) {
  const checkerboard = shouldUseCheckerboardBackdrop(token);
  const isBackgroundToken = token.endsWith("-bg") || token.includes("surface") || token.endsWith("color-bg");

  return (
    <FoundationPreview
      style={{
        width: isBackgroundToken ? FOUNDATION.cardSizeLg : FOUNDATION.cardSize,
        height: isBackgroundToken ? FOUNDATION.cardSizeLg : FOUNDATION.cardSize,
        background: `var(${token})`,
        boxShadow: isBackgroundToken ? "inset 0 0 0 1px var(--color-border)" : undefined,
        ...(checkerboard ? getCheckerboardBackgroundStyle(token) : {}),
      }}
    />
  );
}
FoundationColorPreview.displayName = "FoundationColorPreview";

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
    <FoundationPreview style={{ width: size, height: size, ...style }}>
      {children}
    </FoundationPreview>
  );
}
FoundationSquarePreview.displayName = "FoundationSquarePreview";

export function FoundationBarPreview({ token }: { token: string }) {
  return (
    <FoundationPreview
      style={{
        height: FOUNDATION.cardSize,
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0 var(--spacing-2)",
      }}
    >
      <div
        style={{
          width: `var(${token})`,
          minWidth: `var(${token})`,
          height: 8,
          background: "var(--color-accent)",
          opacity: 0.6,
          borderRadius: "var(--radius-sm)",
        }}
      />
    </FoundationPreview>
  );
}
FoundationBarPreview.displayName = "FoundationBarPreview";

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
    <FoundationCenteredPreview minHeight={64} style={{ justifyContent: "flex-start" }}>
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
FoundationTypographyPreview.displayName = "FoundationTypographyPreview";

export function FoundationPanel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="foundation-panel" style={style}>
      {children}
    </div>
  );
}
FoundationPanel.displayName = "FoundationPanel";

export function TokenSlot({
  children,
  label,
  value,
  usage,
  copyable = false,
  width = FOUNDATION.cardSizeLg,
}: {
  children: ReactNode;
  label: string;
  value?: string;
  usage?: string;
  copyable?: boolean;
  width?: number | string;
}) {
  async function handleCopy() {
    if (!copyable || !value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API unavailable.
    }
  }

  return (
    <article className="foundation-token-slot" style={{ width }}>
      {children}
      <code className="foundation-token-slot__label">{label}</code>
      {value != null ? (
        copyable ? (
          <button type="button" className="foundation-token-slot__value" onClick={() => void handleCopy()}>
            {value}
          </button>
        ) : (
          <code className="foundation-token-slot__value">{value}</code>
        )
      ) : null}
      {usage ? <p className="foundation-token-slot__usage">{usage}</p> : null}
    </article>
  );
}
TokenSlot.displayName = "TokenSlot";

export function resolveToken(token: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}
