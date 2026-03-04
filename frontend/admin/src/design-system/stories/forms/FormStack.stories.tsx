import type { Meta, StoryObj } from "@storybook/react";
import { FormStack } from "@/design-system";
import { Input } from "@/design-system";

const meta: Meta<typeof FormStack> = {
  title: "UI/Components/Inputs/FormStack",
  component: FormStack,
  tags: ["smoke"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Vertical stack for form fields with consistent gap. Use for multi-field forms.",
          "## When to use",
          "Multi-field forms. Consistent vertical gap between controls.",
          "## When NOT to use",
          "Single field (no need for stack).",
          "## Anatomy",
          "Flex/grid column; children are form controls. Tokenized gap between items.",
          "## Variants",
          "Single layout; gap from tokens.",
          "## States",
          "Layout only; children carry their own state.",
          "## Behavior",
          "Layout only. No interaction.",
          "## Dos and Don'ts",
          "**Do:** Multiple inputs. **Don't:** Single field (no need).",
          "## Accessibility",
          "Layout only; each child keeps its own a11y.",
          "## Design tokens consumed",
          "Gap/spacing tokens.",
          "## Related components",
          "Field, Input, Form patterns.",
        ].join("\n\n"),
      },
      canvas: { sourceState: "shown" },
    },
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof FormStack>;

export const Default: Story = {
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Stack of two inputs with gap.",
          "**When you'd use this:** Any multi-field form. **Key props in use:** children. **What to watch:** Gap. **Real product example:** Server form, settings.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for FormStack. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** children. **What to watch:** N/A. **Real product example:** N/A.",
      },
    },
    padding: 32,
  },
};

export const AllVariants: Story = {
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
      <Input label="Org" placeholder="Organization" />
    </FormStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Multiple fields in stack.",
          "**When you'd use this:** 3+ fields. **Key props in use:** children. **What to watch:** Spacing. **Real product example:** Create server form.",
        ].join("\n\n"),
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <FormStack>
      <Input label="Default" placeholder="Enter text" />
      <Input label="Error" error="Invalid value" defaultValue="bad" />
      <Input label="Disabled" disabled defaultValue="Can't edit" />
    </FormStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Default, error, disabled in stack.",
          "**When you'd use this:** Mixed states. **Key props in use:** children. **What to watch:** Each field state. **Real product example:** Form with validation.",
        ].join("\n\n"),
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <FormStack>
      <Input label="Long label for the organization name in the primary region" placeholder="Long placeholder" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long labels in stack.",
          "**When you'd use this:** Verbose forms. **Key props in use:** children. **What to watch:** Wrap. **Real product example:** Org settings.",
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
          "**What this story shows:** FormStack in dark theme.",
          "**When you'd use this:** Dark UI. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark mode.",
        ].join("\n\n"),
      },
    },
  },
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
};

export const EdgeCases: Story = {
  render: () => (
    <FormStack>
      <Input label="Long label for the organization name in the primary region" placeholder="Long placeholder" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long label wrap in stack.",
          "**When you'd use this:** Edge copy. **Key props in use:** children. **What to watch:** No overflow. **Real product example:** N/A.",
        ].join("\n\n"),
      },
    },
  },
};

export const Accessibility: Story = {
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Fields retain their a11y.",
          "**When you'd use this:** A11y audit. **Key props in use:** children. **What to watch:** Tab order, labels. **Real product example:** Any form.",
        ].join("\n\n"),
      },
    },
  },
};
