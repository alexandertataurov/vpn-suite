import type { Meta, StoryObj } from "@storybook/react";
import { InlineAlert } from "./InlineAlert";
import {
  StorySection,
  StoryShowcase,
  StoryStack,
} from "@/design-system";
import { ListCard, ListRow } from "@/design-system";
import { IconMonitor } from "@/design-system/icons";

function ThemePane({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
}) {
  return (
    <div data-theme={theme} className="story-theme-pane inline-alert-story-frame">
      <p className="story-theme-pane-label">{theme}</p>
      {children}
    </div>
  );
}

function WithThemes({ children }: { children: React.ReactNode }) {
  return (
    <div className="story-themes-row">
      <ThemePane theme="dark">{children}</ThemePane>
      <ThemePane theme="light">{children}</ThemePane>
    </div>
  );
}

const meta = {
  title: "Components/InlineAlert",
  tags: ["autodocs"],
  component: InlineAlert,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Inline feedback banner for the miniapp. Use it for compact states that need immediate attention without interrupting the flow. Variants: info, warning, error, success.",
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
  args: {
    variant: "info",
    label: "Info",
    message: "Your connection is secure.",
  },
};

const variantsContent = (
  <StoryStack className="story-stack story-stack--tight">
    <InlineAlert
      variant="info"
      label="Info"
      message="Your connection is secure."
    />
    <InlineAlert
      variant="warning"
      label="Warning"
      message="Your connection may be unstable."
    />
    <InlineAlert
      variant="error"
      label="Error"
      message="Connection failed. Please try again."
    />
    <InlineAlert
      variant="success"
      label="Success"
      message="Connected successfully."
    />
  </StoryStack>
);

export const Variants: Story = {
  name: "Variants",
  parameters: {
    docs: {
      description: {
        story:
          "Four semantic variants. Background, border, label, and dot color all adapt. Left accent strip provides instant peripheral recognition.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Variants"
      description="Four semantic variants. Background, border, label, and dot color all adapt through tokens."
    >
      <StoryShowcase>
        <WithThemes>{variantsContent}</WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Advanced: Story = {
  name: "Advanced",
  parameters: {
    docs: {
      description: {
        story:
          "Action, compact, dismissible, unlabeled, multi-line, and icon-mode alert permutations in one matrix.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Advanced"
      description="Action, compact, dismissible, unlabeled, multi-line, and icon-mode states."
    >
      <StoryShowcase>
        <WithThemes>
          <StoryStack className="story-stack story-stack--tight">
            <InlineAlert
              variant="warning"
              label="Action required"
              message="Please review your settings to continue."
              action={{ label: "Review settings", onClick: () => {} }}
            />
            <InlineAlert
              variant="info"
              label="No expired subscription"
              message="Your subscription is active. If you need help, contact support."
              compact={true}
            />
            <InlineAlert
              variant="info"
              label="Did you know?"
              message="You can add up to 5 devices on your current plan."
              onDismiss={() => {}}
            />
            <InlineAlert
              variant="error"
              message="Connection failed. Please try again."
            />
            <InlineAlert
              variant="warning"
              label="Subscription expiring"
              message={multiLineMessage}
              action={{ label: "Renew now", onClick: () => {} }}
              onDismiss={() => {}}
            />
            <InlineAlert
              variant="error"
              iconMode="icon"
              label="Error"
              message="Connection failed. Please try again."
            />
          </StoryStack>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

const multiLineMessage =
  "Your Pro plan expires in 7 days. Renew now to keep access on all your devices. If you do not renew, your devices will lose access after the expiry date.";


const inContextContent = (
  <ListCard>
    <ListRow
      icon={<IconMonitor size={18} strokeWidth={2} aria-hidden />}
      title="MacBook Pro"
      subtitle="Active"
    />
    <InlineAlert
      variant="info"
      message="Your current access is active. No restore needed."
    />
  </ListCard>
);

export const InContext: Story = {
  name: "In context",
  parameters: {
    docs: {
      description: {
        story:
          "Alert inside a page section, as used in Restore Access. Verify the alert fits inside the card row without overflow.",
      },
    },
  },
  render: () => (
    <StorySection
      title="In context"
      description="Alert inside a ListCard, as used in Restore Access."
    >
      <StoryShowcase>
        <WithThemes>{inContextContent}</WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};
