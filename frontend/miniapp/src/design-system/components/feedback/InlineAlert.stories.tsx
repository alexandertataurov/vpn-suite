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
    <div
      data-theme={theme}
      style={{
        background: theme === "dark" ? "#0f1117" : "#f2f2ef",
        padding: 24,
        borderRadius: 16,
        flex: 1,
        minWidth: 0,
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          opacity: 0.4,
          marginBottom: 16,
          fontFamily: "Inter",
          color: theme === "dark" ? "white" : "black",
        }}
      >
        {theme}
      </p>
      {children}
    </div>
  );
}

function WithThemes({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
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
          "Inline feedback banner. Variants: info, warning, error, success. Uses semantic --alert-* tokens. Theme-aware via [data-theme].",
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
      description="Four semantic variants. Background, border, label, and dot color all adapt."
    >
      <StoryShowcase>
        <WithThemes>{variantsContent}</WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const WithAction: Story = {
  name: "With action",
  parameters: {
    docs: {
      description: {
        story:
          "Action button is small, auto-width, semantic color. Never full-width inside an alert.",
      },
    },
  },
  render: () => (
    <StorySection
      title="With action"
      description="Action button is small, auto-width, semantic color."
    >
      <StoryShowcase>
        <WithThemes>
          <InlineAlert
            variant="warning"
            label="Action required"
            message="Please review your settings to continue."
            action={{ label: "Review settings", onClick: () => {} }}
          />
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

/** Alias for components-inlinealert--with-actions (legacy/bookmark ID). */
export const WithActions: Story = { ...WithAction, name: "With actions" };

export const Compact: Story = {
  name: "Compact",
  parameters: {
    docs: {
      description: {
        story:
          "Compact layout for secondary pages: surface-2 background, bordered. Use in RestoreAccess, ActionCard, etc.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Compact"
      description="Surface-2, bordered layout for secondary pages."
    >
      <StoryShowcase>
        <WithThemes>
          <InlineAlert
            variant="info"
            label="No expired subscription"
            message="Your subscription is active. If you need help, contact support."
            compact
          />
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Dismissible: Story = {
  name: "Dismissible",
  parameters: {
    docs: {
      description: {
        story:
          "Dismiss × appears top-right. Use for non-critical alerts that the user can acknowledge and close.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Dismissible"
      description="Dismiss × appears top-right for non-critical alerts."
    >
      <StoryShowcase>
        <WithThemes>
          <InlineAlert
            variant="info"
            label="Did you know?"
            message="You can add up to 5 devices on your current plan."
            onDismiss={() => {}}
          />
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const NoLabel: Story = {
  name: "No label",
  parameters: {
    docs: {
      description: {
        story:
          "When no label is provided, message is left-aligned without indent. Use for short, self-explanatory messages.",
      },
    },
  },
  render: () => (
    <StorySection
      title="No label"
      description="Message left-aligned without indent when no label."
    >
      <StoryShowcase>
        <WithThemes>
          <InlineAlert
            variant="error"
            message="Connection failed. Please try again."
          />
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

const multiLineMessage =
  "Your Pro plan expires in 7 days. Renew now to keep access on all your devices. If you do not renew, your devices will lose access after the expiry date.";

export const MultiLine: Story = {
  name: "Multi-line message",
  parameters: {
    docs: {
      description: {
        story: "Verify alignment holds across wrapping messages.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Multi-line message"
      description="Verify alignment holds across wrapping messages."
    >
      <StoryShowcase>
        <WithThemes>
          <StoryStack className="story-stack story-stack--tight">
            <InlineAlert
              variant="warning"
              label="Subscription expiring"
              message={multiLineMessage}
              action={{ label: "Renew now", onClick: () => {} }}
              onDismiss={() => {}}
            />
          </StoryStack>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const IconMode: Story = {
  name: "Icon mode",
  parameters: {
    docs: {
      description: {
        story:
          'Use iconMode="icon" when the alert needs more visual weight — e.g. full-page error states or onboarding prompts.',
      },
    },
  },
  render: () => (
    <StorySection
      title="Icon mode"
      description='iconMode="icon" for more visual weight.'
    >
      <StoryShowcase>
        <WithThemes>
          <StoryStack className="story-stack story-stack--tight">
            <InlineAlert
              variant="error"
              iconMode="icon"
              label="Error"
              message="Connection failed. Please try again."
            />
            <InlineAlert
              variant="warning"
              iconMode="icon"
              label="Warning"
              message="Your connection may be unstable."
            />
          </StoryStack>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

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
