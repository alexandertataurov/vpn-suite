import type { Meta, StoryObj } from "@storybook/react";
import { HealthBadge } from "./HealthBadge";

const meta: Meta<typeof HealthBadge> = {
  title: "Components/HealthBadge",
  component: HealthBadge,
  parameters: {
    a11y: { disable: false },
    viewport: { defaultViewport: "responsive" },
  },
};

export default meta;
type Story = StoryObj<typeof HealthBadge>;

export const Overview: Story = {
  render: () => (
    <div className="sb-stack">
      <div className="sb-section">
        <div className="sb-section-title">Statuses</div>
        <div className="sb-row">
          <HealthBadge status="healthy" />
          <HealthBadge status="warning" />
          <HealthBadge status="degraded" />
          <HealthBadge status="error" />
          <HealthBadge status="unknown" />
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-section-title">Custom Labels</div>
        <div className="sb-row">
          <HealthBadge status="healthy" label="All systems go" />
          <HealthBadge status="warning" label="Needs review" />
          <HealthBadge status="error" label="Action required" />
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-section-title">Edge Cases</div>
        <div className="sb-row">
          <HealthBadge status="unknown" label="Status unavailable from agent" />
        </div>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <HealthBadge status="healthy" />
      <HealthBadge status="warning" />
      <HealthBadge status="degraded" />
      <HealthBadge status="error" />
      <HealthBadge status="unknown" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses badge tokens.</p>
      <HealthBadge status="healthy" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-row">
      <HealthBadge status="healthy" />
      <HealthBadge status="warning" />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <HealthBadge status="unknown" label="Status unavailable from agent due to connectivity issues" />
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="sb-row">
      <HealthBadge status="healthy" aria-label="System healthy" />
      <HealthBadge status="error" aria-label="System error" />
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="sb-row">
      <HealthBadge status="healthy" />
      <HealthBadge status="warning" />
      <HealthBadge status="degraded" />
      <HealthBadge status="error" />
      <HealthBadge status="unknown" />
    </div>
  ),
};

export const EdgeCases = WithLongText;
