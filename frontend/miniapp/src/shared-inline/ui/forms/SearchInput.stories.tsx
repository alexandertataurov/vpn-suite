import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "./SearchInput";

const meta: Meta<typeof SearchInput> = {
  title: "Components/SearchInput",
  component: SearchInput,
  parameters: {
    docs: {
      description: {
        component: "Input with search icon. Debounced onChange for filtering.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SearchInput>;

export const Overview: Story = {
  args: { placeholder: "Search..." },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <SearchInput placeholder="Search servers" />
      <SearchInput label="Search" placeholder="Type to search" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses input tokens.</p>
      <SearchInput placeholder="Search..." />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <SearchInput placeholder="Default" />
      <SearchInput placeholder="With error" error="Invalid query" />
      <SearchInput placeholder="Disabled" disabled />
    </div>
  ),
};

export const WithLongText: Story = {
  args: { placeholder: "Search servers across all regions and environments" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { placeholder: "Search..." },
};

export const Accessibility: Story = {
  args: { label: "Search servers", placeholder: "Type to search" },
};

export const EdgeCases = WithLongText;
