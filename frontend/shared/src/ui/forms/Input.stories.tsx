import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Primitives/Input",
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          "Single-line text input. Purpose: Form fields. Don't use for multi-line. States: Default, focus, disabled, error. Accessibility: Use label; error via aria-describedby. Do: Use semantic type (email, password). Don't: Omit label.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Overview: Story = {
  args: { label: "Email", placeholder: "you@example.com" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Input label="Text" placeholder="Enter text" />
      <Input label="Email" type="email" placeholder="you@example.com" />
      <Input label="Password" type="password" placeholder="••••••••" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; use tokens for density in layout.</p>
      <Input label="Email" placeholder="you@example.com" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <Input label="Default" placeholder="Enter text" />
      <Input label="With error" error="Invalid email" defaultValue="bad" />
      <Input label="Disabled" disabled defaultValue="Can't edit" />
    </div>
  ),
};

export const WithLongText: Story = {
  args: { label: "Long label that should wrap gracefully on small screens", placeholder: "Long placeholder content" },
};

/** Accessibility: label, error announcement */
export const Accessibility: Story = {
  render: () => (
    <div className="sb-stack">
      <Input label="Labeled input" placeholder="Tab to focus" />
      <Input label="With error" error="Required field" defaultValue="invalid" />
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { label: "Email", placeholder: "you@example.com" },
};

/** Playground: full controls */
export const Playground: Story = {
  args: {
    label: "Label",
    placeholder: "Enter text",
    error: "",
    disabled: false,
  },
};

export const EdgeCases = WithLongText;
