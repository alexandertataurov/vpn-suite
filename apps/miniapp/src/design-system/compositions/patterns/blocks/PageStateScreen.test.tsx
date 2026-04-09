import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageStateScreen } from "./PageStateScreen";

describe("PageStateScreen", () => {
  it("does not forward alertTone to the DOM scaffold", () => {
    render(
      <PageStateScreen
        label="Authentication"
        chipText="Reconnect required"
        alertTone="warning"
        alertTitle="Session missing"
        alertMessage="Return to Telegram and reopen the mini app."
      />,
    );

    const title = screen.getByText("Session missing");
    const scaffold = title.closest(".miniapp-page-scaffold");
    expect(scaffold).not.toBeNull();
    expect(scaffold).not.toHaveAttribute("alerttone");
    expect(scaffold).not.toHaveAttribute("alertTone");
  });
});
