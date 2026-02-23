import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "./Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "Components/Breadcrumbs",
  component: Breadcrumb,
  parameters: {
    docs: {
      description: {
        component: "Navigation breadcrumb. Items with optional links.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Overview: Story = {
  args: {
    items: [
      { label: "Servers", to: "/servers" },
      { label: "Server 1", to: "/servers/1" },
      { label: "Details" },
    ],
  },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Servers", to: "/servers" }, { label: "Details" }]} />
      <Breadcrumb items={[{ label: "Home" }, { label: "Section" }, { label: "Page" }]} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized type.</p>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Servers" }]} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Servers", to: "/servers" }, { label: "Details" }]} />
  ),
};

export const WithLongText: Story = {
  args: {
    items: [
      { label: "Servers", to: "/servers" },
      { label: "Server with a very long name that should wrap", to: "/servers/1" },
      { label: "Details" },
    ],
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: {
    items: [
      { label: "Servers", to: "/servers" },
      { label: "Server 1", to: "/servers/1" },
      { label: "Details" },
    ],
  },
};

export const Accessibility: Story = {
  args: {
    items: [
      { label: "Servers", to: "/servers" },
      { label: "Server 1", to: "/servers/1" },
      { label: "Details" },
    ],
  },
};

export const EdgeCases = WithLongText;
