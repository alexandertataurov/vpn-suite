import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `Canonical button for actions. Use ButtonLink for navigation.

**Purpose:** Primary actions, secondary actions, destructive actions, links. Don't use for navigation (use ButtonLink).

**Variants:** primary, secondary, ghost, outline, danger, link. **Sizes:** sm, md, lg, icon.

**States:** Hover, focus-visible, active, disabled, loading (aria-busy).

**Accessibility:** Icon-only requires aria-label. Loading shows spinner + disables.

**Do:** Use primary for main CTA. Use danger for destructive. **Don't:** Nest buttons; use raw hex.`,
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "outline", "danger", "link"],
    },
    size: { control: "select", options: ["sm", "md", "lg", "icon"] },
    kind: { control: "radio", options: ["default", "connect"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Overview: Story = {
  args: { children: "Primary action", variant: "primary" },
};

/** All variants at md size */
export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

/** All sizes */
export const Sizes: Story = {
  render: () => (
    <div className="sb-row">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Copy">
        <span aria-hidden>📋</span>
      </Button>
    </div>
  ),
};

/** Connect kind = primary CTA, size lg, min 44px */
export const Connect: Story = {
  args: { children: "Add device", kind: "connect" },
};

/** Icon before and after text */
export const WithIcons: Story = {
  render: () => (
    <div className="sb-row">
      <Button startIcon={<span aria-hidden>→</span>}>Next</Button>
      <Button variant="secondary" endIcon={<span aria-hidden>📋</span>}>
        Copy
      </Button>
    </div>
  ),
};

export const WithLongText: Story = {
  args: { children: "Primary action with a long label that should stay readable" },
};

/** Icon-only buttons require aria-label */
export const IconOnly: Story = {
  render: () => (
    <div className="sb-row sb-row-tight">
      <Button size="icon" variant="ghost" aria-label="Copy">
        <span aria-hidden>📋</span>
      </Button>
      <Button size="icon" variant="ghost" aria-label="Delete">
        <span aria-hidden>🗑</span>
      </Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-row">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { children: "Save", loading: true },
};

export const LoadingWithText: Story = {
  args: { children: "Save", loading: true, loadingText: "Saving..." },
};

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
};

export const FullWidth: Story = {
  args: { children: "Full width", fullWidth: true },
};

/** Danger confirmation pattern */
export const DangerConfirmation: Story = {
  render: () => (
    <div className="sb-row">
      <Button variant="ghost">Cancel</Button>
      <Button variant="danger">Delete server</Button>
    </div>
  ),
};

/** Accessibility: focus ring, aria-label on icon-only */
export const Accessibility: Story = {
  render: () => (
    <div className="sb-row">
      <Button>Focus me (Tab)</Button>
      <Button size="icon" variant="ghost" aria-label="Copy">
        <span aria-hidden>📋</span>
      </Button>
      <Button loading aria-busy>Loading (aria-busy)</Button>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { children: "Primary action", variant: "primary" },
};

/** Playground: full controls */
export const Playground: Story = {
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
    kind: "default",
    loading: false,
    disabled: false,
    fullWidth: false,
  },
};

export const EdgeCases = WithLongText;
