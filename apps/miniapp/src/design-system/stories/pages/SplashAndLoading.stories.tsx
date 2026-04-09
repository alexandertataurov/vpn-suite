import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, type ReactNode } from "react";
import { TelegramLoadingScreen } from "@/app/TelegramLoadingScreen";
import {
  BootLoadingScreen,
  BrandSplashScreen,
  BootErrorScreen,
} from "@/bootstrap/BootScreens";
import { StorySection } from "@/design-system";
import { pageStoryParameters } from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Bootstrap surfaces** shown outside normal page routes: Telegram Suspense fallback, session load, brand splash, and fatal boot error.",
  "**Controls · `theme`**: applies only to stories wrapped in `ThemeWrapper` (bootstrap screens). **Telegram · Suspense fallback** uses Telegram host CSS variables — flip theme in the Telegram client, not Storybook Controls.",
  "`ThemeWrapper` sets `data-theme` to `consumer-dark` or `consumer-light` on `document.documentElement` and **removes** `data-theme` on unmount so the canvas does not leak theme into unrelated stories.",
  "These are not `PageSandbox` routes; they validate early shell visuals in isolation.",
].join("\n\n");

const meta = {
  title: "Pages/Contracts/SplashAndLoading",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: DOC_BODY,
      },
    },
  },
  argTypes: {
    theme: {
      control: "inline-radio",
      options: ["dark", "light"] as const,
      description:
        "Maps to `data-theme`: `consumer-dark` | `consumer-light` on `document.documentElement`. Ignored by **Telegram · Suspense fallback** (no `ThemeWrapper`).",
    },
  },
  args: {
    theme: "dark",
  },
} satisfies Meta<{ theme: "dark" | "light" }>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Sets consumer theme tokens for bootstrap-only stories; clears on unmount to avoid polluting other docs/canvas stories. */
function ThemeWrapper({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: ReactNode;
}) {
  useEffect(() => {
    const value = theme === "light" ? "consumer-light" : "consumer-dark";
    document.documentElement.setAttribute("data-theme", value);
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [theme]);
  return <>{children}</>;
}

export const TelegramSuspenseFallback: Story = {
  name: "Telegram · Suspense fallback",
  render: () => (
    <StorySection
      title="TelegramLoadingScreen"
      description="Default Suspense boundary in the Telegram miniapp — uses Telegram theme CSS variables where available."
    >
      <TelegramLoadingScreen />
    </StorySection>
  ),
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Full-screen spinner / label while lazy chunks load. **No `theme` arg** — not wrapped in `ThemeWrapper`; use the Telegram client theme to preview light/dark.",
      },
    },
  },
};

export const BootstrapLoading: Story = {
  name: "Bootstrap · session loading",
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection
        title="BootLoadingScreen"
        description="Auth/session handshake — skeleton layout with optional slow-network retry."
      >
        <BootLoadingScreen slowNetwork={false} onRetry={() => {}} />
      </StorySection>
    </ThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: "Fast path with steady loading and no retry banner.",
      },
    },
  },
};

export const BootstrapLoadingSlowNetwork: Story = {
  name: "Bootstrap · slow network",
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection
        title="BootLoadingScreen (slow)"
        description="Surfaces retry when the client detects slow or stalled bootstrap."
      >
        <BootLoadingScreen slowNetwork onRetry={() => {}} />
      </StorySection>
    </ThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: "Retry CTA visible. Pair with telemetry stories in ops when changing timeouts.",
      },
    },
  },
};

export const BrandSplash: Story = {
  name: "Brand splash",
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection title="BrandSplashScreen" description="Marketing splash before routed onboarding.">
        <BrandSplashScreen />
      </StorySection>
    </ThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: "Logo and tagline splash screen. Check both themes via Controls.",
      },
    },
  },
};

export const BootstrapError: Story = {
  name: "Bootstrap · fatal error",
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection title="BootErrorScreen" description="Non-recoverable or repeated failure with explicit retry.">
        <BootErrorScreen
          title="Could not load session"
          message="Please try again."
          onRetry={() => {}}
        />
      </StorySection>
    </ThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: "Copy and actions for hard bootstrap failures. Accessibility: focus management in the real app.",
      },
    },
  },
};
