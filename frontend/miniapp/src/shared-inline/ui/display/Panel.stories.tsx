import type { Meta, StoryObj } from "@storybook/react";
import { Panel, PanelHeader, PanelBody } from "./Panel";
import { Button } from "../buttons/Button";

const meta: Meta<typeof Panel> = {
  title: "Shared/Primitives/Panel",
  component: Panel,
  parameters: {
    docs: {
      description: {
        component: `Surface container for grouping content.

**Use:** Group related controls, tables, and summaries.
**Avoid:** Single-line content; prefer Inline or Text.

**Tokens:** --color-surface, --color-border-subtle, --radius-lg, --spacing-6.
**Accessibility:** Use semantic elements (section, region) + aria-label when needed.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Panel>;

export const PanelOverview: Story = {
  render: () => (
    <Panel>
      <PanelHeader title="Panel title" actions={<Button variant="ghost" size="sm">Action</Button>} />
      <PanelBody>Primary content goes here.</PanelBody>
    </Panel>
  ),
};

export const PanelVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Panel variant="surface">
        <PanelBody>Surface</PanelBody>
      </Panel>
      <Panel variant="outline">
        <PanelBody>Outline</PanelBody>
      </Panel>
      <Panel variant="raised">
        <PanelBody>Raised</PanelBody>
      </Panel>
      <Panel variant="glass">
        <PanelBody>Glass</PanelBody>
      </Panel>
    </div>
  ),
};

export const PanelSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <Panel>
        <PanelBody>Default padding</PanelBody>
      </Panel>
      <Panel variant="outline">
        <PanelBody>Outline padding</PanelBody>
      </Panel>
    </div>
  ),
};

export const PanelStates: Story = {
  render: () => (
    <Panel>
      <PanelHeader title="Panel title" actions={<Button variant="ghost" size="sm">Action</Button>} />
      <PanelBody>Default state</PanelBody>
    </Panel>
  ),
};

export const PanelWithLongText: Story = {
  render: () => (
    <Panel>
      <PanelHeader title="Panel title" />
      <PanelBody>
        This panel contains a very long paragraph intended to test wrapping and vertical rhythm. It should remain readable and aligned with the spacing tokens.
      </PanelBody>
    </Panel>
  ),
};

export const PanelDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <Panel>
      <PanelHeader title="Panel title" />
      <PanelBody>Dark theme rendering.</PanelBody>
    </Panel>
  ),
};

export const PanelAccessibility: Story = {
  render: () => (
    <Panel as="section" aria-label="Server details">
      <PanelHeader title="Server details" />
      <PanelBody>Use aria-label when the section needs a label.</PanelBody>
    </Panel>
  ),
};

export const PanelEdgeCases = WithLongText;
