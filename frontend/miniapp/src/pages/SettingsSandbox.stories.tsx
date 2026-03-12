import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { SettingsPage } from "./Settings";
import { MobileFrame, PageSandbox, loggedOutScenario, noPlanScenario, readyScenario } from "@/storybook";
import "@/storybook/sandbox.css";

const meta = {
  title: "Pages/Sandbox/Settings Review",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Redesign and QA sandbox for the Settings route. Use this view to compare realistic state clusters side by side without changing the production contract stories.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function SettingsStateFrame({
  label,
  scenario,
}: {
  label: string;
  scenario: typeof readyScenario;
}) {
  return (
    <div className="sb-sandbox-frame">
      <div className="sb-sandbox-label">{label}</div>
      <MobileFrame>
        <PageSandbox scenario={scenario} initialEntries={["/settings"]}>
          <Route path="/settings" element={<SettingsPage />} />
        </PageSandbox>
      </MobileFrame>
    </div>
  );
}

export const ComparisonBoard: Story = {
  render: () => (
    <div className="sb-sandbox-grid">
      <SettingsStateFrame label="Active plan" scenario={readyScenario} />
      <SettingsStateFrame label="Reconnect required" scenario={loggedOutScenario} />
      <SettingsStateFrame label="No plan" scenario={noPlanScenario} />
    </div>
  ),
};
