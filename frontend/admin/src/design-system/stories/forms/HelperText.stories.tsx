import type { Meta, StoryObj } from "@storybook/react";
import { HelperText } from "@/design-system";

const meta: Meta<typeof HelperText> = {
  title: "UI/Components/Misc/HelperText",
  component: HelperText,
  tags: ["smoke"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Hint or error text for form fields. Renders below controls. Link via aria-describedby.",
          "## When to use",
          "Hint or error text below form controls. Wire via aria-describedby.",
          "## When NOT to use",
          "Page-level errors (use PageError/ErrorState).",
          "## Anatomy",
          "Single line or wrapped text. variant: hint (muted) or error (alert).",
          "## Variants",
          "hint, error.",
          "## States",
          "Static text; no interactive state.",
          "## Behavior",
          "Display only. Parent field wires aria-describedby to control id.",
          "## Dos and Don'ts",
          "**Do:** Use below controls. **Don't:** Use for page-level errors (use PageError/ErrorState).",
          "## Accessibility",
          "aria-describedby from field wrapper.",
          "## Design tokens consumed",
          "Caption/typography, color (hint vs error).",
          "## Related components",
          "Field, InlineError, Label.",
        ].join("\n\n"),
      },
      canvas: { sourceState: "shown" },
    },
    layout: "centered",
  },
  argTypes: {
    variant: { control: "select", options: ["hint", "error"], table: { category: "Appearance" } },
    children: { control: false, table: { category: "Content" } },
  },
};

export default meta;

type Story = StoryObj<typeof HelperText>;

export const Default: Story = {
  args: { variant: "hint", children: "Optional hint" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Hint variant.",
          "**When you'd use this:** Below any control. **Key props in use:** variant, children. **What to watch:** aria-describedby. **Real product example:** Input hint.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  args: { variant: "hint", children: "Optional hint" },
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for HelperText. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** variant, children. **What to watch:** N/A. **Real product example:** N/A.",
      },
    },
    padding: 32,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <HelperText variant="hint">Optional hint</HelperText>
      <HelperText variant="error">Error message</HelperText>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** hint and error.",
          "**When you'd use this:** Choosing variant. **Key props in use:** variant. **What to watch:** Color. **Real product example:** Hint vs validation error.",
        ].join("\n\n"),
      },
    },
  },
};

export const InContext: Story = {
  args: { variant: "hint", children: "Long helper text that should wrap across multiple lines without breaking layout." },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long text wrap.",
          "**When you'd use this:** Verbose hint. **Key props in use:** children. **What to watch:** Wrap. **Real product example:** Config description.",
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
          "**What this story shows:** HelperText in dark theme.",
          "**When you'd use this:** Dark UI. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark mode.",
        ].join("\n\n"),
      },
    },
  },
  args: { variant: "hint", children: "Optional hint" },
};

export const EdgeCases: Story = {
  args: { variant: "hint", children: "Long helper text that should wrap across multiple lines without breaking layout." },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long text stress.",
          "**When you'd use this:** Edge copy. **Key props in use:** children. **What to watch:** No overflow. **Real product example:** N/A.",
        ].join("\n\n"),
      },
    },
  },
};

export const Accessibility: Story = {
  args: { variant: "error", children: "Error message announced by screen readers" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Link via aria-describedby.",
          "**When you'd use this:** A11y audit. **Key props in use:** variant. **What to watch:** Screen reader. **Real product example:** Any field error.",
        ].join("\n\n"),
      },
    },
  },
};
