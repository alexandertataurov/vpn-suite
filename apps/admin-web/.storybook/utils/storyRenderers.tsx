import type { ComponentType, ReactNode } from "react";

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-4, 16px)",
  alignItems: "center",
};

const columnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4, 16px)",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 4,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-text-muted, #3D5166)",
};

export type VariantConfig<T> = { value: T; label?: string; token?: string };

/**
 * Renders a component once per variant in a labeled flex row.
 * Use for Primitives (Button, Badge, etc.) to show all variant options side-by-side.
 */
export function renderAllVariants<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  variantProp: keyof P,
  variants: VariantConfig<unknown>[],
  sharedProps: Omit<P, typeof variantProp> = {} as Omit<P, typeof variantProp>
): ReactNode {
  return (
    <div style={rowStyle}>
      {variants.map(({ value, label }) => (
        <div key={String(value)} style={itemStyle}>
          <span style={labelStyle}>{label ?? String(value)}</span>
          {(() => {
            const C = Component as ComponentType<P & Record<string, unknown>>;
            return <C {...{ ...sharedProps, [variantProp]: value } as P} />;
          })()}
        </div>
      ))}
    </div>
  );
}

/** Renders every size in a labeled column with optional token value */
export function renderAllSizes<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  sizeProp: keyof P,
  sizes: VariantConfig<unknown>[],
  sharedProps: Omit<P, typeof sizeProp> = {} as Omit<P, typeof sizeProp>
): ReactNode {
  return (
    <div style={columnStyle}>
      {sizes.map(({ value, label, token }) => (
        <div key={String(value)} style={itemStyle}>
          <span style={labelStyle}>
            {label ?? String(value)}
            {token ? ` (${token})` : ""}
          </span>
          {(() => {
            const C = Component as ComponentType<P & Record<string, unknown>>;
            return <C {...{ ...sharedProps, [sizeProp]: value } as P} />;
          })()}
        </div>
      ))}
    </div>
  );
}

export type StateConfig<P> = { label: string; props: Partial<P> };

/** Renders every state with a label overlay */
export function renderAllStates<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  states: StateConfig<P>[]
): ReactNode {
  return (
    <div style={rowStyle}>
      {states.map(({ label, props }, i) => (
        <div key={i} style={itemStyle}>
          <span style={labelStyle}>{label}</span>
          {(() => {
            const C = Component as ComponentType<P>;
            return <C {...({ ...props } as P)} />;
          })()}
        </div>
      ))}
    </div>
  );
}

/**
 * Wraps a story render in side-by-side light (left) and dark (right) theme panels.
 * Use for ThemeComparison-style stories; theme vars are applied per panel.
 */
export function renderDarkLight(Story: () => ReactNode): ReactNode {
  const lightVars: React.CSSProperties = {
    ["--color-void" as string]: "#FAFAFA",
    ["--color-base" as string]: "#FAFAFA",
    ["--color-surface" as string]: "#F4F4F5",
    ["--color-elevated" as string]: "#FFFFFF",
    ["--color-text-primary" as string]: "#0A0A0A",
    ["--color-text-secondary" as string]: "#52525B",
    ["--color-border-subtle" as string]: "#E4E4E7",
  };
  const darkVars: React.CSSProperties = {
    ["--color-void" as string]: "#060809",
    ["--color-base" as string]: "#0A0E12",
    ["--color-surface" as string]: "#0E1419",
    ["--color-elevated" as string]: "#141C24",
    ["--color-text-primary" as string]: "#EDF2F8",
    ["--color-text-secondary" as string]: "#6E8499",
    ["--color-border-subtle" as string]: "#1C2A38",
  };
  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    minHeight: 120,
  };
  const panel: React.CSSProperties = { padding: 16, borderRadius: 8 };
  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 8,
  };
  return (
    <div style={grid}>
      <div
        data-theme="light"
        style={{ ...panel, ...lightVars, background: "#FAFAFA", color: "#0A0A0A" }}
      >
        <div style={{ ...label, color: "#71717A" }}>Light</div>
        {Story()}
      </div>
      <div
        data-theme="dark"
        style={{ ...panel, ...darkVars, background: "#0A0E12", color: "#EDF2F8" }}
      >
        <div style={{ ...label, color: "#6E8499" }}>Dark</div>
        {Story()}
      </div>
    </div>
  );
}

const breakpoints = [
  { w: 375, label: "Mobile (375px)" },
  { w: 768, label: "Tablet (768px)" },
  { w: 1280, label: "Desktop (1280px)" },
];

/**
 * Renders a story inside width-constrained containers at 375px, 768px, and 1280px.
 * Use for ResponsiveLayout-style stories to check wrapping and density at breakpoints.
 */
export function renderAtBreakpoints(Story: () => ReactNode): ReactNode {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {breakpoints.map(({ w, label }) => (
        <div key={w} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)" }}>
            {label}
          </span>
          <div
            style={{
              width: w,
              maxWidth: "100%",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 16 }}>{Story()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
