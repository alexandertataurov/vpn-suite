import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Primitives/Text",
  component: Text,
  parameters: {
    docs: {
      description: {
        component: "Typography primitive. Variants: body, caption, etc.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Text>;

export const Overview: Story = { args: { children: "Body text" } };

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Text variant="body">Body text</Text>
      <Text variant="muted">Muted text</Text>
      <Text variant="caption">Caption</Text>
      <Text variant="danger">Error text</Text>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; use variants.</p>
      <Text>Body text</Text>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <Text>Default</Text>
    </div>
  ),
};

export const WithLongText: Story = {
  args: { children: "Long text that should wrap across multiple lines without breaking rhythm." },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { children: "Body text" },
};

export const Accessibility: Story = {
  args: { children: "Accessible body text" },
};

export const EdgeCases = WithLongText;
