import type { Meta, StoryObj } from "@storybook/react";
import { HomePage } from "./Home";
import { MockWebappApi, MiniappFrame, webappMeActive, webappMeNoSubscription } from "@/lib/storybook";
import { Body } from "@/design-system";

const meta: Meta<typeof HomePage> = {
  title: "Miniapp/Pages/Home",
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

export const HomePageOverview: Story = {
  render: () => renderPage({ mode: "success", me: webappMeActive }),
};

export const HomePageVariants: Story = {
  render: () => renderPage({ mode: "success", me: webappMeNoSubscription }),
};

export const HomePageSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <Body>Reference layout only; size variants are not exposed.</Body>
      {renderPage({ mode: "success", me: webappMeActive })}
    </div>
  ),
};

export const HomePageStates: Story = {
  render: () => renderPage({ mode: "loading" }),
};

export const HomePageWithLongText: Story = {
  render: () => renderPage({
    mode: "success",
    me: {
      ...webappMeActive,
      subscriptions: [
        {
          ...webappMeActive.subscriptions[0]!,
          plan_id: "ultra-long-plan-id-with-extended-label-for-overflow-check",
        },
      ],
    },
  }),
};

export const HomePageDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => renderPage({ mode: "success", me: webappMeActive }),
};

export const HomePageAccessibility: Story = {
  render: () => renderPage({ mode: "success", me: webappMeActive }),
};

export const HomePageEdgeCases = HomePageWithLongText;
