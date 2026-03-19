import type { Meta, StoryObj } from "@storybook/react";
import { FaqDisclosureItem } from "./FaqDisclosureItem";

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

const meta: Meta<typeof FaqDisclosureItem> = {
  title: "Recipes/Support/FaqDisclosureItem",
  tags: ["autodocs"],
  component: FaqDisclosureItem,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "FAQ accordion item. Expandable question + answer.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "FAQ list",
  parameters: {
    docs: {
      description: {
        story: "Multiple items in a card. Independent expand/collapse.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <div className="faq-list">
        {listItems.map((item) => (
          <FaqDisclosureItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            defaultOpen={item.defaultOpen ?? false}
          />
        ))}
      </div>
    </WithThemes>
  ),
};

const listItems: Array<{ question: string; answer: string; defaultOpen?: boolean }> = [
  { question: "VPN not connecting", answer: "Check your internet connection and try reconnecting. If the issue persists, contact support." },
  { question: "How do I add a device?", answer: "Go to Devices, tap Add Device, and follow the setup instructions for your platform." },
  { question: "How do I restore access?", answer: "Go to Settings → Restore Access. Your devices and configurations are saved to your account.", defaultOpen: true },
  { question: "How do I cancel my plan?", answer: "Go to Settings → Subscription → Cancel. Your access continues until the end of the billing period." },
  { question: "What data do you store?", answer: "We store minimal data: email, payment info, and device identifiers. No traffic logs." },
];

const longAnswer = (
  <>
    <p>
      AmneziaWG is a WireGuard-compatible VPN protocol that provides secure, fast tunneling for your traffic.
    </p>
    <p>
      When you connect, your device establishes an encrypted tunnel to our servers. All traffic is encrypted end-to-end.
    </p>
    <p>
      We use AmneziaWG because it offers excellent performance on mobile and desktop, with minimal battery impact.
    </p>
    <p>
      Your configuration is stored securely. You can use the same config on multiple devices under your subscription.
    </p>
  </>
);

export const Variants: Story = {
  name: "Variants",
  parameters: {
    docs: {
      description: {
        story: "Closed, open, and long-answer FAQ states without duplicating one-item stories.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <div className="faq-list">
        <FaqDisclosureItem
          question="How do I restore access?"
          answer="Go to Settings → Restore Access. Your devices and configurations are saved to your account."
          defaultOpen={false}
        />
        <FaqDisclosureItem
          question="What happens when my subscription expires?"
          answer="Your devices will lose VPN access. Your account, devices, and configuration files are kept for 30 days. Renew to restore access immediately."
          defaultOpen={true}
        />
        <FaqDisclosureItem
          question="What is AmneziaWG and how does it work?"
          answer={longAnswer}
          defaultOpen={true}
        />
      </div>
    </WithThemes>
  ),
};
