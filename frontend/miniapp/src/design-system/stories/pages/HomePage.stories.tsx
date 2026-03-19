import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import {
  type MockScenario,
  accessErrorScenario,
  emptyDevicesScenario,
  expiredScenario,
  expiringNoDevicesScenario,
  loadingSessionScenario,
  noPlanScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/Home",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component:
          "Home route rendered with the same page component and shell as the miniapp. These stories document the actual route states rather than a Storybook-only playground.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

function renderHomePage(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  );
}

function createHomeStory(name: string, scenario: MockScenario, description?: string): Story {
  return {
    name,
    render: () => renderHomePage(scenario),
    ...(description
      ? {
          parameters: {
            docs: {
              description: {
                story: description,
              },
            },
          },
        }
      : {}),
  };
}

export const NoPlan = createHomeStory(
  "No active plan",
  noPlanScenario,
  "New-user state with the onboarding hero and plan/setup prompts.",
);

export const NoDevices = createHomeStory(
  "No devices yet",
  emptyDevicesScenario,
  "Active subscription with no issued devices yet. Shows the no-device callout and subscription row.",
);

export const Active = createHomeStory("Active subscription", readyScenario);

export const Home = {
  ...Active,
  name: "Home",
} satisfies Story;

export const Expiring = createHomeStory(
  "Expiring soon",
  trialScenario,
  "Trial or renewal-warning state. See the dedicated no-device variant for the callout-above-banner layout used in the live home screen.",
);

export const ExpiringNoDevices = createHomeStory(
  "Expiring with no devices",
  expiringNoDevicesScenario,
);

export const Expired = createHomeStory("Subscription expired", expiredScenario);

export const Loading = createHomeStory("Home loading", loadingSessionScenario);

export const Error = createHomeStory("Could not load home", accessErrorScenario);
