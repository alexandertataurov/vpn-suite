import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "@/design-system";

const meta: Meta<typeof Divider> = {
  title: "Primitives/Divider",
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

export const Overview: Story = {
  render: () => (
    <div className="sb-stack">
      <Divider />
      <Divider />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Divider tone="subtle" />
      <Divider tone="default" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses border-width tokens.</p>
      <Divider />
    </div>
  ),
};

export const States: Story = {
  render: () => <Divider />,
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Section title with long description that should wrap above divider.</p>
      <Divider />
    </div>
  ),
};

export const Orientation: Story = {
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

export const Accessibility: Story = {
  render: () => <Divider aria-label="Section divider" />,
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <Divider />,
};

export const EdgeCases = WithLongText;
