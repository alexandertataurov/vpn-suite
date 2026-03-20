import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DashboardShell } from "./DashboardShell";

const meta: Meta<typeof DashboardShell> = {
  title: "Layout/DashboardShell",
  component: DashboardShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Admin shell layout with a fixed navigation frame and routed content area. Use this story to review how the dashboard scaffold handles full-screen composition and page spacing.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DashboardShell>;

export const OverviewScaffold: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Overview-style content inside the dashboard shell. This is the baseline contract for routed admin pages.",
      },
    },
  },
  render: () => (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<DashboardShell />}>
          <Route
            index
            element={
              <div className="page">
                <div className="ph">
                  <div>
                    <div className="ph-title">Overview</div>
                    <div className="ph-meta">
                      <div className="dot" />
                      <span>Last updated just now</span>
                      <span className="sep">·</span>
                      <span>Preview layout only</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};
