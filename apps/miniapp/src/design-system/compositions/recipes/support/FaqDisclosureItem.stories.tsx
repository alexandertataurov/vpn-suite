import type { Meta, StoryObj } from "@storybook/react";
import { FaqDisclosureItem } from "./FaqDisclosureItem";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof FaqDisclosureItem> = {
  title: "Recipes/Support/FaqDisclosureItem",
  tags: ["autodocs"],
  component: FaqDisclosureItem,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "FAQ accordion item with expandable question and answer content.",
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
        story: "Multiple items in a card with independent expand and collapse behavior.",
      },
    },
  },
  render: () => (
    <StorySection title="FAQ list" description="A multi-item FAQ list rendered as the default reference state.">
      <StoryShowcase>
        <StoryStack>
          {listItems.map((item) => (
            <FaqDisclosureItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              defaultOpen={item.defaultOpen ?? false}
            />
          ))}
        </StoryStack>
      </StoryShowcase>
    </StorySection>
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
    <StorySection title="Variants" description="Collapsed, open, and long-answer FAQ rows in a single matrix.">
      <StoryShowcase>
        <StoryStack>
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
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
