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
  "`ThemeWrapper` toggles `data-theme` on `document.documentElement` for **`consumer-dark` / `consumer-light`** token layers — use Docs **Controls** to flip themes.",
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
      description: "Maps to data-theme consumer-dark vs consumer-light.",
    },
  },
  args: {
    theme: "dark",
  },
} satisfies Meta<{ theme: "dark" | "light" }>;

export default meta;

type Story = StoryObj<typeof meta>;

function ThemeWrapper({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme === "light" ? "consumer-light" : "consumer-dark",
    );
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
    docs: {
      description: {
        story: "Full-screen spinner / label shown while lazy chunks load.",
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
        story: "Fast path: steady loading without retry banner.",
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
        story: "Retry CTA visible — pair with telemetry stories in ops when changing timeouts.",
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
        story: "Logo / tagline beat — check both themes via Controls.",
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
        story: "Copy and actions for hard bootstrap failures — accessibility: focus management in real app.",
      },
    },
  },
};
