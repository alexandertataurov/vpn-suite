import type { Meta, StoryObj } from "@storybook/react";
import { Divider, Stack } from "./index";

const meta: Meta<typeof Divider> = {
  title: "Primitives/Divider",
  component: Divider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Horizontal or vertical separator. Use for section breaks or list dividers.",
      },
    },
  },
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    tone: { control: "select", options: ["subtle", "default"] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    orientation: "horizontal",
    tone: "subtle",
  },
};

export const Orientations: Story = {
  render: () => (
    <Stack gap="6">
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
            marginBottom: "var(--spacing-2)",
          }}
        >
          orientation=horizontal
        </div>
        <Stack gap="2">
          <span>Section A</span>
          <Divider orientation="horizontal" tone="subtle" />
          <span>Section B</span>
        </Stack>
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
            marginBottom: "var(--spacing-2)",
          }}
        >
          orientation=vertical
        </div>
        <Stack gap="2" direction="horizontal" align="stretch">
          <span>Left</span>
          <Divider orientation="vertical" tone="subtle" />
          <span>Center</span>
          <Divider orientation="vertical" tone="default" />
          <span>Right</span>
        </Stack>
      </div>
    </Stack>
  ),
};

export const Tones: Story = {
  render: () => (
    <Stack gap="4">
      <Stack gap="2">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
          }}
        >
          tone=subtle
        </span>
        <Divider orientation="horizontal" tone="subtle" />
      </Stack>
      <Stack gap="2">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
          }}
        >
          tone=default
        </span>
        <Divider orientation="horizontal" tone="default" />
      </Stack>
    </Stack>
  ),
};
