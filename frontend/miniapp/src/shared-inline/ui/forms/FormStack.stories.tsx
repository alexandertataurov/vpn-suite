import type { Meta, StoryObj } from "@storybook/react";
import { FormStack } from "./FormStack";
import { Input } from "./Input";

const meta: Meta<typeof FormStack> = {
  title: "Shared/Primitives/Forms/FormStack",
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

export const FormStackOverview: Story = {
  args: {
    children: (
      <>
        <Input label="Name" placeholder="Your name" />
        <Input label="Email" placeholder="you@example.com" type="email" />
      </>
    ),
  },
};

export const FormStackVariants: Story = {
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
      <Input label="Org" placeholder="Organization" />
    </FormStack>
  ),
};

export const FormStackSizes: Story = {
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

export const FormStackStates: Story = {
  render: () => (
    <FormStack>
      <Input label="Default" placeholder="Enter text" />
      <Input label="Error" error="Invalid value" defaultValue="bad" />
      <Input label="Disabled" disabled defaultValue="Can't edit" />
    </FormStack>
  ),
};

export const FormStackWithLongText: Story = {
  render: () => (
    <FormStack>
      <Input label="Long label for the organization name in the primary region" placeholder="Long placeholder" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
};

export const FormStackDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
};

export const FormStackAccessibility: Story = {
  render: () => (
    <FormStack>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" placeholder="you@example.com" type="email" />
    </FormStack>
  ),
};

export const FormStackEdgeCases = WithLongText;
