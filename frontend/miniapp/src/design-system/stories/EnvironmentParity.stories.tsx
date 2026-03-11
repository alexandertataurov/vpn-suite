import type { Meta, StoryObj } from "@storybook/react";
import { StoryCard, StoryPage, StorySection, ValuePill } from "./foundations.story-helpers";

const meta = {
  title: "Foundations/Telegram Environment",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Checks whether Storybook is loading the same essential environment primitives as the production miniapp shell.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Parity: Story = {
  render: () => {
    const checks = [
      {
        label: "Viewport meta tag present",
        pass: document.querySelector('meta[name="viewport"]') != null,
      },
      {
        label: "Font: Space Grotesk loaded",
        pass: typeof document.fonts?.check === "function" ? document.fonts.check("16px Space Grotesk") : false,
      },
      {
        label: "Font: IBM Plex Mono loaded",
        pass: typeof document.fonts?.check === "function" ? document.fonts.check("16px IBM Plex Mono") : false,
      },
      {
        label: "--color-accent resolves",
        pass: getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim().length > 0,
      },
      {
        label: "data-theme present on root",
        pass: document.documentElement.hasAttribute("data-theme"),
      },
      {
        label: "data-tg bootstrap flag present",
        pass: document.documentElement.hasAttribute("data-tg"),
      },
    ];

    return (
      <StoryPage
        eyebrow="Foundations"
        title="Environment parity"
        summary="Storybook should mirror the production shell closely enough that typography, theme tokens, and responsive behavior are trustworthy during review."
        stats={[
          { label: "Checks", value: String(checks.length) },
          { label: "Passing", value: String(checks.filter((check) => check.pass).length) },
          { label: "Failing", value: String(checks.filter((check) => !check.pass).length) },
        ]}
      >
        <StorySection
          title="Parity checklist"
          description="Any failed item here means Storybook may be rendering a subtly different environment from the app entrypoint."
        >
          <StoryCard title="Preview root" caption="Use this before trusting visual review results.">
            <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
              {checks.map((check) => (
                <div
                  key={check.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--spacing-3)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--typo-body-size)" }}>{check.label}</span>
                  <ValuePill value={check.pass ? "Pass" : "Fail"} tone={check.pass ? "success" : "danger"} />
                </div>
              ))}
            </div>
          </StoryCard>
        </StorySection>
      </StoryPage>
    );
  },
};
