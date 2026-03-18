import type { Meta, StoryObj } from "@storybook/react";
import { TelegramLoadingScreen } from "@/app/TelegramLoadingScreen";
import {
  BootLoadingScreen,
  BrandSplashScreen,
  BootErrorScreen,
} from "@/bootstrap/BootScreens";
import { StorySection } from "@/design-system";

const meta: Meta = {
  title: "Pages/Contracts/SplashAndLoading",
  tags: ["autodocs"],
  parameters: {
    viewport: { defaultViewport: "iphone14" },
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Splash and loading screens shown during app bootstrap. TelegramLoadingScreen: Suspense fallback. BootLoadingScreen: session/auth loading. BrandSplashScreen: welcome before onboarding. BootErrorScreen: startup error.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const TelegramLoading: Story = {
  render: () => (
    <StorySection title="Telegram loading" description="Suspense fallback, uses --tg-theme-* in Telegram.">
      <TelegramLoadingScreen />
    </StorySection>
  ),
};

export const BootLoading: Story = {
  render: () => (
    <StorySection title="Bootstrap loading" description="Session/auth loading with skeleton.">
      <BootLoadingScreen slowNetwork={false} onRetry={() => {}} />
    </StorySection>
  ),
};

export const BootLoadingSlowNetwork: Story = {
  render: () => (
    <StorySection title="Bootstrap loading (slow)" description="Shows retry CTA when network is slow.">
      <BootLoadingScreen slowNetwork onRetry={() => {}} />
    </StorySection>
  ),
};

export const BrandSplash: Story = {
  render: () => (
    <StorySection title="Brand splash" description="Welcome screen before onboarding.">
      <BrandSplashScreen />
    </StorySection>
  ),
};

export const BootError: Story = {
  render: () => (
    <StorySection title="Startup error" description="Error screen with retry.">
      <BootErrorScreen
        title="Session error"
        message="Please try again."
        onRetry={() => {}}
      />
    </StorySection>
  ),
};
