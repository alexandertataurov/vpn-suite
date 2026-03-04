import type { Meta, StoryObj } from "@storybook/react";
import { InlineError } from "@/design-system";

const meta: Meta<typeof InlineError> = {
  title: "UI/Components/Misc/InlineError",
  component: InlineError,
  tags: ["smoke"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Inline error message for form validation. Renders below control. Use for field-level errors.",
          "## When to use",
          "Field-level validation errors below the control.",
          "## When NOT to use",
          "Page- or section-level errors (use ErrorState/PageError).",
          "## Anatomy",
          "Single message line. Caption typography, error color.",
          "## Variants",
          "Single variant (error).",
          "## States",
          "Display only when error present.",
          "## Behavior",
          "Display only. Parent links via aria-describedby.",
          "## Dos and Don'ts",
          "**Do:** Validation below control. **Don't:** Page-level (use ErrorState/PageError).",
          "## Accessibility",
          "aria-describedby from field.",
          "## Design tokens consumed",
          "Caption, error color.",
          "## Related components",
          "Field, HelperText, ErrorState.",
        ].join("\n\n"),
      },
      canvas: { sourceState: "shown" },
    },
    layout: "centered",
  },
  argTypes: { message: { table: { category: "Content" } } },
};

export default meta;

type Story = StoryObj<typeof InlineError>;

export const Default: Story = {
  args: { message: "This field is required" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Inline error under control.",
          "**When you'd use this:** Validation. **Key props in use:** message. **What to watch:** aria-describedby. **Real product example:** Required field.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  args: { message: "This field is required" },
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for InlineError. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** message. **What to watch:** N/A. **Real product example:** N/A.",
      },
    },
    padding: 32,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <InlineError message="This field is required" />
      <InlineError message="Email must be valid" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Different messages.",
          "**When you'd use this:** Validation copy. **Key props in use:** message. **What to watch:** Consistency. **Real product example:** Required vs format.",
        ].join("\n\n"),
      },
    },
  },
};

export const InContext: Story = {
  args: { message: "Long error message that should wrap without breaking layout or overlapping form controls." },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long message wrap.",
          "**When you'd use this:** Detailed validation. **Key props in use:** message. **What to watch:** Wrap. **Real product example:** API error copy.",
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
          "**What this story shows:** InlineError in dark theme.",
          "**When you'd use this:** Dark UI. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark mode.",
        ].join("\n\n"),
      },
    },
  },
  args: { message: "This field is required" },
};

export const EdgeCases: Story = {
  args: { message: "Long error message that should wrap without breaking layout or overlapping form controls." },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long message stress.",
          "**When you'd use this:** Edge copy. **Key props in use:** message. **What to watch:** No overlap. **Real product example:** N/A.",
        ].join("\n\n"),
      },
    },
  },
};

export const Accessibility: Story = {
  args: { message: "Error announced to screen readers" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** aria-describedby from field.",
          "**When you'd use this:** A11y audit. **Key props in use:** message. **What to watch:** Announce. **Real product example:** Any inline error.",
        ].join("\n\n"),
      },
    },
  },
};
