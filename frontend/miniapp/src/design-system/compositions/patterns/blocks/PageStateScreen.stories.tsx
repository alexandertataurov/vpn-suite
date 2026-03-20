import type { Meta, StoryObj } from "@storybook/react";
import { PageStateScreen } from "./PageStateScreen";
import { Button } from "@/design-system";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof PageStateScreen> = {
  title: "Patterns/PageStateScreen",
  tags: ["autodocs"],
  component: PageStateScreen,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Page-state shell for blocking auth and error screens. Variants: attention, blocked, info, and fatal.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Access blocked",
    chipText: "Authentication required",
    alertTitle: "Session expired",
    alertMessage: "Please sign in again to continue.",
    actions: <Button variant="primary">Sign in</Button>,
    variant: "blocked",
  },
  render: (args) => (
    <StoryShowcase>
      <PageStateScreen {...args} />
    </StoryShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Blocking page-state shell for auth and fatal conditions. Use it as the full-screen contract for states that must prevent the user from continuing.",
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Attention, blocked, info, and fatal states.">
      <StoryShowcase>
        <StoryStack>
          <PageStateScreen
            label="Attention"
            chipText="Check required"
            alertTitle="Action needed"
            alertMessage="Please complete the required steps."
            variant="attention"
          />
          <PageStateScreen
            label="Blocked"
            chipText="Access denied"
            alertTitle="Session expired"
            alertMessage="Sign in to continue."
            actions={<Button variant="primary">Sign in</Button>}
            variant="blocked"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Attention and blocked page-state variants shown together. Use it to review the full-screen treatment before wiring auth or fatal-error branches.",
      },
    },
  },
};
