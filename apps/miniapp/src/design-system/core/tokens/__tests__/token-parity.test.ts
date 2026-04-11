import { BREAKPOINT_TOKENS, BREAKPOINT_VALUES, TYPOGRAPHY_THEME_VALUES, TYPOGRAPHY_TOKENS } from "@/design-system/foundations";
import { getTokenCoverage, normalizeCssValue } from "@/design-system/core/tokens/runtime";
import { loadDesignSystemCss } from "@/test/utils/loadDesignSystemCss";

describe("Design token CSS parity", () => {
  beforeAll(() => {
    loadDesignSystemCss({ includeTelegram: false });
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  test.each(Object.entries(TYPOGRAPHY_THEME_VALUES))(
    "typography tokens resolve correctly for %s",
    (theme, expectedValues) => {
      document.documentElement.setAttribute("data-theme", theme);
      const coverage = getTokenCoverage(TYPOGRAPHY_TOKENS, expectedValues);
      expect(coverage.failing).toEqual([]);
    }
  );

  test("breakpoint tokens resolve correctly", () => {
    document.documentElement.setAttribute("data-theme", "consumer-light");
    const coverage = getTokenCoverage(BREAKPOINT_TOKENS, BREAKPOINT_VALUES);
    expect(coverage.failing).toEqual([]);
  });

  test("consumer-light typography aliases stay aligned with canonical values", () => {
    document.documentElement.setAttribute("data-theme", "consumer-light");
    for (const [token, expected] of Object.entries(TYPOGRAPHY_THEME_VALUES["consumer-light"])) {
      const coverage = getTokenCoverage({ [token]: token }, { [token]: expected });
      expect(normalizeCssValue(coverage.results[0]?.actual ?? "")).toBe(normalizeCssValue(expected));
    }
  });

  test("consumer theme weight tokens resolve without telegram fallback CSS", () => {
    document.documentElement.setAttribute("data-theme", "consumer-dark");
    const coverage = getTokenCoverage(
      {
        fontWeightRegular: "--ds-font-weight-regular",
        fontWeightSemibold: "--ds-font-weight-semibold",
      },
      {
        "--ds-font-weight-regular": "400",
        "--ds-font-weight-semibold": "600",
      },
    );
    expect(coverage.failing).toEqual([]);
  });
});
