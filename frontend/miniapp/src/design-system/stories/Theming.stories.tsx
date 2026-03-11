import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { Button, InlineAlert } from "../components";
import { HomeDynamicBlock, HomeHeroPanel, HomeQuickActionGrid, StatusChip } from "../patterns";
import { Panel, Stack, Text } from "../primitives";
import { PageHeader } from "../layouts/PageHeader";
import { PageScaffold } from "../layouts/PageScaffold";
import { PageSection } from "../layouts/PageSection";
import { PageHeaderBadge } from "../recipes";
import { useTheme } from "../theme";
import { getTokenCoverage } from "../tokens/runtime";
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS } from "../tokens";
import { StoryCard, StoryPage, StorySection, TwoColumn, UsageExample, ValuePill } from "./foundations.story-helpers";
import { buildDynamicProps, buildHeroProps, buildQuickActionProps, homeStoryDefaults } from "./home.story-helpers";

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
            <div style={checkListStyle}>
              <ValuePill value="Theme toolbar updates root" tone="success" />
              <ValuePill value="Environment parity passes" tone="accent" />
              <ValuePill value="Color semantics stay intact" tone="warning" />
              <ValuePill value="Typography remains token-driven" tone="neutral" />
            </div>
          </StoryCard>
          <StoryCard title="Reference trail" caption="Theme review should connect out to the deeper foundations pages, not stop here.">
            <div style={themeRuleTextStyle}>
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
                  <Text variant="body-sm" style={{ margin: 0, color: "var(--color-text-muted)" }}>
                    Secondary text, borders, and raised surfaces are driven by semantic theme variables.
                  </Text>
                  <Button variant="secondary">Secondary action</Button>
                </Stack>
              </Panel>
            </Stack>
          </StoryCard>

          <StoryCard title="Layouts" caption="Page scaffolds and section wrappers should shift with the same surface and border rules as components.">
            <PageScaffold>
              <PageHeader
                title="Appearance"
                subtitle="Miniapp shell"
                action={<PageHeaderBadge tone="info" label="Theme aware" />}
                trailingAction={null}
              />
              <PageSection title="Display" description="Layout containers now use the same semantic tokens as the shared component layer.">
                <Panel padding="md">
                  <Stack gap="2">
                    <Text variant="meta" as="p" style={{ margin: 0, color: "var(--color-text-tertiary)" }}>
                      Surface
                    </Text>
                    <Text variant="body-sm" as="p" style={{ margin: 0 }}>
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
        description="Home patterns are rendered with routing enabled so token changes can be checked against real action-card and hero states."
      >
        <StoryCard title="Home stack" caption="Hero, dynamic block, and quick actions all share the same theme variables.">
          <MemoryRouter initialEntries={["/"]}>
            <div className="home-page" style={{ width: "100%", maxWidth: "420px", display: "grid", gap: "var(--spacing-4)" }}>
              <HomeHeroPanel {...buildHeroProps(homeStoryDefaults)} />
              <HomeDynamicBlock {...buildDynamicProps(homeStoryDefaults)} />
              <HomeQuickActionGrid {...buildQuickActionProps(homeStoryDefaults)} />
            </div>
          </MemoryRouter>
        </StoryCard>
      </StorySection>
    </StoryPage>
  );
  },
};

const checkListStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
} as const;

const themeRuleTextStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
} as const;
