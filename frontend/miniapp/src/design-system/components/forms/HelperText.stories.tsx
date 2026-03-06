import type { Meta, StoryObj } from "@storybook/react";
import { HelperText } from "./HelperText";

const meta: Meta<typeof HelperText> = {
  title: "Shared/Primitives/Forms/HelperText",
  component: HelperText,
  parameters: {
    docs: {
      description: {
        component: "Hint text for form fields. Variant: default|error.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HelperText>;

export const HelperTextOverview: Story = { args: { variant: "hint", children: "Optional hint" } };

export const HelperTextVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <HelperText variant="hint">Optional hint</HelperText>
      <HelperText variant="error">Error message</HelperText>
    </div>
  ),
};

export const HelperTextSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses caption tokens.</p>
      <HelperText variant="hint">Hint text</HelperText>
    </div>
  ),
};

export const HelperTextStates: Story = {
  render: () => (
    <div className="sb-stack">
      <HelperText variant="hint">Hint</HelperText>
      <HelperText variant="error">Error</HelperText>
    </div>
  ),
};

export const HelperTextWithLongText: Story = {
  args: { variant: "hint", children: "Long helper text that should wrap across multiple lines without breaking layout." },
};

export const HelperTextDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { variant: "hint", children: "Optional hint" },
};

export const HelperTextAccessibility: Story = {
  args: { variant: "error", children: "Error message announced by screen readers" },
};

export const HelperTextEdgeCases = HelperTextWithLongText;
