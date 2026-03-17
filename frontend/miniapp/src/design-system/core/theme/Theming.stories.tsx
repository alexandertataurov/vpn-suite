import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import "../../styles/layout-story.css";
import { Button, InlineAlert } from "@/design-system/components";
import { IconShield } from "@/design-system/icons";
import { ActionCard, StatusChip } from "@/design-system/compositions/patterns";
import { Panel, Stack, Text } from "@/design-system/core/primitives";
import { PageScaffold } from "@/design-system/compositions/layouts/PageScaffold";
import { PageSection } from "@/design-system/compositions/layouts/PageSection";
import { ModernHeader, ModernHeroCard } from "@/design-system/compositions/recipes";
import { useTheme } from "@/design-system/core/theme";
import { getTokenCoverage } from "@/design-system/core/tokens/runtime";
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS } from "@/design-system/core/tokens";
import { StoryCard, StoryPage, StorySection, TwoColumn, UsageExample, ValuePill } from "@/design-system/utils/story-helpers";

const meta = {
  title: "Foundations/Tokens",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Theme contract for the miniapp design system. Use the Storybook toolbar to switch between consumer dark and consumer light and verify that semantic tokens propagate through primitives, layouts, components, and patterns.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function ThemeBadge() {
  const { theme } = useTheme();
  return <ValuePill value={theme} tone={theme === "consumer-light" ? "warning" : "accent"} />;
}

export const Overview: Story = {
  render: () => {
    const colorCoverage = getTokenCoverage(COLOR_TOKENS);
    const typographyCoverage = getTokenCoverage(TYPOGRAPHY_TOKENS);
    return (
    <StoryPage
      eyebrow="Foundations"
      title="Theming"
      summary="The miniapp now reads a single semantic theme layer across shared controls, page layouts, and pattern surfaces. Toggle the Storybook theme toolbar to verify the same stories under both consumer themes."
      stats={[
        { label: "Themes", value: "2" },
        { label: "Color contract", value: `${colorCoverage.passing} / ${colorCoverage.total}` },
        { label: "Type contract", value: `${typographyCoverage.passing} / ${typographyCoverage.total}` },
        { label: "Switching", value: "toolbar" },
      ]}
    >
      <StorySection
        title="Global control"
        description="Theme selection is now a Storybook global so the entire catalog can be reviewed without per-story setup."
      >
        <UsageExample title="Active theme" description="Changing the toolbar updates the provider, document theme, and semantic token surface together.">
          <ThemeBadge />
        </UsageExample>
      </StorySection>

      <StorySection
        title="Theme review checklist"
        description="A theme pass should verify token resolution, shell parity, and state semantics together. Do not review isolated components in a vacuum."
      >
        <TwoColumn>
          <StoryCard title="Required checks" caption="Run these each time semantic theme variables or root setup changes.">
            <div className="story-checklist">
              <ValuePill value="Theme toolbar updates root" tone="success" />
              <ValuePill value="Environment parity passes" tone="accent" />
              <ValuePill value="Color semantics stay intact" tone="warning" />
              <ValuePill value="Typography remains token-driven" tone="neutral" />
            </div>
          </StoryCard>
          <StoryCard title="Reference trail" caption="Theme review should connect out to the deeper foundations pages, not stop here.">
            <div className="story-theme-rule-text">
              Check Environment for preview-root parity, Color for semantic rules, Typography for production usage, and the foundations changelog when tokens changed intentionally.
            </div>
          </StoryCard>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Cross-layer samples"
        description="These examples cover the main design-system layers that must stay visually coherent when the theme changes."
      >
        <TwoColumn>
          <StoryCard title="Components + primitives" caption="Shared surfaces, controls, status badges, and copy all inherit semantic tokens.">
            <Stack gap="3">
              <InlineAlert
                variant="info"
                title="Theme-aware feedback"
                message="Shared alert and control styles now avoid hardcoded dark-mode alpha values."
                actions={<Button size="sm">Review tokens</Button>}
              />
              <Panel padding="md">
                <Stack gap="2">
                  <StatusChip variant="active">Connected</StatusChip>
                  <Text variant="body-sm" className="story-text-muted">
                    Secondary text, borders, and raised surfaces are driven by semantic theme variables.
                  </Text>
                  <Button variant="secondary">Secondary action</Button>
                </Stack>
              </Panel>
            </Stack>
          </StoryCard>

          <StoryCard title="Layouts" caption="Page scaffolds and section wrappers should shift with the same surface and border rules as components.">
            <PageScaffold>
              <ModernHeader
                title="Appearance"
                subtitle="Miniapp shell theme review"
                showSettings={false}
              />
              <PageSection title="Display" description="Layout containers now use the same semantic tokens as the shared component layer.">
                <Panel padding="md">
                  <Stack gap="2">
                    <Text variant="meta" as="p" className="story-text-tertiary">
                      Surface
                    </Text>
                    <Text variant="body-sm" as="p" className="story-text-reset">
                      Headers, cards, and sections should stay balanced in both consumer themes.
                    </Text>
                  </Stack>
                </Panel>
              </PageSection>
            </PageScaffold>
          </StoryCard>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Pattern verification"
        description="Hero and action cards share the same theme variables. Verify token propagation across surfaces."
      >
        <StoryCard title="Home stack" caption="ModernHeroCard and ActionCard use semantic tokens from the active theme.">
          <MemoryRouter initialEntries={["/"]}>
            <div className="home-page story-home-stack">
              <ModernHeroCard
                status="active"
                icon={<IconShield size={36} strokeWidth={3} />}
                title="Protected"
                description="Traffic is protected through the fastest healthy route."
                actions={<Button variant="primary" size="lg">Connect</Button>}
              />
              <div className="modern-action-grid">
                <ActionCard label="Devices" value="2 / 5" onClick={() => {}} />
                <ActionCard label="Plan" value="Renews in 14 days" onClick={() => {}} />
              </div>
            </div>
          </MemoryRouter>
        </StoryCard>
      </StorySection>
    </StoryPage>
  );
  },
};
