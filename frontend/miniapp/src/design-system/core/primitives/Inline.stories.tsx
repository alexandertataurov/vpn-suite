import type { Meta, StoryObj } from "@storybook/react";
import { Inline } from "./index";

const meta: Meta<typeof Inline> = {
  title: "Primitives/Inline",
  component: Inline,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Horizontal Stack with gap. Use for inline layouts, chips, or icon+text pairs.",
      },
    },
  },
  argTypes: {
    gap: { control: "select", options: ["1", "2", "3", "4"] },
    align: { control: "select", options: ["start", "center", "end", "stretch"] },
    wrap: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <span>Label</span>
        <span>Value</span>
      </>
    ),
    gap: "2",
    align: "center",
  },
};

export const ChipRow: Story = {
  render: () => (
    <Inline gap="2" wrap>
      {["Active", "Premium", "3 devices"].map((label) => (
        <span
          key={label}
          style={{
            padding: "4px 10px",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--typo-caption-size)",
            fontWeight: 600,
            color: "var(--color-text-muted)",
          }}
        >
          {label}
        </span>
      ))}
    </Inline>
  ),
};

export const IconAndText: Story = {
  render: () => (
    <Inline gap="2" align="center">
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "var(--radius-sm)",
          background: "var(--color-accent)",
          opacity: 0.5,
        }}
      />
      <span style={{ color: "var(--color-text)" }}>Item with icon</span>
    </Inline>
  ),
};
