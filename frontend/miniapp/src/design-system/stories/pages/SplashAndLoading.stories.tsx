import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { TelegramLoadingScreen } from "@/app/TelegramLoadingScreen";
import {
  BootLoadingScreen,
  BrandSplashScreen,
  BootErrorScreen,
} from "@/bootstrap/BootScreens";
import { StorySection } from "@/design-system";
import { pageStoryParameters } from "@/storybook/page-contracts";

const meta: Meta<{ theme: "dark" | "light" }> = {
  title: "Pages/Contracts/SplashAndLoading",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component:
          "Splash and loading screens shown during app bootstrap. TelegramLoadingScreen: Suspense fallback. BootLoadingScreen: session/auth loading. BrandSplashScreen: welcome before onboarding. BootErrorScreen: startup error.",
      },
    },
  },
  argTypes: {
    theme: {
      control: "inline-radio",
      options: ["dark", "light"],
      defaultValue: "dark",
    },
  },
  args: { theme: "dark" },
};

export default meta;

type Story = StoryObj<typeof meta>;

function ThemeWrapper({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "light" ? "consumer-light" : "consumer-dark");
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [theme]);
  return <>{children}</>;
}

export const TelegramLoading: Story = {
  render: () => (
    <StorySection title="Telegram loading" description="Suspense fallback, uses --tg-theme-* in Telegram.">
      <TelegramLoadingScreen />
    </StorySection>
  ),
};

export const BootLoading: Story = {
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection title="Bootstrap loading" description="Session/auth loading with skeleton.">
        <BootLoadingScreen slowNetwork={false} onRetry={() => {}} />
      </StorySection>
    </ThemeWrapper>
  ),
};

export const BootLoadingSlowNetwork: Story = {
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection title="Bootstrap loading (slow)" description="Shows retry CTA when network is slow.">
        <BootLoadingScreen slowNetwork onRetry={() => {}} />
      </StorySection>
    </ThemeWrapper>
  ),
};

export const BrandSplash: Story = {
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection title="Brand splash" description="Welcome screen before onboarding.">
        <BrandSplashScreen />
      </StorySection>
    </ThemeWrapper>
  ),
};

export const BootError: Story = {
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection title="Startup error" description="Error screen with retry.">
        <BootErrorScreen
          title="Could not load session"
          message="Please try again."
          onRetry={() => {}}
        />
      </StorySection>
    </ThemeWrapper>
  ),
};
