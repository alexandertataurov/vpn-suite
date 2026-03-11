import type { Meta, StoryObj } from "@storybook/react";
import { Field } from "../components/forms/Field";
import { Input } from "../components/forms/Input";
import { Select } from "../components/forms/Select";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Primitives/Field",
  tags: ["autodocs"],
  component: Field,
  parameters: {
    docs: {
      description: {
        component: "Field composes Label + input slot + HelperText for description or errors. Use with Input, Select, or custom controls.",
      },
    },
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryPage
      eyebrow="Components"
      title="Field"
      summary="Field is the form composition shell for label, control, description, and error states. It is the structural contract behind the form components."
      stats={[
        { label: "Roles", value: "label/slot/help" },
        { label: "States", value: "description + error" },
        { label: "Examples", value: "4" },
      ]}
    >
      <StorySection
        title="Field composition"
        description="Field should be the one place where label and helper semantics are assembled, regardless of the specific control."
      >
        <ThreeColumn>
          <StoryCard title="Description state" caption="Description is visible only when there is no error.">
            <Field label="Email" description="We will only use this for account recovery.">
              <Input type="email" placeholder="you@example.com" aria-invalid={false} />
            </Field>
          </StoryCard>
          <StoryCard title="Error state" caption="Error replaces the hint and is announced as an alert.">
            <Field label="Username" error="Username is required">
              <Input type="text" placeholder="username" aria-invalid />
            </Field>
          </StoryCard>
          <StoryCard title="Custom slot" caption="Field stays generic enough to host any control.">
            <Field label="Server" description="Pick a preferred location.">
              <Select
                value="auto"
                onChange={() => {}}
                options={[
                  { value: "auto", label: "Fastest available" },
                  { value: "nl", label: "Amsterdam, NL" },
                ]}
              />
            </Field>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp showcase"
        description="The field contract matters most in onboarding and settings, where dense forms still need stable semantics."
      >
        <UsageExample title="Profile settings" description="A settings stack should feel consistent regardless of whether the row contains text input, select, or validation.">
          <Stack gap="3">
            <Field label="Device name" description="Shown only inside your miniapp.">
              <Input placeholder="MacBook Air" />
            </Field>
            <Field label="Environment" error="Environment is required">
              <Input placeholder="Production" />
            </Field>
          </Stack>
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Field label="Email" description="We will only use this for account recovery.">
      <Input type="email" placeholder="you@example.com" aria-invalid={false} />
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field label="Username" error="Username is required">
      <Input type="text" placeholder="username" aria-invalid />
    </Field>
  ),
};

export const WithCustomSlot: Story = {
  render: () => (
    <Field label="Server" description="Pick a preferred location.">
      <Select
        value="auto"
        onChange={() => {}}
        options={[
          { value: "auto", label: "Fastest available" },
          { value: "nl", label: "Amsterdam, NL" },
        ]}
      />
    </Field>
  ),
};

export const MixedFields: Story = {
  render: () => (
    <Stack gap="3">
      <Field label="Device name" description="Shown only inside your miniapp.">
        <Input placeholder="MacBook Air" />
      </Field>
      <Field label="Environment" error="Environment is required">
        <Input placeholder="Production" />
      </Field>
    </Stack>
  ),
};
