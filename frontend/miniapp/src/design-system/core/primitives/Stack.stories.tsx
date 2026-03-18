import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./index";

const meta: Meta<typeof Stack> = {
  title: "Primitives/Stack",
  component: Stack,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Flex container with direction, gap, align, justify. Use for vertical or horizontal layouts.",
      },
    },
  },
  argTypes: {
    direction: { control: "select", options: ["vertical", "horizontal"] },
    gap: { control: "select", options: ["1", "2", "3", "4", "6"] },
    align: { control: "select", options: ["start", "center", "end", "stretch"] },
    justify: { control: "select", options: ["start", "center", "end", "between"] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <span>Item 1</span>
        <span>Item 2</span>
        <span>Item 3</span>
      </>
    ),
    direction: "vertical",
    gap: "4",
  },
};

export const Gaps: Story = {
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
          gap=1 (4px)
        </div>
        <Stack gap="1" direction="horizontal">
          <div
            style={{
              width: 40,
              height: 24,
              background: "var(--color-accent)",
              opacity: 0.5,
              borderRadius: "var(--radius-sm)",
            }}
          />
          <div
            style={{
              width: 40,
              height: 24,
              background: "var(--color-accent)",
              opacity: 0.5,
              borderRadius: "var(--radius-sm)",
            }}
          />
          <div
            style={{
              width: 40,
              height: 24,
              background: "var(--color-accent)",
              opacity: 0.5,
              borderRadius: "var(--radius-sm)",
            }}
          />
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
          gap=4 (16px)
        </div>
        <Stack gap="4" direction="horizontal">
          <div
            style={{
              width: 40,
              height: 24,
              background: "var(--color-accent)",
              opacity: 0.5,
              borderRadius: "var(--radius-sm)",
            }}
          />
          <div
            style={{
              width: 40,
              height: 24,
              background: "var(--color-accent)",
              opacity: 0.5,
              borderRadius: "var(--radius-sm)",
            }}
          />
          <div
            style={{
              width: 40,
              height: 24,
              background: "var(--color-accent)",
              opacity: 0.5,
              borderRadius: "var(--radius-sm)",
            }}
          />
        </Stack>
      </div>
    </Stack>
  ),
};

export const Directions: Story = {
  render: () => (
    <Stack gap="6">
      <Stack gap="2" direction="vertical">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
          }}
        >
          direction=vertical
        </span>
        <Stack gap="2" direction="vertical">
          <div
            style={{
              padding: "var(--spacing-2)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            A
          </div>
          <div
            style={{
              padding: "var(--spacing-2)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            B
          </div>
        </Stack>
      </Stack>
      <Stack gap="2" direction="horizontal">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
          }}
        >
          direction=horizontal
        </span>
        <Stack gap="2" direction="horizontal">
          <div
            style={{
              padding: "var(--spacing-2)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            A
          </div>
          <div
            style={{
              padding: "var(--spacing-2)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            B
          </div>
        </Stack>
      </Stack>
    </Stack>
  ),
};

export const AlignJustify: Story = {
  render: () => (
    <Stack gap="6">
      <Stack gap="2" direction="horizontal" justify="between">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
          }}
        >
          justify=between
        </span>
        <Stack gap="2" direction="horizontal" justify="between">
          <div
            style={{
              padding: "var(--spacing-2)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Left
          </div>
          <div
            style={{
              padding: "var(--spacing-2)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Right
          </div>
        </Stack>
      </Stack>
    </Stack>
  ),
};
