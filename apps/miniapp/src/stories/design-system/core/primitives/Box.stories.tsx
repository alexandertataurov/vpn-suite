import type { Meta, StoryObj } from "@storybook/react";
import { Box, Stack } from "@/design-system/primitives";
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
  parameters: {
    docs: {
      description: {
        story:
          "Neutral structural wrapper with no layout opinion. Use it as the smallest reusable building block.",
      },
    },
  },
};

export const WithTokens: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A token-styled card-like example that shows Box as a composition anchor rather than a visual component.",
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          "Two stacked blocks inside Box to show how the primitive behaves in neutral page composition.",
      },
    },
  },
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
