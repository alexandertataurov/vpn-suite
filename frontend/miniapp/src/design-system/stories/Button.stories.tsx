import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../components/buttons/Button";

const meta = {
  title: "Design System/Components/Button",
  tags: ["autodocs"],
  component: Button,
  parameters: {
    docs: {
      description: { component: "Button with variant, size, tone, loading. Use Mission* in patterns for primary/secondary CTAs." },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "outline", "danger", "link"] },
    size: { control: "select", options: ["sm", "md", "lg", "icon"] },
    tone: { control: "select", options: ["default", "warning", "danger"] },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: "Primary", variant: "primary" },
};

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Button tone="default">Default</Button>
      <Button tone="warning">Warning</Button>
      <Button tone="danger">Danger</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { children: "Loading", loading: true },
};
