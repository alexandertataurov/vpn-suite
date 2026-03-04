import type { Decorator } from "@storybook/react";

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

const styles: React.CSSProperties = {
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

export const withDarkMode: Decorator = (Story) => {
  return (
    <div style={styles}>
      <div
        data-theme="light"
        style={{ ...panel, ...lightVars, background: "#FAFAFA", color: "#0A0A0A" }}
      >
        <div style={{ ...label, color: "#71717A" }}>Light</div>
        <Story />
      </div>
      <div
        data-theme="dark"
        style={{ ...panel, ...darkVars, background: "#0A0E12", color: "#EDF2F8" }}
      >
        <div style={{ ...label, color: "#6E8499" }}>Dark</div>
        <Story />
      </div>
    </div>
  );
};
