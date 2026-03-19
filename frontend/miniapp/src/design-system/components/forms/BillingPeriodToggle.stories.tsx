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
        component: "Billing period segmented control with a sliding thumb and optional annual discount badge.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default — Monthly selected",
  render: () => (
    <WithThemes>
      <InteractiveToggle initialValue="monthly" discount="20%" />
    </WithThemes>
  ),
};

export const AnnualSelected: Story = {
  name: "Annual selected",
  render: () => (
    <WithThemes>
      <InteractiveToggle initialValue="annual" discount="20%" />
    </WithThemes>
  ),
};

export const NoDiscount: Story = {
  name: "Without discount badge",
  render: () => (
    <WithThemes>
      <InteractiveToggle initialValue="monthly" />
    </WithThemes>
  ),
};

export const InContext: Story = {
  name: "In context — Plan & Billing page",
  parameters: {
    docs: {
      description: {
        story: "Segmented control above plan selection cards.",
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
