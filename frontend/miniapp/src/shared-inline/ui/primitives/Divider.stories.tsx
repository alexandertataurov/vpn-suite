import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "./Divider";

const meta: Meta<typeof Divider> = {
  title: "Shared/Primitives/Divider",
  component: Divider,
  parameters: {
    docs: {
      description: {
        component: `Directional separator for content groups.

**Use:** Separate sections or items. **Avoid:** Overuse as decoration.

**Tokens:** --color-border-subtle, --border-width-hairline.
**Accessibility:** Uses role=separator and orientation.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const DividerOverview: Story = {
  render: () => (
    <div className="sb-stack">
      <Divider />
      <Divider />
    </div>
  ),
};

export const DividerVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Divider tone="subtle" />
      <Divider tone="default" />
    </div>
  ),
};

export const DividerSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses border-width tokens.</p>
      <Divider />
    </div>
  ),
};

export const DividerStates: Story = {
  render: () => <Divider />,
};

export const DividerWithLongText: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Section title with long description that should wrap above divider.</p>
      <Divider />
    </div>
  ),
};

export const DividerOrientation: Story = {
  render: () => (
    <div className="sb-row">
      <div className="sb-card">
        <div className="sb-row">
          <span>A</span>
          <Divider orientation="vertical" />
          <span>B</span>
        </div>
      </div>
      <div className="sb-card w-full">
        <Divider orientation="horizontal" />
      </div>
    </div>
  ),
};

export const DividerAccessibility: Story = {
  render: () => <Divider aria-label="Section divider" />,
};

export const DividerDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <Divider />,
};

export const DividerEdgeCases = WithLongText;
