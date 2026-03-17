import type { CSSProperties, ReactNode } from "react";

type StoryPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  stats?: Array<{ label: string; value: string }>;
  children: ReactNode;
};

type StorySectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

type StoryCardProps = {
  title: string;
  caption?: string;
  children: ReactNode;
};

type TokenSpec = {
  name: string;
  token: string;
  usage: string;
  /** Canonical desktop value, e.g. `24px` or `1.25`. */
  value?: string;
  /** Mobile-focused note, e.g. `32px → 28px on mobile` or `unchanged`. */
  mobileValue?: string;
  /** Line-height guidance, e.g. `1.1` or `lh 1.5`. */
  lineHeight?: string;
  /** Weight guidance, e.g. `400` / `600` / `700`. */
  weight?: string;
  /** Font family, e.g. `Space Grotesk` or `IBM Plex Mono`. */
  family?: string;
  note?: string;
  preview?: ReactNode;
};

type TokenTableProps = {
  specs: TokenSpec[];
};

type UsageExampleProps = {
  title: string;
  description: string;
  children: ReactNode;
};

type PillTone = "neutral" | "accent" | "success" | "warning" | "danger";

export function StoryPage({ eyebrow, title, summary, stats, children }: StoryPageProps) {
  return (
    <div style={pageStyle}>
      <header style={heroStyle}>
        <div style={heroCopyStyle}>
          <div style={eyebrowStyle}>{eyebrow}</div>
          <h1 style={titleStyle}>{title}</h1>
          <p style={summaryStyle}>{summary}</p>
        </div>
        {stats ? (
          <div style={statsGridStyle}>
            {stats.map((stat) => (
              <div key={stat.label} style={statCardStyle}>
                <div style={statValueStyle}>{stat.value}</div>
                <div style={statLabelStyle}>{stat.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </header>
      {children}
    </div>
  );
}

export function StorySection({ title, description, children }: StorySectionProps) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeadingStyle}>
        <h2 style={sectionTitleStyle}>{title}</h2>
        <p style={sectionDescriptionStyle}>{description}</p>
      </div>
      {children}
    </section>
  );
}

export function StoryCard({ title, caption, children }: StoryCardProps) {
  return (
    <article style={cardStyle}>
      <div style={cardHeaderStyle}>
        <h3 style={cardTitleStyle}>{title}</h3>
        {caption ? <p style={cardCaptionStyle}>{caption}</p> : null}
      </div>
      {children}
    </article>
  );
}

export function TwoColumn({ children }: { children: ReactNode }) {
  return <div style={twoColumnStyle}>{children}</div>;
}

export function ThreeColumn({ children }: { children: ReactNode }) {
  return <div style={threeColumnStyle}>{children}</div>;
}

export function TokenTable({ specs }: TokenTableProps) {
  return (
    <div style={tokenTableStyle}>
      {specs.map((spec, index) => (
        <div
          key={spec.name}
          style={{
            ...tokenRowStyle,
            background: index % 2 === 0 ? "var(--color-surface)" : "color-mix(in oklch, var(--color-surface) 96%, var(--color-surface-2) 4%)",
          }}
        >
          <div style={tokenMetaStyle}>
            <div style={tokenNameStyle}>{spec.name}</div>
            <code style={tokenCodeStyle}>{spec.token}</code>
          </div>
          <div style={tokenUsageStyle}>
            <div>{spec.usage}</div>
            {spec.note ? <div style={tokenNoteStyle}>{spec.note}</div> : null}
          </div>
          <div style={tokenValueCellStyle}>
            {spec.value ? <span style={tokenValuePrimaryStyle}>{spec.value}</span> : null}
            {spec.mobileValue ? <span style={tokenValueSecondaryStyle}>{spec.mobileValue}</span> : null}
          </div>
          <div style={tokenPreviewCellStyle}>{spec.preview ?? <code style={tokenCodeStyle}>var({spec.token})</code>}</div>
        </div>
      ))}
    </div>
  );
}

export function UsageExample({ title, description, children }: UsageExampleProps) {
  return (
    <div style={usageExampleStyle}>
      <div style={usageCopyStyle}>
        <div style={usageTitleStyle}>{title}</div>
        <div style={usageDescriptionStyle}>{description}</div>
      </div>
      <div style={usagePreviewStyle}>{children}</div>
    </div>
  );
}

export function ValuePill({ value, tone = "neutral" }: { value: string; tone?: PillTone }) {
  const backgroundMap: Record<PillTone, string> = {
    neutral: "var(--color-surface-2)",
    accent: "var(--blue-d)",
    success: "var(--green-d)",
    warning: "var(--amber-d)",
    danger: "var(--red-d)",
  };
  const colorMap: Record<PillTone, string> = {
    neutral: "var(--color-text)",
    accent: "var(--color-accent)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-error)",
  };

  return (
    <span
      style={{
        ...pillStyle,
        background: backgroundMap[tone],
        color: colorMap[tone],
      }}
    >
      {value}
    </span>
  );
}

export function BoxPreview({
  label,
  style,
}: {
  label: string;
  style?: CSSProperties;
}) {
  return <div style={{ ...boxPreviewStyle, ...style }}>{label}</div>;
}

const pageStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-6)",
  padding: "var(--spacing-6)",
  background:
    "linear-gradient(180deg, color-mix(in oklch, var(--color-surface) 62%, var(--color-bg) 38%) 0%, var(--color-bg) 100%)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: "var(--radius-xl)",
  maxWidth: "1120px",
};

const heroStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-5)",
  gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 1fr)",
  alignItems: "start",
};

const heroCopyStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-3)",
};

const eyebrowStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-meta-size)",
  lineHeight: 1.4,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h1-size)",
  lineHeight: 1.1,
  fontWeight: 600,
};

const summaryStyle: CSSProperties = {
  margin: 0,
  maxWidth: "640px",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-size)",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-3)",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
};

const statCardStyle: CSSProperties = {
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "color-mix(in oklch, var(--color-surface) 92%, var(--color-surface-2) 8%)",
  border: "1px solid var(--color-border)",
};

const statValueStyle: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h2-size)",
  lineHeight: 1.1,
  fontWeight: 600,
  color: "var(--color-text)",
};

const statLabelStyle: CSSProperties = {
  marginTop: "var(--spacing-2)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  color: "var(--color-text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-5)",
};

const sectionHeadingStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h2-size)",
  lineHeight: 1.2,
  fontWeight: 600,
};

const sectionDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.6,
};

const twoColumnStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-4)",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  alignItems: "stretch",
};

const threeColumnStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-4)",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  alignItems: "stretch",
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-4)",
  gridTemplateRows: "auto minmax(0, 1fr)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface)",
  border: "1px solid color-mix(in oklch, var(--color-border) 70%, var(--color-text) 30%)",
  boxShadow: "0 1px 3px color-mix(in oklch, black 6%, transparent)",
};

const cardHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-2)",
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h3-size)",
  lineHeight: 1.25,
  fontWeight: 600,
};

const cardCaptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
};

const tokenTableStyle: CSSProperties = {
  display: "grid",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
};

const tokenRowStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-3)",
  gridTemplateColumns:
    "minmax(160px, 0.9fr) minmax(240px, 1.2fr) minmax(160px, 0.8fr) minmax(200px, 1fr)",
  alignItems: "center",
  padding: "var(--spacing-3) var(--spacing-4)",
  borderBottom: "1px solid var(--color-border-subtle)",
};

const tokenMetaStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-1)",
};

const tokenNameStyle: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  fontWeight: 600,
  lineHeight: 1.4,
};

const tokenCodeStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  color: "var(--color-text-tertiary)",
};

const tokenUsageStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-1)",
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
};

const tokenValueCellStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  justifyContent: "flex-start",
  alignItems: "center",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
};

const tokenValuePrimaryStyle: CSSProperties = {
  color: "var(--color-text)",
};

const tokenValueSecondaryStyle: CSSProperties = {
  color: "var(--color-text-tertiary)",
};

const tokenNoteStyle: CSSProperties = {
  color: "var(--color-text-tertiary)",
};

const tokenPreviewCellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "center",
  minHeight: "56px",
  gap: "4px",
};

const usageExampleStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-4)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "color-mix(in oklch, var(--color-surface) 96%, var(--color-surface-2) 4%)",
  border: "1px solid var(--color-border)",
};

const usageCopyStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-1)",
};

const usageTitleStyle: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-size)",
  lineHeight: 1.4,
  fontWeight: 600,
};

const usageDescriptionStyle: CSSProperties = {
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
};

const usagePreviewStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-3)",
};

const pillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--spacing-1) var(--spacing-3)",
  borderRadius: "var(--radius-full)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.3,
  fontWeight: 600,
};

const boxPreviewStyle: CSSProperties = {
  minWidth: "56px",
  minHeight: "48px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--spacing-2)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-2)",
  boxShadow: "var(--shadow-soft)",
  color: "var(--color-text)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.2,
};
