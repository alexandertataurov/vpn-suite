import type { Preview } from "@storybook/react";
import React, { Component, type ReactNode } from "react";
import { withPadding, withMeasure } from "./decorators";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../src/shared/theme";
import { ToastContainer } from "../src/design-system";
import { docsTheme, docsThemeLight } from "./theme";
import { StoryFrame } from "./StoryFrame";
import { ThemedDocsContainer } from "./ThemedDocsContainer";

class StorybookErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 24, background: "#1a1a1a", color: "#f87171", fontFamily: "monospace", fontSize: 14 }}>
          <strong>Story error:</strong>
          <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{this.state.err.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { DocsPage } from "./DocsPage";
import {
  Card,
  CardGrid,
  Callout,
  Steps,
  Divider,
  Badge,
  Preview as PreviewFrame,
  CodeBlock,
  PropertiesTable,
  ColorSwatch,
  TokenTable,
  ComponentPreview,
  ComponentDoc,
  VariantGallery,
  PropsTable,
  UsagePanel,
  KeyboardTable,
  ComponentTokenTable,
  RelatedComponents,
  AccessibilitySection,
  ComponentHero,
  UseCaseList,
  TokenReference,
  ChangelogEntry,
} from "./components";
import "../src/tailwind.css";
import "../src/design-system/tokens.css";
import "../src/design-system/base.css";
import "../src/design-system/primitives.css";
import "../src/design-system/typography.css";
import "../src/design-system/utilities.css";
import "../src/design-system/components.css";
import "../src/design-system/table/Table.css";
import "../src/design-system/table/TablePrimitives.css";
import "../src/design-system/data-display/MetricTile.css";
import "../src/design-system/data-display/Alert.css";
import "../src/design-system/feedback/Modal.css";
import "../src/design-system/feedback/Toast.css";
import "../src/design-system/feedback/InlineAlert.css";
import "../src/design-system/feedback/PageError.css";
import "../src/design-system/layout/Card.css";
import "../src/design-system/navigation/Breadcrumb.css";
import "../src/design-system/navigation/CommandBar.css";
import "../src/design-system/navigation/Tabs.css";
import "../src/design-system/navigation/Pagination.css";
import "../src/design-system/navigation/FormActions.css";
import "../src/design-system/layout/Shell.css";
import "../src/design-system/console/Operator.css";
import "../src/design-system/console/Dashboard.css";
import "../src/components/health/HealthStrip.css";
import "../src/design-system/storybook/foundation.css";
import "./docs.css";
import "./toc.css";

const viewports = {
  mobile: { name: "Mobile", styles: { width: "375px", height: "667px" } },
  tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
  desktop: { name: "Desktop", styles: { width: "1280px", height: "800px" } },
  wide: { name: "Wide", styles: { width: "1920px", height: "1080px" } },
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Docs / UI theme",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["dark", "light"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "dark",
  },
  decorators: [
    withPadding,
    (Story, context) => {
      const themeKey = context.globals?.theme === "light" ? "light" : "dark";
      if (typeof document !== "undefined") {
        const el = document.documentElement;
        el.classList.toggle("light", themeKey === "light");
        el.classList.toggle("dark", themeKey === "dark");
        el.setAttribute("data-theme", themeKey);
        el.style.colorScheme = themeKey === "light" ? "light" : "dark";
        try {
          localStorage.setItem("vpn-suite-storybook-theme", themeKey);
        } catch {
          /* ignore */
        }
      }
      return (
        <StorybookErrorBoundary>
          <div style={{ minHeight: "100vh", boxSizing: "border-box" }}>
            <MemoryRouter initialEntries={["/"]}>
              <ThemeProvider themes={["starlink", "orbital", "dark", "dim", "light"]} defaultTheme={themeKey} storageKey="vpn-suite-storybook-theme">
                <StoryFrame>
                  <ToastContainer>
                    {context.parameters?.measure ? withMeasure(Story, context) : <Story />}
                  </ToastContainer>
                </StoryFrame>
              </ThemeProvider>
            </MemoryRouter>
          </div>
        </StorybookErrorBoundary>
      );
    },
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    viewport: { viewports },
    options: {
      storySort: {
        order: [
          "UI",
          [
            "Foundations",
            "Overview",
            "Color",
            "Color System",
            "Typography",
            "Spacing",
            "Elevation",
            "Motion",
            "Iconography",
            ["Icons", "Guidelines"],
            "Grid",
            "Tokens",
            "ZIndex",
            "Composition",
            "Governance",
            ["Theming", "Light-Dark-Dim"],
          ],
          ["Primitives", "Overview", "Layout"],
          [
            "Patterns",
            "Overview",
            "Forms",
            "EmptyStates",
            "LoadingStates",
            ["Placeholder"],
            "ErrorStates",
            "MetricRow",
            "Tables with actions",
            "Confirmation flows",
            "OperatorHeader",
            "OperatorToolbar",
            "HealthStrip",
            "StatusStrip",
            "FreshnessBadge",
            "RowActionsMenu",
            "BulkActionsBar",
            "RelativeTime",
          ],
          [
            "Composites",
            "Overview",
            "HealthBadge",
            "StatusStrip",
            "DataTable",
            "Pagination",
            "SearchInput",
          ],
          "Components",
          "Pages",
        ],
      },
    },
    docs: {
      toc: true,
      tocLevel: 2,
      headingSelector: "h2, h3",
      ignoreSelector: ".docs-ignore",
      canvas: { sourceState: "shown" },
      theme: docsTheme,
      container: ThemedDocsContainer,
      page: DocsPage,
      components: {
        h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props} className="typo-heading-1 text-[var(--color-text-primary)]" />,
        h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props} className="typo-heading-2 text-[var(--color-text-primary)] mt-8 mb-4" />,
        h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h3 {...props} className="typo-heading-3 text-[var(--color-text-primary)] mt-6 mb-3" />,
        p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props} className="text-[var(--color-text-secondary)] text-[length:var(--text-base)] leading-[var(--leading-relaxed)] mb-4" style={{ fontFamily: "var(--font-body)" }} />,
        a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} className="text-[var(--color-text-accent)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-base)]" />,
        code: (props: React.HTMLAttributes<HTMLElement>) => <code {...props} className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--color-elevated)] text-[var(--color-text-accent)]" />,
        pre: (props: React.HTMLAttributes<HTMLPreElement>) => <pre {...props} className="overflow-x-auto my-4 p-4 rounded border border-[var(--color-border-subtle)] bg-[var(--color-base)] font-mono text-sm text-[var(--color-text-primary)]" />,
        table: (props: React.HTMLAttributes<HTMLTableElement>) => <table {...props} className="w-full text-sm border-collapse border border-[var(--color-border-subtle)]" />,
        th: (props: React.HTMLAttributes<HTMLTableCellElement>) => <th {...props} className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)]" />,
        td: (props: React.HTMLAttributes<HTMLTableCellElement>) => <td {...props} className="px-4 py-2 border-b border-[var(--color-border-faint)] text-[var(--color-text-secondary)]" />,
        tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />,
        blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => <blockquote {...props} className="border-l-4 border-[var(--color-accent)] pl-4 py-2 my-4 text-[var(--color-text-secondary)] bg-[var(--color-accent-dim)]" />,
        hr: (props: React.HTMLAttributes<HTMLHRElement>) => <hr {...props} className="my-8 border-0 border-t border-[var(--color-border-subtle)]" />,
        ul: (props: React.HTMLAttributes<HTMLUListElement>) => <ul {...props} className="list-disc pl-6 mb-4 space-y-1 text-[var(--color-text-secondary)]" />,
        li: (props: React.HTMLAttributes<HTMLLIElement>) => <li {...props} className="text-[length:var(--text-base)]" style={{ fontFamily: "var(--font-body)" }} />,
        Card,
        CardGrid,
        Callout,
        Steps,
        Divider,
        Badge,
        Preview: PreviewFrame,
        CodeBlock,
        PropertiesTable,
        ColorSwatch,
        TokenTable,
        ComponentPreview,
        ComponentDoc,
        VariantGallery,
        PropsTable,
        UsagePanel,
        KeyboardTable,
        ComponentTokenTable,
        RelatedComponents,
        AccessibilitySection,
        ComponentHero,
        UseCaseList,
        TokenReference,
        ChangelogEntry,
      },
    },
  },
};

export default preview;
