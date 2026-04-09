import { type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useArgs } from "storybook/preview-api";
import { BillingPeriodToggle } from "./BillingPeriodToggle";
import { CardRow, RowItem, SectionLabel, StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { IconShield } from "@/design-system/icons";
import "@/styles/app/routes.css";

function ThemePane({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: ReactNode;
}) {
  return (
    <div data-theme={theme} className="story-theme-pane">
      <p className="story-theme-pane-label">{theme}</p>
      {children}
    </div>
  );
}

function WithThemes({ children }: { children: ReactNode }) {
  return (
    <div className="story-themes-row">
      <ThemePane theme="dark">{children}</ThemePane>
      <ThemePane theme="light">{children}</ThemePane>
    </div>
  );
}

const meta: Meta<typeof BillingPeriodToggle> = {
  title: "Components/BillingPeriodToggle",
  tags: ["autodocs"],
  component: BillingPeriodToggle,
  args: {
    value: "monthly",
    discount: "20%",
  },
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Billing period segmented control with a sliding thumb and optional annual discount badge. Use it as the canonical period selector for plan flows.",
      },
    },
  },
  argTypes: {
    value: {
      control: "inline-radio",
      options: ["monthly", "annual"],
      table: { category: "State" },
    },
    discount: {
      control: "text",
      table: { category: "Content" },
    },
    onChange: {
      table: { category: "Behavior" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Monthly selected by default with the discount badge visible. This is the baseline plan selector state.",
      },
    },
  },
  render: (args) => (
    <StorySection title="Default" description="Baseline billing-period selector with the annual discount badge visible.">
      <StoryShowcase>
        <WithThemes>
          <BillingPeriodToggle {...args} onChange={() => {}} />
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Monthly, annual, and no-discount variants shown together for quick comparison.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Monthly, annual, and no-discount states for quick comparison.">
      <StoryShowcase>
        <WithThemes>
          <StoryStack>
            <BillingPeriodToggle value="monthly" onChange={() => {}} discount="20%" />
            <BillingPeriodToggle value="annual" onChange={() => {}} discount="20%" />
            <BillingPeriodToggle value="monthly" onChange={() => {}} />
          </StoryStack>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  name: "In context",
  parameters: {
    docs: {
      description: {
        story:
          "Placed above a plan card to show how the toggle reads inside the billing flow.",
      },
    },
  },
  render: () => (
    <StorySection title="In context" description="Placed above a plan card as it appears in the billing flow.">
      <StoryShowcase>
        <WithThemes>
          <StoryStack>
            <SectionLabel label="Change Plan" />
            <p className="section-desc">Switch plans or pick a renewal period.</p>
            <BillingPeriodToggle value="annual" onChange={() => {}} discount="20%" />
            <CardRow>
              <RowItem
                icon={<IconShield size={15} strokeWidth={2} aria-hidden />}
                iconVariant="blue"
                label="Pro · Current plan"
                subtitle="3 device slots · AmneziaWG · Priority support"
              />
            </CardRow>
          </StoryStack>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Interactive period selector wired through Storybook args so the selected state stays in sync with the controls panel.",
      },
    },
  },
  render: function InteractiveStory(args) {
    const [{ value }, updateArgs] = useArgs();

    return (
      <StorySection title="Interactive" description="Switch between monthly and annual while keeping Storybook controls in sync.">
        <StoryShowcase>
          <WithThemes>
            <BillingPeriodToggle
              {...args}
              value={value ?? args.value}
              onChange={(nextValue) => updateArgs({ value: nextValue })}
            />
          </WithThemes>
        </StoryShowcase>
      </StorySection>
    );
  },
};
