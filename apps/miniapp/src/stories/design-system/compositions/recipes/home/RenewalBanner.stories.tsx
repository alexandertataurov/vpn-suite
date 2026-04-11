import type { Meta, StoryObj } from "@storybook/react";
import { RenewalBanner } from "@/design-system/recipes";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

function ThemePane({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
}) {
  return (
    <div data-theme={theme} className="story-theme-pane">
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

const meta: Meta<typeof RenewalBanner> = {
  title: "Recipes/Home/RenewalBanner",
  tags: ["autodocs"],
  component: RenewalBanner,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Renewal banner for expiring and expired subscriptions. Use it as the high-priority prompt on home and settings surfaces.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["warning", "danger", "expiring", "expired"] },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "warning",
    title: "Subscription expires in 14 days",
    subtitle: "Renew now to keep your plan active.",
    badge: "14d left",
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Default warning prompt for an expiring subscription.",
      },
    },
  },
};

export const Variants: Story = {
  name: "Variants",
  parameters: {
    docs: {
      description: {
        story:
          "Warning marks an expiring subscription; danger marks an expired one. The left accent strip gives the prompt a consistent high-priority shape.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Expiring, expired, and urgency-copy examples across themes.">
      <StoryShowcase>
        <WithThemes>
          <StoryStack>
            <RenewalBanner
              variant="warning"
              title="Subscription expires in 14 days"
              subtitle="Renew now to keep your plan active."
              badge="14d left"
              onClick={() => {}}
            />
            <RenewalBanner
              variant="danger"
              title="Subscription expired"
              subtitle="Renew to restore access."
              onClick={() => {}}
            />
            <RenewalBanner
              variant="warning"
              title="Subscription expires in 3 days"
              subtitle="Renew now to keep your plan active."
              badge="3d left"
              onClick={() => {}}
            />
            <RenewalBanner
              variant="warning"
              title="Subscription expires today"
              subtitle="Renew now to keep your plan active."
              badge="Today"
              onClick={() => {}}
            />
          </StoryStack>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Responsive: Story = {
  name: "Responsive",
  parameters: {
    docs: {
      description: {
        story: "On narrow viewports the title and badge stack vertically without clipping the copy.",
      },
    },
  },
  render: () => (
    <StorySection title="Responsive" description="Compact width check for the renewal banner layout.">
      <StoryShowcase>
        <WithThemes>
          <div
            style={{
              width: 390,
              overflow: "hidden",
              animation: "header-responsive-shrink 3s ease-in-out 0.5s forwards",
            }}
          >
            <RenewalBanner
              variant="warning"
              title="Subscription expires in 14 days"
              subtitle="Renew now to keep your plan active."
              badge="14d left"
              onClick={() => {}}
            />
          </div>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};
