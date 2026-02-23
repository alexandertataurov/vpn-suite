import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

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
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
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
          <Badge variant="success" className="ds-badge-dot">
            <span className="ds-badge-dot-indicator" aria-hidden />
            Online
          </Badge>
          <Badge variant="warning" className="ds-badge-dot">
            <span className="ds-badge-dot-indicator" aria-hidden />
            Degraded
          </Badge>
          <Badge variant="danger" className="ds-badge-dot">
            <span className="ds-badge-dot-indicator" aria-hidden />
            Offline
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
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
      <Badge variant="success" className="ds-badge-dot">
        <span className="ds-badge-dot-indicator" aria-hidden />
        Online
      </Badge>
      <Badge variant="warning" className="ds-badge-dot">
        <span className="ds-badge-dot-indicator" aria-hidden />
        Degraded
      </Badge>
      <Badge variant="danger" className="ds-badge-dot">
        <span className="ds-badge-dot-indicator" aria-hidden />
        Offline
      </Badge>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-row">
      <Badge className="ds-badge-truncate max-w-200">Extremely long badge text that should truncate</Badge>
      <Badge variant="info">123,456</Badge>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="sb-row">
      <Badge variant="success" aria-label="Healthy">Healthy</Badge>
      <Badge variant="danger" aria-label="Down">Down</Badge>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="sb-row">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
    </div>
  ),
};

export const EdgeCases = WithLongText;
