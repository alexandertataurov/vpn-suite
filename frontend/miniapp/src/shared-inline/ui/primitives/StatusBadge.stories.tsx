import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof StatusBadge> = {
  title: "Shared/Primitives/StatusBadge",
  component: StatusBadge,
  parameters: {
    docs: {
      description: {
        component: `Canonical operator status pill.

**Use:** OK / Degraded / Down / Unknown system status.
**Avoid:** Domain-specific labels; use domain badges or HealthBadge.

**Tokens:** --color-success, --color-warning, --color-danger, --color-border-subtle.
**Accessibility:** Include context in surrounding text; keep labels short.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const StatusBadgeOverview: Story = {
  args: { status: "ok" },
};

export const StatusBadgeVariants: Story = {
  render: () => (
    <div className="sb-row">
      <StatusBadge status="ok" />
      <StatusBadge status="degraded" />
      <StatusBadge status="down" />
      <StatusBadge status="unknown" />
    </div>
  ),
};

export const StatusBadgeSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses badge tokens.</p>
      <StatusBadge status="ok" />
    </div>
  ),
};

export const StatusBadgeStates: Story = {
  render: () => (
    <div className="sb-row">
      <StatusBadge status="ok" />
      <StatusBadge status="degraded" />
    </div>
  ),
};

export const StatusBadgeWithLongText: Story = {
  args: { status: "degraded", label: "Degraded: high latency across regions" },
};

export const StatusBadgeAccessibility: Story = {
  render: () => (
    <div className="sb-row">
      <StatusBadge status="ok" aria-label="System healthy" />
      <StatusBadge status="down" aria-label="System down" />
    </div>
  ),
};

export const StatusBadgeDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { status: "ok" },
};

export const StatusBadgeEdgeCases = WithLongText;
