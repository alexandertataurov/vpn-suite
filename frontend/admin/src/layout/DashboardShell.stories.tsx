import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DashboardShell } from "./DashboardShell";

const meta: Meta<typeof DashboardShell> = {
  title: "Layout/DashboardShell",
  component: DashboardShell,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof DashboardShell>;

export const OverviewScaffold: Story = {
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

