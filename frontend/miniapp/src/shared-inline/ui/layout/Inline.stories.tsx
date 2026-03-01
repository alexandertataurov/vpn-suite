import type { Meta, StoryObj } from "@storybook/react";
import { Inline } from "./Inline";

const meta: Meta<typeof Inline> = {
  title: "Primitives/Inline",
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

export const Overview: Story = {
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

export const Variants: Story = {
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

export const Sizes: Story = {
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

export const States: Story = {
  render: () => (
    <Inline gap="2">
      <span>A</span>
      <span>B</span>
      <span>C</span>
    </Inline>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <span>Long inline item that should wrap</span>
      <span>Second item</span>
      <span>Third item</span>
    </Inline>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <Inline gap="2">
      <span>A</span>
      <span>B</span>
      <span>C</span>
    </Inline>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Inline gap="2">
      <span>Inline items</span>
      <span>Accessible layout</span>
    </Inline>
  ),
};

export const EdgeCases = WithLongText;
