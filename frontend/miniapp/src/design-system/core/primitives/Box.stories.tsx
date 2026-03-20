import type { Meta, StoryObj } from "@storybook/react";
import { Box, Stack } from "./index";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof Box> = {
  title: "Primitives/Box",
  component: Box,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Base layout wrapper and styling anchor. Use `Box` when you need a structural wrapper with a stable class name and token-safe spacing.",
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
    <StorySection title="With tokens" description="Card-like surface with tokenized spacing and border.">
      <StoryShowcase>
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
      </StoryShowcase>
    </StorySection>
  ),
};

export const LayoutExample: Story = {
  render: () => (
    <StorySection title="Layout example" description="Useful as a neutral wrapper in stacked layouts.">
      <StoryShowcase>
        <Stack gap="4">
          <Box>First block</Box>
          <Box>Second block</Box>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};
