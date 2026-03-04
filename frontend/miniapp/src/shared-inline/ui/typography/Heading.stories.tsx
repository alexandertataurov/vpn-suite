import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Shared/Primitives/Heading",
  component: Heading,
  parameters: {
    docs: {
      description: {
        component: "Heading levels h1-h6. Use semantic levels for accessibility.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Heading>;

export const HeadingOverview: Story = { args: { level: 2, children: "Heading" } };

export const HeadingVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Heading level={1}>Heading 1</Heading>
      <Heading level={2}>Heading 2</Heading>
      <Heading level={3}>Heading 3</Heading>
      <Heading level={4}>Heading 4</Heading>
    </div>
  ),
};

export const HeadingSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Sizes map to semantic heading levels.</p>
      <Heading level={2}>Heading 2</Heading>
    </div>
  ),
};

export const HeadingStates: Story = {
  render: () => (
    <div className="sb-stack">
      <Heading level={2}>Default</Heading>
    </div>
  ),
};

export const HeadingWithLongText: Story = {
  args: { level: 2, children: "Long heading title that should wrap without breaking layout" },
};

export const HeadingDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { level: 2, children: "Heading" },
};

export const HeadingAccessibility: Story = {
  args: { level: 2, children: "Semantic heading level" },
};

export const HeadingEdgeCases = WithLongText;
