import { Button, Card, PanelHeader, PanelBody, PageError, PrimitiveBadge, VisuallyHidden, PrimitiveStack, Inline, PrimitiveDivider, Spinner, ProgressBar, InlineAlert, DropdownMenu, Text, Heading, Label, HelperText, Stat, CodeText } from "@/design-system";
import { EmptyState } from "@/design-system";
import { useTheme } from "@vpn-suite/shared/theme";
import { Breadcrumb } from "@/components";
import { SectionHeader } from "@/components";
import { DashboardPage } from "../templates/DashboardPage";

const colorTokens = [
  { name: "--color-background-primary", swatchClass: "styleguide-swatch-color-bg" },
  { name: "--surface-base", swatchClass: "styleguide-swatch-surface-base" },
  { name: "--surface-raised", swatchClass: "styleguide-swatch-surface-raised" },
  { name: "--color-text-primary", swatchClass: "styleguide-swatch-color-text" },
  { name: "--color-text-secondary", swatchClass: "styleguide-swatch-color-text-muted" },
  { name: "--accent-primary", swatchClass: "styleguide-swatch-accent-primary" },
  { name: "--color-border-default", swatchClass: "styleguide-swatch-color-border" },
  { name: "--border-subtle", swatchClass: "styleguide-swatch-border-subtle" },
  { name: "--color-success", swatchClass: "styleguide-swatch-color-success" },
  { name: "--color-warning", swatchClass: "styleguide-swatch-color-warning" },
  { name: "--color-error", swatchClass: "styleguide-swatch-color-error" },
];

const typeTokens = [
  { token: "text-h1", sampleClass: "styleguide-type-h1" },
  { token: "text-h2", sampleClass: "styleguide-type-h2" },
  { token: "text-h3", sampleClass: "styleguide-type-h3" },
  { token: "text-h4", sampleClass: "styleguide-type-h4" },
  { token: "text-body-lg", sampleClass: "styleguide-type-body-lg" },
  { token: "text-body", sampleClass: "styleguide-type-body" },
  { token: "text-body-sm", sampleClass: "styleguide-type-body-sm" },
  { token: "text-caption", sampleClass: "styleguide-type-caption" },
];

const spaceTokens = ["spacing-1", "spacing-2", "spacing-3", "spacing-4", "spacing-6", "spacing-8", "spacing-12"];

export function StyleguidePage() {
  const { theme } = useTheme();

  return (
    <DashboardPage
      className="dashboard styleguide"
      title="STYLEGUIDE"
      description={`Token reference and live examples. Theme: ${theme}.`}
    >
      <Heading level={1}>Design System Style Guide</Heading>
      <Text variant="muted" as="p">
        Token reference and live examples. Theme: <strong>{theme}</strong>. Press <kbd>⌘K</kbd> (Ctrl+K) for command palette.
      </Text>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Design system aliases</Heading>
        <Text variant="muted" as="p">Spec names: Card = Panel, Alert = InlineAlert, StatCard = Stat, DataTable = Table, ConfirmDialog = ConfirmDanger. Layout: PageSection = Section, FormSection = Section, FormActions (save/cancel row).</Text>
      </section>

      <section className="dashboard-section" aria-labelledby="styleguide-tokens-doc">
        <Heading level={2} id="styleguide-tokens-doc" className="styleguide-section-title">Design tokens (source of truth)</Heading>
        <Text variant="muted" as="p">
          Single source: <code>shared/theme/tokens.css</code>. Consumed by admin and shared via <code>@vpn-suite/shared/global.css</code>.
          Theme is set via <code>data-theme</code> on <code>&lt;html&gt;</code> (dark | light).
        </Text>
        <ul className="styleguide-token-inline styleguide-token-list">
          <li><strong>Spacing:</strong> <code>--spacing-0</code> … <code>--spacing-64</code>, <code>--spacing-sm/md/lg</code>, <code>--spacing-component-padding</code></li>
          <li><strong>Typography:</strong> <code>--font-sans</code>, <code>--font-size-*</code>, <code>--text-h1</code> … <code>--text-caption</code>, <code>--line-height-*</code></li>
          <li><strong>Radius:</strong> <code>--radius-sm</code> … <code>--radius-full</code>, <code>--radius-card</code>, <code>--radius-button</code></li>
          <li><strong>Shadows:</strong> <code>--shadow-xs</code> … <code>--shadow-2xl</code>, <code>--shadow-focus</code></li>
          <li><strong>Semantic colors:</strong> <code>--color-background-primary</code>, <code>--color-text-primary</code>, <code>--color-interactive-default</code>, <code>--color-success</code>, <code>--color-warning</code>, <code>--color-error</code></li>
          <li><strong>Surfaces:</strong> <code>--surface-base</code>, <code>--surface-raised</code>, <code>--border-subtle</code></li>
        </ul>
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Color swatches</Heading>
        <div className="styleguide-color-grid">
          {colorTokens.map(({ name, swatchClass }) => (
            <div key={name}>
              <div className={`styleguide-swatch ${swatchClass}`} aria-hidden />
              <code className="styleguide-token-label">{name}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Spacing scale</Heading>
        <code className="styleguide-token-inline">
          {spaceTokens.map((t) => `--${t}`).join(" · ")}
        </code>
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Type scale</Heading>
        <div className="styleguide-type-list">
          {typeTokens.map(({ token, sampleClass }) => (
            <div key={token}>
              <code className="styleguide-token-label">--{token}</code>
              <div className={sampleClass}>The quick brown fox jumps over the lazy dog.</div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Typography primitives</Heading>
        <Text variant="muted" as="p">Text, Heading, Label, HelperText, Stat, CodeText. Use these instead of raw text-* classes.</Text>
        <PrimitiveStack gap="4">
          <div>
            <code className="styleguide-token-label">Text</code>
            <div className="styleguide-row-tight styleguide-stack-tight">
              <Text variant="body">Body text</Text>
              <Text variant="muted">Muted text</Text>
              <Text variant="caption">Caption</Text>
              <Text variant="code">Code inline</Text>
              <Text variant="danger">Danger text</Text>
            </div>
          </div>
          <div>
            <code className="styleguide-token-label">Heading</code>
            <div className="styleguide-col-gap-2">
              <Heading level={1}>Heading 1</Heading>
              <Heading level={2}>Heading 2</Heading>
              <Heading level={3}>Heading 3</Heading>
              <Heading level={4}>Heading 4</Heading>
            </div>
          </div>
          <div>
            <code className="styleguide-token-label">Label, HelperText</code>
            <div className="styleguide-col-gap-1">
              <Label htmlFor="sg-input">Field label</Label>
              <Label required>Required label</Label>
              <HelperText variant="hint">Hint text under input</HelperText>
              <HelperText variant="error" role="alert">Error message</HelperText>
            </div>
          </div>
          <div>
            <code className="styleguide-token-label">Stat</code>
            <Stat label="Active peers" value={42} delta={{ value: "+12%", direction: "up" }} />
          </div>
          <div>
            <code className="styleguide-token-label">CodeText</code>
            <div className="styleguide-row-tight styleguide-stack-tight">
              <CodeText>inline code</CodeText>
              <CodeText block>{`block code\n  line 2`}</CodeText>
            </div>
          </div>
        </PrimitiveStack>
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Buttons</Heading>
        <div className="styleguide-row">
          <Button variant="primary" size="sm">Primary sm</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="primary" size="lg">Primary lg</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Card with PanelHeader / PanelBody</Heading>
        <Card variant="raised">
          <PanelHeader title="Panel title" actions={<Button variant="ghost" size="sm">Action</Button>} />
          <PanelBody>
            <p className="m-0">Panel body. Use <code>--spacing-6</code> padding, <code>--border-subtle</code> for header border.</p>
          </PanelBody>
        </Card>
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">SectionHeader</Heading>
        <Text variant="muted" as="p">Section title + optional description + right-side controls. Uses Heading and Text primitives.</Text>
        <SectionHeader
          title="Section title"
          description="Optional description for the section."
          actions={<Button variant="ghost" size="sm">Action</Button>}
        />
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Breadcrumb</Heading>
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Section", to: "/servers" }, { label: "Current page" }]} />
      </section>

      <section className="dashboard-section" aria-labelledby="styleguide-layout-a11y">
        <Heading level={2} id="styleguide-layout-a11y" className="styleguide-section-title">Layout and a11y primitives</Heading>
        <Text variant="muted" as="p">PrimitiveStack, Inline, PrimitiveDivider use token spacing. VisuallyHidden is for screen-reader-only text (e.g. icon-only button labels).</Text>
        <PrimitiveStack gap="2" className="styleguide-row-tight">
          <PrimitiveStack direction="horizontal" gap="2">
            <span>A</span>
            <span>B</span>
            <span>C</span>
          </PrimitiveStack>
          <Inline gap="2" wrap>
            <span>Inline 1</span>
            <span>Inline 2</span>
            <span>Inline 3</span>
          </Inline>
          <PrimitiveDivider orientation="horizontal" />
          <div className="styleguide-inline-gap-2">
            <PrimitiveDivider orientation="vertical" />
            <span>With vertical divider</span>
          </div>
          <Button variant="ghost" size="sm" aria-label="Copy">
            <span aria-hidden>📋</span>
            <VisuallyHidden>Copy</VisuallyHidden>
          </Button>
        </PrimitiveStack>
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Empty state</Heading>
        <EmptyState
          title="No data yet"
          description="Description of what will appear here."
          actions={<Button variant="primary" size="sm">Primary action</Button>}
        />
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Page error</Heading>
        <PageError title="Something went wrong" message="Optional error message" onRetry={() => {}} />
      </section>

      <section className="dashboard-section" aria-labelledby="styleguide-feedback">
        <Heading level={2} id="styleguide-feedback" className="styleguide-section-title">Feedback primitives</Heading>
        <Text variant="muted" as="p">Spinner, ProgressBar, InlineAlert. Use tokens for colors.</Text>
        <PrimitiveStack gap="4">
          <Inline gap="2">
            <Spinner aria-label="Loading small" />
            <Spinner aria-label="Loading" />
          </Inline>
          <div className="styleguide-progress-wrap">
            <ProgressBar value={0} label="Progress 0%" />
            <ProgressBar value={50} label="Progress 50%" className="styleguide-progress-item" />
            <ProgressBar value={100} label="Progress 100%" className="styleguide-progress-item" />
          </div>
          <PrimitiveStack gap="2">
            <InlineAlert variant="info" title="Info" message="Informational message." />
            <InlineAlert variant="warning" title="Warning" message="Something to watch." />
            <InlineAlert variant="error" title="Error" message="Something went wrong." />
          </PrimitiveStack>
        </PrimitiveStack>
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Badges</Heading>
        <div className="styleguide-row-tight">
          <PrimitiveBadge variant="success">Success</PrimitiveBadge>
          <PrimitiveBadge variant="warning">Warning</PrimitiveBadge>
          <PrimitiveBadge variant="danger">Error</PrimitiveBadge>
          <PrimitiveBadge variant="info">Info</PrimitiveBadge>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="styleguide-dropdown">
        <Heading level={2} id="styleguide-dropdown" className="styleguide-section-title">DropdownMenu</Heading>
        <Text variant="muted" as="p">Trigger + menu with Escape to close, Arrow keys to move.</Text>
        <DropdownMenu
          align="start"
          trigger={<Button variant="secondary" size="sm">Actions</Button>}
          items={[
            { id: "a", label: "Edit", onClick: () => {} },
            { id: "b", label: "Duplicate", onClick: () => {} },
            { id: "c", label: "Delete", onClick: () => {}, danger: true },
          ]}
        />
      </section>

      <section className="dashboard-section" aria-labelledby="styleguide-dropdown">
        <Heading level={2} id="styleguide-dropdown" className="styleguide-section-title">DropdownMenu</Heading>
        <Text variant="muted" as="p">Trigger + menu; Escape to close, Arrow keys to move.</Text>
        <DropdownMenu
          align="start"
          trigger={<Button variant="secondary" size="sm">Actions</Button>}
          items={[
            { id: "a", label: "Edit", onClick: () => {} },
            { id: "b", label: "Duplicate", onClick: () => {} },
            { id: "c", label: "Delete", onClick: () => {}, danger: true },
          ]}
        />
      </section>

      <section className="dashboard-section">
        <Heading level={2} className="styleguide-section-title">Focus ring</Heading>
        <Text variant="muted" as="p">Use Tab to focus; focus uses --shadow-focus.</Text>
        <Button variant="primary">Focus me (Tab)</Button>
      </section>
    </DashboardPage>
  );
}
