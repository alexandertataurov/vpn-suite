import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { BootstrapLoading } from "@/bootstrap/BootstrapLoading";
import { BootstrapLoadingSlow } from "@/bootstrap/BootstrapLoadingSlow";
import { BrandSplash } from "@/bootstrap/BrandSplash";
import { StartupError } from "@/bootstrap/StartupError";
import { pageStoryParameters } from "@/storybook/page-contracts";

const meta: Meta<{ theme: "dark" | "light" }> = {
  title: "Pages/BootScreen",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component:
          "Boot, splash, and loading screens shown during app bootstrap. All share BootScreen layout with shield icon and optional progress bar.",
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

export const BootstrapLoadingStory: Story = {
  name: "Bootstrap loading",
  parameters: {
    docs: {
      description: {
        story:
          "Session/auth loading with skeleton plan card and indeterminate top progress bar.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <BootstrapLoading />
    </ThemeWrapper>
  ),
};

export const BootstrapLoadingSlowStory: Story = {
  name: "Bootstrap loading (slow)",
  parameters: {
    docs: {
      description: {
        story: "After 3s timeout: shows retry CTA below skeleton.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <BootstrapLoadingSlow onRetry={() => {}} />
    </ThemeWrapper>
  ),
};

export const BrandSplashStory: Story = {
  name: "Brand splash",
  parameters: {
    docs: {
      description: {
        story: "First-launch welcome before onboarding begins.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <BrandSplash />
    </ThemeWrapper>
  ),
};

export const StartupErrorStory: Story = {
  name: "Startup error",
  parameters: {
    docs: {
      description: {
        story:
          "Session failed. Error InlineAlert + retry button. Shield icon shifts to error color.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StartupError
        title="Could not load session"
        message="Please try again. If the issue persists, check your connection."
        onRetry={() => {}}
      />
    </ThemeWrapper>
  ),
};
