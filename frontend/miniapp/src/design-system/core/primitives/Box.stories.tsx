import type { Meta, StoryObj } from "@storybook/react";
import { Box, Stack } from "./index";

const meta: Meta<typeof Box> = {
  title: "Primitives/Box",
  component: Box,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Base layout wrapper. Use for layout or as a styling anchor. Applies `ds-box` class.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Box content — base div with ds-box",
  },
};

export const WithTokens: Story = {
  render: () => (
    <Box
      style={{
        padding: "var(--spacing-4)",
        background: "var(--color-surface)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
      }}
    >
      Box with design tokens applied via style/className
    </Box>
  ),
};

export const LayoutExample: Story = {
  render: () => (
    <Stack gap="4">
      <Box>First block</Box>
      <Box>Second block</Box>
    </Stack>
  ),
};
