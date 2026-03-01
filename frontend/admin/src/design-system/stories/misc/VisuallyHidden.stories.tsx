import type { Meta, StoryObj } from "@storybook/react";
import { VisuallyHidden } from "@/design-system";

const meta: Meta<typeof VisuallyHidden> = {
  title: "Primitives/VisuallyHidden",
  component: VisuallyHidden,
  parameters: {
    docs: {
      description: {
        component: "Content for screen readers only. Use for icon labels.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof VisuallyHidden>;

export const Overview: Story = {
  args: { children: "Screen reader only text" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <VisuallyHidden>Hidden label</VisuallyHidden>
      <span>Visible text</span>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; text is visually hidden.</p>
      <VisuallyHidden>Hidden label</VisuallyHidden>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <VisuallyHidden>Hidden label</VisuallyHidden>
    </div>
  ),
};

export const WithLongText: Story = {
  args: { children: "Long screen reader label that should remain hidden visually and readable by assistive tech." },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { children: "Screen reader only text" },
};

export const Accessibility: Story = {
  args: { children: "Screen reader only text" },
};

export const EdgeCases = WithLongText;
