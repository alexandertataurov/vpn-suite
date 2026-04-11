import type { Meta, StoryObj } from "@storybook/react";
import type { IconType } from "@/design-system/icons";
import * as IconExports from "@/design-system/icons";
import {
  FoundationGrid,
  FoundationGroup,
  FoundationIntro,
  FoundationPanel,
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationSquarePreview,
  resolveToken,
} from "../shared/foundationShared";

type IconEntry = {
  key: string;
  name: string;
  Icon: IconType;
};

function formatIconName(iconKey: string): string {
  const base = iconKey.startsWith("Icon") ? iconKey.slice(4) : iconKey;
  return base.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function getIconEntries(): IconEntry[] {
  return Object.entries(IconExports)
    .filter(([key, value]) => key.startsWith("Icon") && typeof value === "function")
    .map(([key, value]) => ({
      key,
      name: formatIconName(key),
      Icon: value as unknown as IconType,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const ICONS = getIconEntries();

const sizes = {
  sm: "--icon-size-sm",
  md: "--icon-size-md",
} as const;

const meta: Meta = {
  title: "Foundations/Icons",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    toolbar: {
      tokenMode: { hidden: false },
    },
  },
};

export default meta;

export const Sizes: StoryObj = {
  name: "Icon sizes",
  render: () => {
    const Icon = ICONS[0]?.Icon;
    if (!Icon) return null;

    return (
      <FoundationSection>
        <FoundationIntro
          title="Icon Size Tokens"
          description="Use system icon exports and size tokens to keep visual weight consistent."
        />
        <FoundationGroup>
          <GroupLabel>Size scale</GroupLabel>
          <TokenGrid>
            {Object.entries(sizes).map(([key, token]) => (
              <TokenSlot key={token} label={token.replace("--", "")} value={resolveToken(token)} usage={key}>
                <FoundationSquarePreview
                  size={72}
                  style={{ alignItems: "center", justifyContent: "center", background: "var(--color-surface-2)" }}
                >
                  <Icon size={key === "sm" ? 16 : 20} strokeWidth={2} />
                </FoundationSquarePreview>
              </TokenSlot>
            ))}
          </TokenGrid>
        </FoundationGroup>
      </FoundationSection>
    );
  },
};

export const Gallery: StoryObj<{ columns: number }> = {
  name: "Icon gallery",
  argTypes: {
    columns: {
      control: { type: "range", min: 3, max: 8, step: 1 },
    },
  },
  args: {
    columns: 6,
  },
  render: ({ columns }) => (
    <FoundationSection>
      <FoundationIntro
        title="Icon Inventory"
        description="Minimal, deterministic icon gallery with consistent tile structure and no local state."
      />
      <FoundationPanel>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Showing first 36 icons from design-system exports.</p>
        <div
          style={{
            display: "grid",
            gap: "var(--spacing-2)",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {ICONS.slice(0, 36).map((entry) => {
            const Icon = entry.Icon;
            return (
              <div
                key={entry.key}
                style={{
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-surface)",
                  background: "var(--color-surface)",
                  minHeight: 72,
                  display: "grid",
                  gap: "6px",
                  alignContent: "center",
                  justifyItems: "center",
                  padding: "var(--spacing-2)",
                }}
              >
                <Icon size={18} strokeWidth={2} />
                <span style={{ fontSize: "var(--typo-meta-size)", textAlign: "center" }}>{entry.name}</span>
              </div>
            );
          })}
        </div>
      </FoundationPanel>
      <FoundationGrid minColumn={260}>
        <FoundationPanel>
          <GroupLabel>Import</GroupLabel>
          <code>{`import { IconShield } from "@/design-system/icons";`}</code>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Usage</GroupLabel>
          <code>{`<IconShield size={16} strokeWidth={2} />`}</code>
        </FoundationPanel>
      </FoundationGrid>
    </FoundationSection>
  ),
};
