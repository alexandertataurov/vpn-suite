import type { Meta, StoryObj } from "@storybook/react";
import { Container, Stack } from "./index";

const meta: Meta<typeof Container> = {
  title: "Primitives/Container",
  component: Container,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Constrained width + padding. Use for page content, forms, or centered layouts.",
      },
    },
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    padding: { control: "select", options: ["sm", "md"] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Container content — max-width + padding",
    size: "md",
    padding: "md",
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="6">
      <Container size="sm" padding="md">
        <div
          style={{
            padding: "var(--spacing-2)",
            background: "var(--color-surface-2)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
          }}
        >
          size=sm (480px max)
        </div>
      </Container>
      <Container size="md" padding="md">
        <div
          style={{
            padding: "var(--spacing-2)",
            background: "var(--color-surface-2)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
          }}
        >
          size=md (720px max)
        </div>
      </Container>
      <Container size="lg" padding="md">
        <div
          style={{
            padding: "var(--spacing-2)",
            background: "var(--color-surface-2)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text-muted)",
          }}
        >
          size=lg (960px max)
        </div>
      </Container>
    </Stack>
  ),
};

export const PaddingVariants: Story = {
  render: () => (
    <Stack gap="4">
      <Container size="md" padding="sm">
        <div
          style={{
            background: "var(--color-accent)",
            opacity: 0.2,
            height: 24,
            borderRadius: "var(--radius-sm)",
          }}
        />
        padding=sm
      </Container>
      <Container size="md" padding="md">
        <div
          style={{
            background: "var(--color-accent)",
            opacity: 0.2,
            height: 24,
            borderRadius: "var(--radius-sm)",
          }}
        />
        padding=md
      </Container>
    </Stack>
  ),
};
