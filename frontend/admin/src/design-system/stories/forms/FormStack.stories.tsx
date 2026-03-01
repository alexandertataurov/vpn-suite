import type { Meta, StoryObj } from "@storybook/react";
import { FormStack } from "@/design-system";
import { Input } from "@/design-system";

const meta: Meta<typeof FormStack> = {
  title: "Primitives/Forms/FormStack",
  component: FormStack,
  parameters: {
    docs: {
      description: {
        component: "Vertical stack for form fields. Consistent gap between inputs.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormStack>;

export const Overview: Story = {
  args: {
    children: (
      <>
        <Input label="Name" placeholder="Your name" />
        <Input label="Email" placeholder="you@example.com" type="email" />
      </>
    ),
  },
};

export const Variants: Story = {
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
      <Input label="Org" placeholder="Organization" />
    </FormStack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized gaps.</p>
      <FormStack>
        <Input label="Name" placeholder="Your name" />
        <Input label="Email" placeholder="you@example.com" type="email" />
      </FormStack>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <FormStack>
      <Input label="Default" placeholder="Enter text" />
      <Input label="Error" error="Invalid value" defaultValue="bad" />
      <Input label="Disabled" disabled defaultValue="Can't edit" />
    </FormStack>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <FormStack>
      <Input label="Long label for the organization name in the primary region" placeholder="Long placeholder" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
};

export const EdgeCases = WithLongText;
