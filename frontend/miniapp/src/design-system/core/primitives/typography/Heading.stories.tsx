import type { Meta, StoryObj } from "@storybook/react";
import { Heading, Stack } from "../index";

const meta: Meta<typeof Heading> = {
  title: "Primitives/Heading",
  component: Heading,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Semantic heading levels. Use level 1–4 for hierarchy. Maps to type-h1 through type-h4.",
      },
    },
  },
  argTypes: {
    level: { control: "select", options: [1, 2, 3, 4] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Heading",
    level: 1,
  },
};

export const Levels: Story = {
  render: () => (
    <Stack gap="4">
      <Heading level={1}>Heading 1</Heading>
      <Heading level={2}>Heading 2</Heading>
      <Heading level={3}>Heading 3</Heading>
      <Heading level={4}>Heading 4</Heading>
    </Stack>
  ),
};

export const SemanticMapping: Story = {
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
          level=1 → type-h1 (mono, uppercase)
        </div>
        <Heading level={1}>Page Title</Heading>
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
          level=2 → type-h2 (sans, bold)
        </div>
        <Heading level={2}>Section Title</Heading>
      </div>
    </Stack>
  ),
};
