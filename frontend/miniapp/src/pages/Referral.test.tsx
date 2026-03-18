import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { ReferralPage } from "@/future/referral/Referral";
import { LayoutProvider } from "@/context/LayoutContext";
import { ToastContainer } from "@/design-system";
import { renderWithProviders } from "@/test/utils/render";

vi.mock("@/page-models", () => ({
  useReferralPageModel: () => ({
    header: { title: "Referrals" },
    pageState: { status: "ready" },
    showUpsellReferral: false,
    referralUpsellTo: "/plan",
    botUsername: "vpn_suite_bot",
    shareUrl: "https://t.me/vpn_suite_bot?startapp=abc",
    isOnline: true,
    copyToClipboard: vi.fn(),
    handleShare: vi.fn(),
    statsData: { total_referrals: 3 },
  }),
}));

describe("ReferralPage", () => {
  it("ships referral in read-only beta mode without reward-progress UI", () => {
    renderWithProviders(
      <LayoutProvider stackFlow>
        <ToastContainer>
          <ReferralPage />
        </ToastContainer>
      </LayoutProvider>,
    );

    expect(screen.getByText("Share link")).toBeInTheDocument();
    expect(
      screen.getByText("Referral rewards stay hidden during beta, but you can still copy your invite link."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.queryByText("Reward progress")).not.toBeInTheDocument();
  });
});
