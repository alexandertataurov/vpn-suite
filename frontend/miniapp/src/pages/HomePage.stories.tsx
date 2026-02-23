import type { Meta, StoryObj } from "@storybook/react";
import { HomePage } from "./Home";
import { MockWebappApi } from "../storybook/webappMocks";
import { MiniappFrame } from "../storybook/wrappers";
import { webappMeActive, webappMeNoSubscription } from "../storybook/fixtures";

const meta: Meta<typeof HomePage> = {
  title: "Pages/Miniapp/Home",
  component: HomePage,
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "Miniapp Home reference layout." } },
  },
};

export default meta;

type Story = StoryObj<typeof HomePage>;

const renderPage = (options: Parameters<typeof MockWebappApi>[0]["options"]) => (
  <MockWebappApi options={options}>
    <MiniappFrame>
      <HomePage />
    </MiniappFrame>
  </MockWebappApi>
);

export const Overview: Story = {
  render: () => renderPage({ mode: "success", me: webappMeActive }),
};

export const Variants: Story = {
  render: () => renderPage({ mode: "success", me: webappMeNoSubscription }),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Reference layout only; size variants are not exposed.</p>
      {renderPage({ mode: "success", me: webappMeActive })}
    </div>
  ),
};

export const States: Story = {
  render: () => renderPage({ mode: "loading" }),
};

export const WithLongText: Story = {
  render: () => renderPage({
    mode: "success",
    me: {
      ...webappMeActive,
      subscriptions: [
        {
          ...webappMeActive.subscriptions[0],
          plan_id: "ultra-long-plan-id-with-extended-label-for-overflow-check",
        },
      ],
    },
  }),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => renderPage({ mode: "success", me: webappMeActive }),
};

export const Accessibility: Story = {
  render: () => renderPage({ mode: "success", me: webappMeActive }),
};

export const EdgeCases = WithLongText;
