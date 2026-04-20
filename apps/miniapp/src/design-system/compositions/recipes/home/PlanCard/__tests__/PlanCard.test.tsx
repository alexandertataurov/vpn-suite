import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanCard } from "../PlanCard";

describe("PlanCard traffic rendering", () => {
  it("renders explicit unlimited label when traffic is not provided", () => {
    render(
      <PlanCard
        plan="Pro"
        planSub="Monthly"
        status="active"
        devices={2}
        deviceLimit={5}
        renewsLabel="May 20"
        trafficUnlimitedLabel="Unlimited"
      />,
    );

    expect(screen.getByText("Unlimited")).toBeInTheDocument();
  });

  it("prefers provided traffic value over unlimited label", () => {
    render(
      <PlanCard
        plan="Pro"
        planSub="Monthly"
        status="active"
        devices={2}
        deviceLimit={5}
        renewsLabel="May 20"
        traffic="12.4 GB"
        trafficUnlimitedLabel="Unlimited"
      />,
    );

    expect(screen.getByText("12.4 GB")).toBeInTheDocument();
    expect(screen.queryByText("Unlimited")).not.toBeInTheDocument();
  });
});
