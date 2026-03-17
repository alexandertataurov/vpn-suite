import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { Button } from ".";
import { Inline } from "@/design-system/core/primitives";

const meta = {
  title: "Components/Button",
  tags: ["autodocs"],
  component: Button,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "outline", "danger", "link"] },
    size: { control: "select", options: ["sm", "md", "lg", "icon"] },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Button", variant: "primary" },
};

export const Variants: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="link">Link</Button>
    </Inline>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" iconOnly aria-label="Icon">
        ★
      </Button>
    </Inline>
  ),
};

export const Loading: Story = {
  args: { children: "Loading", loading: true, loadingText: "Loading…" },
};

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
};
