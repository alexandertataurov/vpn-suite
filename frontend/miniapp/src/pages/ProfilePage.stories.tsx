import type { Meta, StoryObj } from "@storybook/react";
import { ProfilePage } from "./Profile";
import { MockWebappApi } from "../storybook/webappMocks";
import { MiniappFrame } from "../storybook/wrappers";
import { webappMeActive, webappMeNoSubscription } from "../storybook/fixtures";

const meta: Meta<typeof ProfilePage> = {
  title: "Pages/Miniapp/Profile",
  component: ProfilePage,
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "Miniapp Profile reference layout." } },
  },
};

export default meta;

type Story = StoryObj<typeof ProfilePage>;

const renderPage = (options: Parameters<typeof MockWebappApi>[0]["options"]) => (
  <MockWebappApi options={options}>
    <MiniappFrame>
      <ProfilePage />
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
          ...webappMeActive.subscriptions[0]!,
          plan_id: "enterprise-annual-with-extended-name-for-overflow-check",
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
