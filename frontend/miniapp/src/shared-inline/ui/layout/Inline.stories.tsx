import type { Meta, StoryObj } from "@storybook/react";
import { Inline } from "./Inline";

const meta: Meta<typeof Inline> = {
  title: "Shared/Primitives/Inline",
  component: Inline,
  parameters: {
    docs: {
      description: {
        component: "Horizontal flex layout with gap.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Inline>;

export const InlineOverview: Story = {
  args: {
    gap: 2,
    children: (
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>
    ),
  },
};

export const InlineVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Inline gap="2">
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Inline>
      <Inline gap="4">
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Inline>
    </div>
  ),
};

export const InlineSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are controlled by gap tokens.</p>
      <Inline gap="2">
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Inline>
    </div>
  ),
};

export const InlineStates: Story = {
  render: () => (
    <Inline gap="2">
      <span>A</span>
      <span>B</span>
      <span>C</span>
    </Inline>
  ),
};

export const InlineWithLongText: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <span>Long inline item that should wrap</span>
      <span>Second item</span>
      <span>Third item</span>
    </Inline>
  ),
};

export const InlineDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <Inline gap="2">
      <span>A</span>
      <span>B</span>
      <span>C</span>
    </Inline>
  ),
};

export const InlineAccessibility: Story = {
  render: () => (
    <Inline gap="2">
      <span>Inline items</span>
      <span>Accessible layout</span>
    </Inline>
  ),
};

export const InlineEdgeCases = WithLongText;
