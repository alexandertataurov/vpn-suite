import type { Meta, StoryObj } from "@storybook/react";
import { Z_INDEX_TOKENS } from "@/design-system/core/tokens";
import { getTokenCoverage, resolveTokenValue } from "@/design-system/core/tokens/runtime";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TokenTable, UsageExample, ValuePill } from "@/design-system/utils/story-helpers";

const meta = {
  title: "Foundations/Z-Index",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Z-index tokens define the layer contract for shell chrome, overlays, and transient feedback. Use them instead of hardcoded stacking values.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => {
    const zIndexSpecs = [
      { name: "Dropdown", token: Z_INDEX_TOKENS.dropdown, usage: "Menus and select popovers.", value: resolveTokenValue(Z_INDEX_TOKENS.dropdown), preview: <ValuePill value="Dropdown" /> },
      { name: "Overlay", token: Z_INDEX_TOKENS.overlay, usage: "Scrims and blocking backdrops.", value: resolveTokenValue(Z_INDEX_TOKENS.overlay), preview: <ValuePill value="Overlay" tone="neutral" /> },
      { name: "Modal", token: Z_INDEX_TOKENS.modal, usage: "Dialog and sheet content above overlays.", value: resolveTokenValue(Z_INDEX_TOKENS.modal), preview: <ValuePill value="Modal" tone="accent" /> },
      { name: "Toast", token: Z_INDEX_TOKENS.toast, usage: "Temporary feedback layered over active UI.", value: resolveTokenValue(Z_INDEX_TOKENS.toast), preview: <ValuePill value="Toast" tone="success" /> },
      { name: "Header", token: Z_INDEX_TOKENS.header, usage: "Sticky shell header.", value: resolveTokenValue(Z_INDEX_TOKENS.header), preview: <ValuePill value="Header" /> },
      { name: "Nav", token: Z_INDEX_TOKENS.nav, usage: "Persistent bottom navigation.", value: resolveTokenValue(Z_INDEX_TOKENS.nav), preview: <ValuePill value="Nav" /> },
      { name: "Scanline", token: Z_INDEX_TOKENS.scanline, usage: "Reserved top-most decorative or debugging overlay.", value: resolveTokenValue(Z_INDEX_TOKENS.scanline), preview: <ValuePill value="Top" tone="danger" /> },
    ];
    const coverage = getTokenCoverage(Z_INDEX_TOKENS);
    return (
    <StoryPage
      eyebrow="Foundations"
      title="Z-index system"
      summary="Layering bugs are usually logic bugs with visual symptoms. The miniapp uses a fixed stack contract so sticky chrome, dialogs, popovers, and toast feedback do not fight each other."
      stats={[
        { label: "Layer tokens", value: `${coverage.passing} / ${coverage.total}` },
        { label: "Shell layers", value: "2" },
        { label: "Examples", value: "3" },
      ]}
    >
      <StorySection
        title="Token reference"
        description="Each exported z-index token and the layer it owns."
      >
        <TokenTable specs={zIndexSpecs} />
      </StorySection>

      <StorySection
        title="Layer rules"
        description="Z-index should behave like a reserved stack, not a number line developers keep extending."
      >
        <div style={layerRulesStyle}>
          <StoryCard title="Persistent chrome" caption="Header and nav keep the shell readable but never outrank modal content.">
            <div style={layerRuleTextStyle}>Use only the shell tokens for sticky chrome. Do not add local offsets unless the shell itself owns the interaction.</div>
          </StoryCard>
          <StoryCard title="Transient UI" caption="Dropdown, overlay, modal, and toast each own a specific tier.">
            <div style={layerRuleTextStyle}>Pick the nearest semantic layer token. If a new value is needed, it is a foundations change, not a component-local tweak.</div>
          </StoryCard>
        </div>
      </StorySection>

      <StorySection
        title="Layer map"
        description="The stack should read from persistent chrome to transient UI, with no ad hoc values in between."
      >
        <ThreeColumn>
          <StoryCard title="Shell" caption="Header and navigation remain persistent.">
            <LayerStack
              items={[
                { label: "Header", color: "var(--blue-d)" },
                { label: "Nav", color: "var(--green-d)" },
              ]}
            />
          </StoryCard>
          <StoryCard title="Floating UI" caption="Dropdowns, overlays, and modals sit above shell chrome.">
            <LayerStack
              items={[
                { label: "Dropdown", color: "var(--amber-d)" },
                { label: "Overlay", color: "var(--color-border-subtle)" },
                { label: "Modal", color: "var(--red-d)" },
              ]}
            />
          </StoryCard>
          <StoryCard title="Transient feedback" caption="Toast and scanline stay above everything else.">
            <LayerStack
              items={[
                { label: "Toast", color: "var(--green-d)" },
                { label: "Scanline", color: "var(--blue-d)" },
              ]}
            />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp use case"
        description="This modal example shows the intended stack order across shell chrome, scrim, dialog, and toast feedback."
      >
        <UsageExample title="Reissue config confirmation" description="Dialogs must own attention without obscuring system-level feedback such as toast confirmations.">
          <div style={sceneStyle}>
            <div style={headerLayerStyle}>Header</div>
            <div style={navLayerStyle}>Navigation</div>
            <div style={overlayLayerStyle} />
            <div style={modalLayerStyle}>
              <div style={modalTitleStyle}>Reissue profile?</div>
              <div style={modalBodyStyle}>The current device config will stop working immediately.</div>
            </div>
            <div style={toastLayerStyle}>Config reissued</div>
          </div>
        </UsageExample>
      </StorySection>
    </StoryPage>
  );
  },
};

function LayerStack({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div style={{ position: "relative", minHeight: 140 }}>
      {items.map((item, index) => (
        <div
          key={item.label}
          style={{
            position: "absolute",
            inset: `${index * 14}px ${index * 12}px auto auto`,
            width: "calc(100% - 24px)",
            minHeight: 56,
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-3)",
            background: item.color,
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

const sceneStyle = {
  position: "relative" as const,
  minHeight: 260,
  borderRadius: "var(--radius-xl)",
  overflow: "hidden",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
} as const;

const headerLayerStyle = {
  position: "absolute" as const,
  inset: "0 0 auto 0",
  height: 48,
  background: "var(--blue-d)",
  color: "var(--color-text)",
  display: "flex",
  alignItems: "center",
  padding: "0 var(--spacing-4)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
} as const;

const navLayerStyle = {
  position: "absolute" as const,
  inset: "auto 0 0 0",
  height: 56,
  background: "var(--green-d)",
  color: "var(--color-text)",
  display: "flex",
  alignItems: "center",
  padding: "0 var(--spacing-4)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
} as const;

const overlayLayerStyle = {
  position: "absolute" as const,
  inset: 0,
  background: "var(--color-overlay)",
} as const;

const modalLayerStyle = {
  position: "absolute" as const,
  left: "50%",
  top: "54%",
  transform: "translate(-50%, -50%)",
  width: "min(280px, calc(100% - 32px))",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
} as const;

const modalTitleStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h3-size)",
  lineHeight: 1.25,
  fontWeight: 600,
} as const;

const modalBodyStyle = {
  marginTop: "var(--spacing-2)",
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
} as const;

const toastLayerStyle = {
  position: "absolute" as const,
  top: "var(--spacing-3)",
  right: "var(--spacing-3)",
  padding: "var(--spacing-2) var(--spacing-3)",
  borderRadius: "var(--radius-full)",
  background: "var(--green-d)",
  color: "var(--color-success)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  fontWeight: 600,
} as const;

const layerRulesStyle = {
  display: "grid",
  gap: "var(--spacing-4)",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
} as const;

const layerRuleTextStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
} as const;
