import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/design-system";

const meta: Meta<typeof Badge> = {
  title: "Primitives/Badge",
  component: Badge,
  parameters: {
    a11y: { disable: false },
    viewport: { defaultViewport: "responsive" },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Overview: Story = {
  render: () => (
    <div className="sb-stack">
      <div className="sb-section">
        <div className="sb-section-title">Variants</div>
        <div className="sb-row">
          <Badge variant="default">Default</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="nominal">Nominal</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="critical">Critical</Badge>
          <Badge variant="standby">Standby</Badge>
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-section-title">Sizes</div>
        <div className="sb-row">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-section-title">States (Dot)</div>
        <div className="sb-row">
          <Badge variant="nominal" pulse>Online</Badge>
          <Badge variant="warning" pulse>Degraded</Badge>
          <Badge variant="critical" pulse>Offline</Badge>
        </div>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <Badge variant="default">Default</Badge>
      <Badge variant="accent">Accent</Badge>
      <Badge variant="nominal">Nominal</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="critical">Critical</Badge>
      <Badge variant="standby">Standby</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-row">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-row">
      <Badge variant="nominal" pulse>Online</Badge>
      <Badge variant="warning" pulse>Degraded</Badge>
      <Badge variant="critical" pulse>Offline</Badge>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-row">
      <Badge className="ds-badge-truncate max-w-200">Extremely long badge text that should truncate</Badge>
      <Badge variant="accent">123,456</Badge>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="sb-row">
      <Badge variant="nominal" aria-label="Healthy">Healthy</Badge>
      <Badge variant="critical" aria-label="Down">Down</Badge>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="sb-row">
      <Badge variant="default">Default</Badge>
      <Badge variant="accent">Accent</Badge>
      <Badge variant="nominal">Nominal</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="critical">Critical</Badge>
    </div>
  ),
};

export const EdgeCases = WithLongText;
