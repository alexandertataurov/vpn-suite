import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Textarea } from "@/design-system";
import { StoryStack, NarrowFrame } from "@/design-system/storybook/wrappers";
import { storyText } from "@/design-system/storybook/fixtures";

const meta: Meta<typeof Textarea> = {
  title: "UI/Components/Inputs/Textarea",
  component: Textarea,
  tags: ["a11y", "interaction"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Multi-line text input for notes, descriptions, config. Use Input for single line. Rows and styling tokenized.",
          "## When to use",
          "Long text: notes, descriptions, config. Rows configurable.",
          "## When NOT to use",
          "Single line (use Input).",
          "## Anatomy",
          "Optional label, textarea (rows configurable), optional error.",
          "## Variants",
          "Default; error; disabled.",
          "## States",
          "Default, disabled, error.",
          "## Behavior",
          "Controlled/uncontrolled via value/onChange or defaultValue. Resize typically disabled for consistent layout.",
          "## Dos and Don'ts",
          "**Do:** Use for long text. **Don't:** Single line (use Input).",
          "## Accessibility",
          "Label; error linked; aria-describedby when needed.",
          "## Design tokens consumed",
          "Typography, border, spacing. rows for height.",
          "## Related components",
          "Input, Field, Label.",
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
    rows: { control: "number", table: { category: "Appearance" } },
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  tags: ["smoke"],
  args: { label: "Notes", placeholder: "Enter notes" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/notes/i);
    await userEvent.type(input, "Operational notes for core-edge-01");
    await expect(input).toHaveValue("Operational notes for core-edge-01");
  },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Textarea with label and placeholder.",
          "**When you'd use this:** Notes, description. **Key props in use:** label, placeholder, rows. **What to watch:** rows. **Real product example:** Server notes, config.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  args: { label: "Notes", placeholder: "Enter notes" },
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for Textarea. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** label, placeholder, error, rows. **What to watch:** N/A. **Real product example:** N/A.",
      },
    },
    padding: 32,
  },
};

export const AllVariants: Story = {
  render: () => (
    <StoryStack>
      <Textarea label="Default" placeholder="Default" />
      <Textarea label="Error" placeholder="Error" error="Required" />
    </StoryStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Default and error.",
          "**When you'd use this:** Validation. **Key props in use:** error. **What to watch:** Error styling. **Real product example:** Required notes.",
        ].join("\n\n"),
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <StoryStack>
      <Textarea label="Rows 3" rows={3} placeholder="3 rows" />
      <Textarea label="Rows 6" rows={6} placeholder="6 rows" />
    </StoryStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** rows 3 vs 6.",
          "**When you'd use this:** Height choice. **Key props in use:** rows. **What to watch:** Layout. **Real product example:** Short vs long notes.",
        ].join("\n\n"),
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <StoryStack>
      <Textarea label="Default" placeholder="Default" />
      <Textarea label="Disabled" placeholder="Disabled" disabled />
      <Textarea label="Error" placeholder="Error" error="Validation failed" />
    </StoryStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Default, disabled, error.",
          "**When you'd use this:** State reference. **Key props in use:** disabled, error. **What to watch:** Disabled styling. **Real product example:** Read-only or invalid.",
        ].join("\n\n"),
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <StoryStack>
      <Textarea label="Long label" placeholder={storyText.veryLong} rows={3} />
      <NarrowFrame>
        <Textarea label="Narrow" placeholder={storyText.longLabel} rows={3} />
      </NarrowFrame>
    </StoryStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long text and narrow frame.",
          "**When you'd use this:** Responsive/side panel. **Key props in use:** label, placeholder. **What to watch:** Wrap. **Real product example:** Drawer config.",
        ].join("\n\n"),
      },
    },
  },
};

export const EdgeCases: Story = {
  render: () => (
    <StoryStack>
      <Textarea label="Long label" placeholder={storyText.veryLong} rows={3} />
      <NarrowFrame>
        <Textarea label="Narrow" placeholder={storyText.longLabel} rows={3} />
      </NarrowFrame>
      <Textarea label="Empty" value="" rows={3} />
    </StoryStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long text, narrow, empty value.",
          "**When you'd use this:** Edge copy. **Key props in use:** value. **What to watch:** Empty state. **Real product example:** N/A.",
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
          "**What this story shows:** Textarea in dark theme.",
          "**When you'd use this:** Dark UI. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark mode.",
        ].join("\n\n"),
      },
    },
  },
  args: { label: "Notes", placeholder: "Enter notes" },
};

export const Accessibility: Story = {
  args: { label: "Accessible notes", placeholder: "Tab to focus" },
  parameters: {
    a11y: { element: "#storybook-root" },
    docs: {
      description: {
        story: [
          "**What this story shows:** Label and error for screen readers.",
          "**When you'd use this:** A11y audit. **Key props in use:** label. **What to watch:** Focus, aria. **Real product example:** Any textarea.",
        ].join("\n\n"),
      },
    },
  },
};
