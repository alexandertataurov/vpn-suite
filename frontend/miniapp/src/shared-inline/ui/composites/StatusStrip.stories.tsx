import type { Meta, StoryObj } from "@storybook/react";
import { StatusStrip } from "./StatusStrip";

const meta: Meta<typeof StatusStrip> = {
  title: "Shared/Patterns/StatusStrip",
  component: StatusStrip,
};

export default meta;

type Story = StoryObj<typeof StatusStrip>;

export const StatusStripOverview: Story = {
  args: {
    items: [
      { status: "healthy", label: "Core" },
      { status: "warning", label: "Edge" },
      { status: "error", label: "Auth" },
    ],
  },
};

export const StatusStripVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <StatusStrip items={[{ status: "healthy", label: "Core" }]} />
      <StatusStrip items={[{ status: "warning", label: "Edge" }]} />
      <StatusStrip items={[{ status: "error", label: "Auth" }]} />
    </div>
  ),
};

export const StatusStripSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <StatusStrip items={[{ status: "healthy", label: "Core" }]} />
    </div>
  ),
};

export const StatusStripStates: Story = {
  render: () => (
    <StatusStrip items={[{ status: "healthy", label: "Core" }, { status: "warning", label: "Edge" }]} />
  ),
};

export const StatusStripWithLongText: Story = {
  args: {
    items: [
      { status: "warning", label: "Edge cluster with extended label" },
      { status: "healthy", label: "Core" },
    ],
  },
};

export const StatusStripDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: {
    items: [
      { status: "healthy", label: "Core" },
      { status: "warning", label: "Edge" },
      { status: "error", label: "Auth" },
    ],
  },
};

export const StatusStripAccessibility: Story = {
  args: {
    items: [
      { status: "healthy", label: "Core" },
      { status: "warning", label: "Edge" },
      { status: "error", label: "Auth" },
    ],
  },
};

export const StatusStripEdgeCases = WithLongText;
