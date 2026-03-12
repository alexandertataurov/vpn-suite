import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../components";
import { PageHeader } from "../layouts";
import { DataCell, DataGrid, SelectionCard, StatusChip } from "../patterns";
import { LabeledControlRow, FaqDisclosureItem, PageCardSection, PageHeaderBadge, SettingsActionRow, SnapCarousel } from "../recipes";
import { Box, Text } from "../primitives";
import { IconAlertTriangle, IconGlobe } from "../icons";
import { StoryCard, StoryPage, StorySection, TokenTable, TwoColumn, UsageExample, ValuePill } from "./foundations.story-helpers";

const meta = {
  title: "Layouts/Page Recipes",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Recipes combine lower-level design-system pieces into reusable page structures. They should remove repeated page assembly work without hiding the underlying layout and pattern contracts.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const recipeSpecs = [
  { name: "PageHeaderBadge", token: "page-hd-badge", usage: "Compact page-status signal for the header action zone." },
  { name: "PageCardSection", token: "PageSection + MissionCard", usage: "Canonical titled section that wraps content in a mission card." },
  { name: "LabeledControlRow", token: "control-row", usage: "Inline label and control wrapper for compact plan and settings rows." },
  { name: "SettingsActionRow", token: "settings-list-row", usage: "Canonical tappable settings row with icon, summary copy, optional value, and danger treatment." },
  { name: "FaqDisclosureItem", token: "support-faq-item", usage: "Canonical FAQ/disclosure row for support and help surfaces." },
  { name: "SnapCarousel", token: "snap-carousel", usage: "Horizontal overflow rail with scroll-snap behavior for cards and plans." },
];

function RecipeStoryFrame({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: "var(--spacing-4)", maxWidth: 720 }}>{children}</div>;
}

function BadgeTonesExample() {
  return (
    <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap" }}>
      <PageHeaderBadge tone="neutral" label="Neutral" />
      <PageHeaderBadge tone="info" label="Info" />
      <PageHeaderBadge tone="success" label="Healthy" pulse />
      <PageHeaderBadge tone="warning" label="Expiring" />
      <PageHeaderBadge tone="danger" label="Blocked" />
    </div>
  );
}

function PlanRailExample() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  return (
    <RecipeStoryFrame>
      <LabeledControlRow label={<Text size="meta">Billing cycle</Text>}>
        <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button variant={selectedPlan === "monthly" ? "primary" : "secondary"} size="sm" onClick={() => setSelectedPlan("monthly")}>
            Monthly
          </Button>
          <Button variant={selectedPlan === "yearly" ? "primary" : "secondary"} size="sm" onClick={() => setSelectedPlan("yearly")}>
            Yearly
          </Button>
          <Button variant={selectedPlan === "lifetime" ? "primary" : "secondary"} size="sm" onClick={() => setSelectedPlan("lifetime")}>
            Lifetime
          </Button>
        </div>
      </LabeledControlRow>

      <SnapCarousel>
        <div style={carouselCardStyle}>
          <SelectionCard
            title="Monthly"
            subtitle="$12 per month"
            selected={selectedPlan === "monthly"}
            onSelect={() => setSelectedPlan("monthly")}
            actionLabel="Choose monthly"
          />
        </div>
        <div style={carouselCardStyle}>
          <SelectionCard
            title="Yearly"
            subtitle="$99 per year"
            selected={selectedPlan === "yearly"}
            onSelect={() => setSelectedPlan("yearly")}
            actionLabel="Choose yearly"
            metadata={
              <DataGrid columns={1} layout="1xcol">
                <DataCell label="Savings" value="31%" valueTone="green" />
              </DataGrid>
            }
          />
        </div>
        <div style={carouselCardStyle}>
          <SelectionCard
            title="Lifetime"
            subtitle="$219 once"
            selected={selectedPlan === "lifetime"}
            onSelect={() => setSelectedPlan("lifetime")}
            actionLabel="Choose lifetime"
            metadata={
              <DataGrid columns={1} layout="1xcol">
                <DataCell label="Status" value={<StatusChip variant="info">New</StatusChip>} />
              </DataGrid>
            }
          />
        </div>
      </SnapCarousel>
    </RecipeStoryFrame>
  );
}

function SettingsActionRowsExample() {
  return (
    <div className="settings-page" style={{ maxWidth: 420 }}>
      <div className="settings-list-card module-card">
        <SettingsActionRow
          icon={<IconGlobe size={20} strokeWidth={1.6} />}
          title="Language"
          description="Use Telegram preference by default, or override it here."
          value="Automatic"
          onClick={() => undefined}
        />
        <SettingsActionRow
          icon={<IconAlertTriangle size={20} strokeWidth={1.6} />}
          title="Delete account"
          description="Permanently remove account access and saved settings."
          danger
          onClick={() => undefined}
        />
      </div>
    </div>
  );
}

function FaqDisclosureExample() {
  const [openItem, setOpenItem] = useState<number | null>(0);

  return (
    <div className="support-page" style={{ maxWidth: 420 }}>
      <ul className="support-faq-list" role="list">
        {[
          {
            title: "Why does the VPN show connected but not route traffic?",
            body: "Open Devices and confirm the latest config has handshaked. If the current device is still pending, reissue the config and reconnect.",
          },
          {
            title: "How do I restore access after a payment issue?",
            body: "Use Restore Access from Support to refresh billing state, then return to Plan if you need to change or renew the subscription.",
          },
        ].map((item, index) => (
          <FaqDisclosureItem
            key={item.title}
            title={item.title}
            body={item.body}
            isOpen={openItem === index}
            onToggle={() => setOpenItem((current) => (current === index ? null : index))}
          />
        ))}
      </ul>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <StoryPage
      eyebrow="Recipes"
      title="Page assembly recipes"
      summary="These helpers package the most repeated page-level compositions in the miniapp: status badges, titled card sections, compact control rows, and snap rails."
      stats={[
        { label: "Recipes", value: String(recipeSpecs.length) },
        { label: "Primary role", value: "Page assembly" },
        { label: "Surface", value: "Header + section + rail" },
      ]}
    >
      <StorySection
        title="Recipe inventory"
        description="Use recipes when the same multi-component assembly would otherwise be repeated across pages with only content changes."
      >
        <TokenTable
          specs={recipeSpecs.map((spec) => ({
            ...spec,
            preview: <ValuePill value={spec.name} tone="accent" />,
          }))}
        />
      </StorySection>
    </StoryPage>
  ),
};

export const RecipeAtlas: Story = {
  tags: ["chromatic"],
  parameters: {
    chromatic: {
      viewports: [390, 768, 1280],
    },
  },
  render: () => (
    <StoryPage
      eyebrow="Recipes"
      title="Recipe atlas"
      summary="Recipe stories document how these helpers should appear in context, not just as isolated fragments."
      stats={[
        { label: "Header signals", value: "5 tones" },
        { label: "Card recipe", value: "PageCardSection" },
        { label: "Scrollable rail", value: "SnapCarousel" },
      ]}
    >
      <StorySection
        title="Header and section recipes"
        description="PageHeaderBadge and PageCardSection should carry high-signal status and section framing without adding duplicate chrome."
      >
        <TwoColumn>
          <StoryCard title="PageHeaderBadge" caption="Badges stay compact enough for the page header action slot and can pulse for live state.">
            <RecipeStoryFrame>
              <PageHeader title="Account security" subtitle="Recovery and access posture" action={<PageHeaderBadge tone="success" label="Protected" pulse />} />
              <BadgeTonesExample />
            </RecipeStoryFrame>
          </StoryCard>
          <StoryCard title="PageCardSection" caption="This recipe combines the section header contract with a mission-card content surface.">
            <RecipeStoryFrame>
              <PageCardSection
                title="Connection summary"
                description="Shared page recipe for compact operational summaries."
                action={<PageHeaderBadge tone="info" label="Stable route" />}
              >
                <Box style={{ display: "grid", gap: "var(--spacing-3)" }}>
                  <DataGrid columns={2}>
                    <DataCell label="Server" value="Amsterdam · NL-3" />
                    <DataCell label="Latency" value="41 ms" valueTone="green" cellType="latency" />
                    <DataCell label="Plan" value="Business annual" cellType="plan" />
                    <DataCell label="Status" value={<StatusChip variant="active">Healthy</StatusChip>} cellType="status" />
                  </DataGrid>
                </Box>
              </PageCardSection>
            </RecipeStoryFrame>
          </StoryCard>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Control and rail recipes"
        description="LabeledControlRow and SnapCarousel reduce repeated wiring in plan, billing, and selection flows."
      >
        <UsageExample title="Control row + snap rail" description="The label row owns the dense heading/control alignment while the rail owns horizontal overflow and scroll-snap.">
          <PlanRailExample />
        </UsageExample>
      </StorySection>

      <StorySection
        title="Route-specific recipes"
        description="These recipes were extracted from page-local forks so Storybook can own the contract for support disclosures and settings action rows."
      >
        <TwoColumn>
          <StoryCard title="SettingsActionRow" caption="Settings rows keep icon treatment, value alignment, and destructive styling consistent across account surfaces.">
            <SettingsActionRowsExample />
          </StoryCard>
          <StoryCard title="FaqDisclosureItem" caption="FAQ disclosures carry the support-page list, trigger, and panel structure without leaving ownership in the route component.">
            <FaqDisclosureExample />
          </StoryCard>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  ),
};

const carouselCardStyle = {
  minWidth: "min(280px, 82vw)",
  scrollSnapAlign: "start" as const,
};
