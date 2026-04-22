import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/design-system";

describe("button size contract", () => {
  it("maps lg to the large button class", () => {
    render(<Button size="lg">Continue</Button>);

    expect(screen.getByRole("button", { name: "Continue" })).toHaveClass("btn-lg");
  });

  it("retains the small and medium size classes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button", { name: "Small" })).toHaveClass("btn-sm");

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole("button", { name: "Medium" })).toHaveClass("btn-md");
  });
});
