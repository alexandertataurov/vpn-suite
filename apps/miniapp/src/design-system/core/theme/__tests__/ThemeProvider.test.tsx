import { useEffect } from "react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@/design-system";

const STORAGE_KEY = "theme-provider-test";

function ThemeProbe() {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.dataset.themeProbe = theme;
  }, [theme]);

  return null;
}

function mockMatchMedia(prefersLight: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      media: query,
      matches: query.includes("prefers-color-scheme: light") ? prefersLight : !prefersLight,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe("ThemeProvider", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-probe");
    document.documentElement.style.colorScheme = "";
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("falls back to the system preference when no stored theme exists", async () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider themes={["consumer-dark", "consumer-light"]} defaultTheme="consumer-light" storageKey={STORAGE_KEY}>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "consumer-dark");
    });
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.dataset.themeProbe).toBe("consumer-dark");
  });

  it("honors the stored theme over the system preference", async () => {
    mockMatchMedia(false);
    window.localStorage.setItem(STORAGE_KEY, "consumer-light");

    render(
      <ThemeProvider themes={["consumer-dark", "consumer-light"]} defaultTheme="consumer-dark" storageKey={STORAGE_KEY}>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "consumer-light");
    });
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.dataset.themeProbe).toBe("consumer-light");
  });
});
