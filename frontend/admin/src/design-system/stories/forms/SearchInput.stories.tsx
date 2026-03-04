import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { SearchInput } from "@/design-system";

const meta: Meta<typeof SearchInput> = {
  title: "UI/Components/Inputs/SearchInput",
  component: SearchInput,
  tags: ["a11y", "interaction"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Input with search icon; debounced onChange. Use for filter tables and search.",
          "## When to use",
          "Filter tables, search. When user types to filter or search.",
          "## When NOT to use",
          "Plain text input without search (use Input).",
          "## Anatomy",
          "Search icon, input, optional label and error. Debounced onChange.",
          "## Accessibility",
          "Label and error; same as Input.",
          "## Design tokens consumed",
          "Input tokens.",
        ].join("\n\n"),
      },
      canvas: { sourceState: "shown" },
    },
    layout: "centered",
  },
  argTypes: {
    label: { control: false, table: { category: "Content" } },
    placeholder: { control: "text", table: { category: "Content" } },
    error: { control: "text", table: { category: "State" } },
    disabled: { control: "boolean", table: { category: "State" } },
  },
};

export default meta;

type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {
  tags: ["smoke"],
  args: { placeholder: "Search..." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox");
    await userEvent.type(input, "core-edge");
    await expect(input).toHaveValue("core-edge");
  },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Search input with placeholder.",
          "**When you'd use this:** Table filter, search. **Key props in use:** placeholder. **What to watch:** Debounce. **Real product example:** Server search.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  args: { placeholder: "Search..." },
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for SearchInput. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** label, placeholder, error, disabled. **What to watch:** N/A. **Real product example:** N/A.",
      },
    },
    padding: 32,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <SearchInput placeholder="Search servers" />
      <SearchInput label="Search" placeholder="Type to search" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Without/with label.",
          "**When you'd use this:** Form vs toolbar. **Key props in use:** label. **What to watch:** Icon. **Real product example:** Toolbar vs filter form.",
        ].join("\n\n"),
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="sb-stack">
      <SearchInput placeholder="Default" />
      <SearchInput placeholder="With error" error="Invalid query" />
      <SearchInput placeholder="Disabled" disabled />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Default, error, disabled.",
          "**When you'd use this:** Validation. **Key props in use:** error, disabled. **What to watch:** Error message. **Real product example:** Invalid query.",
        ].join("\n\n"),
      },
    },
  },
};

export const InContext: Story = {
  args: { placeholder: "Search servers across all regions and environments" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long placeholder.",
          "**When you'd use this:** Server/search UX. **Key props in use:** placeholder. **What to watch:** Wrap. **Real product example:** Server list filter.",
        ].join("\n\n"),
      },
    },
  },
};

export const DarkModeVariant: Story = {
  parameters: {
    themes: { themeOverride: "dark" },
    docs: {
      description: {
        story: [
          "**What this story shows:** SearchInput in dark theme.",
          "**When you'd use this:** Dark UI. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark mode.",
        ].join("\n\n"),
      },
    },
  },
  args: { placeholder: "Search..." },
};

export const EdgeCases: Story = {
  args: { placeholder: "Search servers across all regions and environments" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long placeholder wrap.",
          "**When you'd use this:** Edge copy. **Key props in use:** placeholder. **What to watch:** No overflow. **Real product example:** N/A.",
        ].join("\n\n"),
      },
    },
  },
};

export const Accessibility: Story = {
  args: { label: "Search servers", placeholder: "Type to search" },
  parameters: {
    a11y: { element: "#storybook-root" },
    docs: {
      description: {
        story: [
          "**What this story shows:** Label for screen readers.",
          "**When you'd use this:** A11y audit. **Key props in use:** label. **What to watch:** Announce. **Real product example:** Any search.",
        ].join("\n\n"),
      },
    },
  },
};
