import type { Meta, StoryObj } from "@storybook/react";
import { InlineAlert } from "./InlineAlert";
import { Button, Input } from "@/design-system";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta = {
  title: "Components/InlineAlert",
  tags: ["autodocs"],
  component: InlineAlert,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Inline feedback banner. Variants: info, warning, error, success. Uses semantic color tokens.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["info", "warning", "error", "success"] },
  },
} satisfies Meta<typeof InlineAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "info", title: "Info", message: "Your connection is secure." },
  render: (args) => (
    <StoryShowcase>
      <InlineAlert {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="info, warning, error, success.">
      <StoryShowcase>
        <StoryStack>
          <InlineAlert variant="info" title="Info" message="Your connection is secure." />
          <InlineAlert variant="warning" title="Warning" message="Your connection may be unstable." />
          <InlineAlert variant="error" title="Error" message="Connection failed. Please try again." />
          <InlineAlert variant="success" title="Success" message="Connected successfully." />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const WithActions: Story = {
  render: () => (
    <StorySection title="With actions" description="CTA button for user response.">
      <StoryShowcase>
        <InlineAlert
          variant="warning"
          title="Action required"
          message="Please review your settings to continue."
          actions={<Button size="sm">Review</Button>}
        />
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Above form with input.">
      <StoryShowcase>
        <StoryStack>
          <InlineAlert
            variant="warning"
            title="Session expiring"
            message="Please save your changes before continuing."
          />
          <Input label="Email" placeholder="you@example.com" type="email" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
