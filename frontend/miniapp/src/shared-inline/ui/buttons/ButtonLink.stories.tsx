import type { Meta, StoryObj } from "@storybook/react";
import { ButtonLink } from "./ButtonLink";

const meta: Meta<typeof ButtonLink> = {
  title: "Shared/Components/ButtonLink",
  component: ButtonLink,
  parameters: {
    docs: {
      description: {
        component: "Link styled as button. Use for navigation (internal). Use Button for actions. Same variants as Button.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    kind: { control: "radio", options: ["default", "connect"] },
  },
};

export default meta;

type Story = StoryObj<typeof ButtonLink>;

export const ButtonLinkOverview: Story = {
  args: { to: "/", children: "Go home" },
};

export const ButtonLinkVariants: Story = {
  render: () => (
    <div className="sb-row">
      <ButtonLink to="/" variant="primary">Primary</ButtonLink>
      <ButtonLink to="/" variant="secondary">Secondary</ButtonLink>
      <ButtonLink to="/" variant="ghost">Ghost</ButtonLink>
      <ButtonLink to="/" variant="danger">Danger</ButtonLink>
    </div>
  ),
};

export const ButtonLinkSizes: Story = {
  render: () => (
    <div className="sb-row">
      <ButtonLink to="/" size="sm">Small</ButtonLink>
      <ButtonLink to="/" size="md">Medium</ButtonLink>
      <ButtonLink to="/" size="lg">Large</ButtonLink>
    </div>
  ),
};

export const ButtonLinkStates: Story = {
  render: () => (
    <div className="sb-stack">
      <ButtonLink to="/" variant="primary">Default</ButtonLink>
      <p className="m-0">Disabled state is not supported for links; use Button for disabled actions.</p>
    </div>
  ),
};

export const ButtonLinkWithLongText: Story = {
  args: { to: "/plans", variant: "primary", children: "Navigate to a long destination name that should wrap" },
};

export const ButtonLinkAccessibility: Story = {
  args: { to: "/", children: "Focus me (Tab)" },
};

export const ButtonLinkDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { to: "/", children: "Go home" },
};

export const ButtonLinkEdgeCases = WithLongText;
