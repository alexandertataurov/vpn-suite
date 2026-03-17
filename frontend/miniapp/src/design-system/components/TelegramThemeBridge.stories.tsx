import type { Meta, StoryObj } from "@storybook/react";
import { TelegramThemeBridge } from "./TelegramThemeBridge";
import { useTheme } from "@/design-system/core/theme";
import { Stack } from "@/design-system/core/primitives";
import { StoryCard, StoryPage, StorySection } from "@/design-system/utils/story-helpers";

const meta = {
  title: "Foundations/Telegram Theme Bridge",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Syncs the miniapp theme with Telegram theme params or device preference when Telegram is unavailable.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function ThemeStatus() {
  const { theme } = useTheme();
  return (
    <Stack gap="2">
      <div>Active theme: {theme}</div>
      <div>data-tg: {document.documentElement.getAttribute("data-tg") ?? "false"}</div>
    </Stack>
  );
}

export const Default: Story = {
  render: () => (
    <StoryPage
      eyebrow="Components"
      title="Telegram theme bridge"
      summary="TelegramThemeBridge keeps the miniapp theme synchronized with Telegram or local device preference. This story documents it in the same structured style as the foundations pages."
      stats={[
        { label: "Sync source", value: "telegram + media query" },
        { label: "Side effects", value: "theme + data-tg" },
        { label: "Examples", value: "1" },
      ]}
    >
      <StorySection
        title="Runtime behavior"
        description="This utility component has no visible UI, so the showcase surfaces its active theme state and Telegram flag."
      >
        <StoryCard title="Bridge status" caption="Mounted once near the shell root.">
          <>
            <TelegramThemeBridge />
            <ThemeStatus />
          </>
        </StoryCard>
      </StorySection>
    </StoryPage>
  ),
};
