import { describe, expect, it } from "vitest";
import { normalizeLocale, resolveUserLocale, translate } from "../i18n";

describe("i18n core", () => {
  it("normalizes locale codes", () => {
    expect(normalizeLocale("ru")).toBe("ru");
    expect(normalizeLocale("ru-RU")).toBe("ru");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });

  it("resolves user locale from session first, then Telegram, then default", () => {
    expect(
      resolveUserLocale(
        { user: { locale: "ru" } } as unknown as import("@vpn-suite/shared").WebAppMeResponse,
        "en",
      ),
    ).toBe("ru");

    expect(
      resolveUserLocale(
        { user: { locale: "" } } as unknown as import("@vpn-suite/shared").WebAppMeResponse,
        "ru-RU",
      ),
    ).toBe("ru");

    expect(
      resolveUserLocale(
        { user: { locale: "" } } as unknown as import("@vpn-suite/shared").WebAppMeResponse,
        "en-US",
      ),
    ).toBe("en");
  });

  it("falls back from ru to en when key is missing", () => {
    const key = "nonexistent.key";
    const enValue = translate("en", key);
    const ruValue = translate("ru", key);
    expect(ruValue).toBe(enValue);
  });

  it("interpolates parameters into messages", () => {
    const result = translate("en", "plan.hero_period_for_days", { days: 30 });
    expect(result).toContain("30");
  });
});


