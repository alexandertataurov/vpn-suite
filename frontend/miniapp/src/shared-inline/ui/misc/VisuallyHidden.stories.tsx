import type { Meta, StoryObj } from "@storybook/react";
import { VisuallyHidden } from "./VisuallyHidden";

const meta: Meta<typeof VisuallyHidden> = {
  title: "Shared/Primitives/VisuallyHidden",
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

export const VisuallyHiddenOverview: Story = {
  args: { children: "Screen reader only text" },
};

export const VisuallyHiddenVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <VisuallyHidden>Hidden label</VisuallyHidden>
      <span>Visible text</span>
    </div>
  ),
};

export const VisuallyHiddenSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; text is visually hidden.</p>
      <VisuallyHidden>Hidden label</VisuallyHidden>
    </div>
  ),
};

export const VisuallyHiddenStates: Story = {
  render: () => (
    <div className="sb-stack">
      <VisuallyHidden>Hidden label</VisuallyHidden>
    </div>
  ),
};

export const VisuallyHiddenWithLongText: Story = {
  args: { children: "Long screen reader label that should remain hidden visually and readable by assistive tech." },
};

export const VisuallyHiddenDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { children: "Screen reader only text" },
};

export const VisuallyHiddenAccessibility: Story = {
  args: { children: "Screen reader only text" },
};

export const VisuallyHiddenEdgeCases = WithLongText;
