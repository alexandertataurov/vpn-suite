import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { BillingPeriodToggle, type BillingPeriodValue } from "./BillingPeriodToggle";
import { CardRow, RowItem, SectionLabel, StoryStack } from "@/design-system";
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

function InteractiveToggle({
  initialValue = "monthly",
  discount,
}: {
  initialValue?: BillingPeriodValue;
  discount?: string;
}) {
  const [value, setValue] = useState<BillingPeriodValue>(initialValue);
  return <BillingPeriodToggle value={value} onChange={setValue} discount={discount} />;
}

const meta: Meta<typeof BillingPeriodToggle> = {
  title: "Components/BillingPeriodToggle",
  tags: ["autodocs"],
  component: BillingPeriodToggle,
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
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default — Monthly selected",
  parameters: {
    docs: {
      description: {
        story:
          "Monthly selected by default with the discount badge visible. This is the baseline plan selector state.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <InteractiveToggle initialValue="monthly" discount="20%" />
    </WithThemes>
  ),
};

export const Variants: Story = {
  name: "Variants",
  parameters: {
    docs: {
      description: {
        story:
          "Monthly, annual, and no-discount variants shown together for quick comparison.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <StoryStack>
        <InteractiveToggle initialValue="monthly" discount="20%" />
        <InteractiveToggle initialValue="annual" discount="20%" />
        <InteractiveToggle initialValue="monthly" />
      </StoryStack>
    </WithThemes>
  ),
};

export const InContext: Story = {
  name: "In context — Plan & Billing page",
  parameters: {
    docs: {
      description: {
        story:
          "Placed above a plan card to show how the toggle reads inside the billing flow.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <StoryStack>
        <SectionLabel label="Change Plan" />
        <p className="section-desc">Switch plans or pick a renewal period.</p>
        <InteractiveToggle initialValue="annual" discount="20%" />
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
  ),
};
