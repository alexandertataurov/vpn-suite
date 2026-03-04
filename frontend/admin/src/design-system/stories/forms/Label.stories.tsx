import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "@/design-system";

const meta: Meta<typeof Label> = {
  title: "UI/Components/Misc/Label",
  component: Label,
  tags: ["smoke"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Form label for form controls. Use htmlFor to associate with control id. Optional required indicator.",
          "## When to use",
          "Every form field. Associate with control via htmlFor and control id.",
          "## When NOT to use",
          "Omitting htmlFor when the control has an id.",
          "## Anatomy",
          "Label text; optional asterisk for required.",
          "## Variants",
          "Default; required (shows indicator).",
          "## States",
          "Default, required.",
          "## Behavior",
          "Static. Clicking label focuses associated control when htmlFor/id match.",
          "## Dos and Don'ts",
          "**Do:** Use for every form field. **Don't:** Omit htmlFor when control has id.",
          "## Accessibility",
          "htmlFor + id on control. Required indicator visible.",
          "## Design tokens consumed",
          "Typography, color. Required indicator from tokens.",
          "## Related components",
          "Field, Input, Select, Checkbox.",
        ].join("\n\n"),
      },
      canvas: { sourceState: "shown" },
    },
    layout: "centered",
  },
  argTypes: {
    required: { description: "Show required indicator.", control: "boolean", table: { category: "State" } },
    htmlFor: { description: "ID of associated control.", control: "text", table: { category: "Form" } },
    children: { control: false, table: { category: "Content" } },
  },
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: { children: "Field label" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Standard label.",
          "**When you'd use this:** Any form field. **Key props in use:** children. **What to watch:** htmlFor when control has id. **Real product example:** Server name, region.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  args: { children: "Field label", required: false },
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for Label. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** children, required. **What to watch:** N/A. **Real product example:** N/A.",
      },
    },
    padding: 32,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Label>Default label</Label>
      <Label required>Required label</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Default and required.",
          "**When you'd use this:** Choosing indicator. **Key props in use:** required. **What to watch:** Asterisk. **Real product example:** Required vs optional fields.",
        ].join("\n\n"),
      },
    },
  },
};

export const InContext: Story = {
  args: { children: "Long label that should wrap across multiple lines without breaking layout" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long label wrapping.",
          "**When you'd use this:** Verbose field names. **Key props in use:** children. **What to watch:** Wrap. **Real product example:** Description labels.",
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
          "**What this story shows:** Label in dark theme.",
          "**When you'd use this:** Dark UI. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark mode.",
        ].join("\n\n"),
      },
    },
  },
  args: { children: "Field label" },
};

export const EdgeCases: Story = {
  args: { children: "Long label that should wrap across multiple lines without breaking layout" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long label stress.",
          "**When you'd use this:** Edge copy. **Key props in use:** children. **What to watch:** No overflow. **Real product example:** N/A.",
        ].join("\n\n"),
      },
    },
  },
};

export const Accessibility: Story = {
  args: { children: "Field label" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** htmlFor with control id.",
          "**When you'd use this:** A11y. **Key props in use:** htmlFor. **What to watch:** Focus on label click. **Real product example:** Any labeled control.",
        ].join("\n\n"),
      },
    },
  },
};
