import type { Meta, StoryObj } from "@storybook/react";
import { Inline } from "./index";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof Inline> = {
  title: "Primitives/Inline",
  component: Inline,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Horizontal layout primitive for inline rows, chips, icon-plus-text pairs, and compact metadata.",
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
  parameters: {
    docs: {
      description: {
        story:
          "Default inline row for compact metadata and small paired elements.",
      },
    },
  },
};

export const ChipRow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Wrapped chip row that stays readable on small screens and avoids overflow.",
      },
    },
  },
  render: () => (
    <StorySection title="Chip row" description="Use wrap to keep short tokens readable on narrow screens.">
      <StoryShowcase>
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
      </StoryShowcase>
    </StorySection>
  ),
};

export const IconAndText: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Icon-plus-text alignment example for compact status or label rows.",
      },
    },
  },
  render: () => (
    <StorySection title="Icon and text" description="Use Inline to align small icon and text combinations cleanly.">
      <StoryShowcase>
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
      </StoryShowcase>
    </StorySection>
  ),
};
