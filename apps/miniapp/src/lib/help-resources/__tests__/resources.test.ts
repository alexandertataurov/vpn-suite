import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  getSupportContactHandle: () => "@aplhaVPNSupport",
  privacyPolicyUrl: "https://example.com/privacy",
  userAgreementUrl: "https://example.com/terms",
}));

import {
  buildSettingsLegalLinks,
  buildSupportLegalQuickLinks,
  getSupportCardDescription,
  getSupportContactDescription,
} from "../resources";

function makeTranslate() {
  return (key: string, params?: Record<string, string | number | boolean>) => {
    if (params?.handle) return `${key}:${String(params.handle)}`;
    return key;
  };
}

describe("help-resources (legal links & support copy)", () => {
  it("builds settings legal links with the settings copy keys and expected urls", () => {
    const t = makeTranslate();
    const openLink = vi.fn();

    const links = buildSettingsLegalLinks({ t, openLink });

    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({
      title: "settings.privacy_policy_title",
      description: "settings.privacy_policy_description",
    });
    expect(links[1]).toMatchObject({
      title: "settings.user_agreement_title",
      description: "settings.user_agreement_description",
    });

    links[0]?.onClick();
    links[1]?.onClick();

    expect(openLink).toHaveBeenNthCalledWith(1, "https://example.com/privacy");
    expect(openLink).toHaveBeenNthCalledWith(2, "https://example.com/terms");
  });

  it("builds support quick links with support-specific subtitles", () => {
    const t = makeTranslate();
    const openLink = vi.fn();

    const links = buildSupportLegalQuickLinks({ t, openLink });

    expect(links).toEqual([
      {
        title: "settings.privacy_policy_title",
        subtitle: "support.privacy_policy_description",
        onClick: expect.any(Function),
      },
      {
        title: "settings.user_agreement_title",
        subtitle: "support.user_agreement_description",
        onClick: expect.any(Function),
      },
    ]);
  });

  it("formats support descriptions with the configured support handle", () => {
    const t = makeTranslate();

    expect(getSupportContactDescription(t)).toBe(
      "settings.contact_support_description_with_handle:@aplhaVPNSupport",
    );
    expect(getSupportCardDescription(t, "fallback subtitle")).toBe(
      "support.contact_card_description_with_handle:@aplhaVPNSupport",
    );
  });
});
