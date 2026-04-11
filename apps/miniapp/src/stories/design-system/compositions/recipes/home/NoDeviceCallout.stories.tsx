import type { Meta, StoryObj } from "@storybook/react";
import { NoDeviceCallout } from "@/design-system/recipes";
import { CardRow, PlanCard, RowItem, StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { IconBox } from "@/design-system/icons";

function ThemePane({
  theme,
  children,
  narrow = false,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      data-theme={theme}
      className={`story-theme-pane ${narrow ? "story-theme-pane--no-device-narrow" : "story-theme-pane--no-device"}`}
    >
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

const meta: Meta<typeof NoDeviceCallout> = {
  title: "Recipes/Home/NoDeviceCallout",
  tags: ["autodocs"],
  component: NoDeviceCallout,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Empty-home callout shown when the user has an active plan but has not added any devices yet.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
  parameters: {
    docs: {
      description: {
        story: "Primary empty state for an active subscription with zero issued devices.",
      },
    },
  },
  render: () => (
    <StorySection title="Default" description="Dark and light themes for the empty-device callout.">
      <StoryShowcase>
        <WithThemes>
          <NoDeviceCallout
            title="No devices added"
            subtitle="Add a device to generate your configuration."
            onAddDevice={() => {}}
          />
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Variants: Story = {
  name: "Variants",
  parameters: {
    docs: {
      description: {
        story: "Default copy, post-purchase copy, disabled-CTA fallback, and narrow viewport behavior.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Two copy positions, a disabled CTA fallback, and a narrow layout check.">
      <StoryShowcase>
        <StoryStack>
          <WithThemes>
            <div className="nd-story-stack">
              <NoDeviceCallout
                title="No devices added"
                subtitle="Add a device to generate your configuration."
                onAddDevice={() => {}}
              />
              <NoDeviceCallout
                title="Ready to connect"
                subtitle="Your Pro plan is active. Add a device to get started."
                onAddDevice={() => {}}
              />
              <NoDeviceCallout
                title="No action wired"
                subtitle="The button is disabled when no add-device handler is available."
              />
            </div>
          </WithThemes>
          <ThemePane theme="dark" narrow>
            <NoDeviceCallout
              title="No devices added"
              subtitle="Add a device to generate your configuration."
              onAddDevice={() => {}}
            />
          </ThemePane>
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  name: "In context — Home screen",
  parameters: {
    docs: {
      description: {
        story: "The empty-device callout positioned between a plan card and supporting rows on the home screen.",
      },
    },
  },
  render: () => (
    <StorySection title="In context" description="Home screen stack with plan, callout, and supporting row.">
      <StoryShowcase>
        <WithThemes>
          <div className="nd-story-stack">
            <PlanCard
              plan="Pro"
              planSub="Annual"
              status="active"
              devices={0}
              deviceLimit={5}
              renewsLabel="Apr 1"
            />
            <NoDeviceCallout
              title="No devices added"
              subtitle="Add a device to generate your configuration."
              onAddDevice={() => {}}
            />
            <CardRow>
              <RowItem
                icon={<IconBox size={15} strokeWidth={2} aria-hidden />}
                label="Subscription"
                subtitle="Pro annual · renews Apr 1"
              />
            </CardRow>
          </div>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};
