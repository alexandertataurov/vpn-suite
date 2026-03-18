import React, { useEffect, useMemo, useState } from "react";
import { Description, Canvas, DocsPage as StorybookDocsPage } from "@storybook/blocks";
import { PrimitiveDivider, Tabs, Button } from "./design-system-compat";
import { ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DOCS_EDIT_BASE_URL, DEFAULT_DOCS_EDIT_PATH } from "./docsConfig";
import { ComponentHero } from "./components/docs/ComponentHero";
import { PropsTable } from "./components/docs/PropsTable";
import { UsagePanel } from "./components/docs/UsagePanel";
import { StartHereBlock } from "./components/docs/StartHereBlock";
import { WhenToUseBlock } from "./components/docs/WhenToUseBlock";
import { KnownLimitationsBlock } from "./components/docs/KnownLimitationsBlock";
import { RecipeBlock } from "./components/docs/RecipeBlock";
import { RelatedComponents } from "./components/docs/RelatedComponents";
import { UseCaseList } from "./components/docs/UseCaseList";
import { AccessibilitySection } from "./components/docs/AccessibilitySection";
import type { PropRow } from "./components/docs/PropsTable";
import { argTypesToPropRows } from "./utils/argTypesToPropRows";
import type { KeyboardRow } from "./components/docs/KeyboardTable";
import { useTOC } from "./components/docs/useTOC";
import { TableOfContents } from "./components/docs/TableOfContents";
import { MobileTOC } from "./components/docs/MobileTOC";

type DocsPageLayoutProps = React.ComponentProps<typeof StorybookDocsPage>;

function getComponentName(title: string): string {
  const parts = title?.split("/") ?? [];
  return parts[parts.length - 1] ?? "Docs";
}

export function DocsPage(props: DocsPageLayoutProps) {
  const { context } = props;
  const ctx = context as { id?: string; title?: string; parameters?: Record<string, unknown> };
  const title = ctx?.title ?? "";
  const params = ctx?.parameters ?? {};
  const docsParams = (params.docs as Record<string, unknown>) ?? {};
  const hero = (docsParams.hero as Record<string, unknown>) ?? {};
  const componentName = getComponentName(title);
  const description = typeof docsParams.description === "object" && docsParams.description !== null && "component" in docsParams.description
    ? String((docsParams.description as { component?: string }).component ?? "").split("\n\n")[0]
    : "";
  const status = (hero.status as string) ?? "stable";
  const version = hero.version as string | undefined;
  const category = hero.category as string | undefined;
  const figma = hero.figma as string | undefined;
  const github = hero.github as string | undefined;
  const importPath = hero.importPath as string | undefined;
  const prev = docsParams.prev as { label: string; href: string } | undefined;
  const next = docsParams.next as { label: string; href: string } | undefined;
  const lastUpdated = docsParams.lastUpdated as string | undefined;
  const editPath = docsParams.editPath as string | undefined;
  const propsTableRows =
    (docsParams.propsTable as { rows?: PropRow[] })?.rows ??
    argTypesToPropRows(params.argTypes as Record<string, unknown> | undefined);
  const usageItems = docsParams.usage as { doItems?: { label: string; node: React.ReactNode; explanation?: string }[]; dontItems?: { label: string; node: React.ReactNode; explanation?: string }[] } | undefined;
  const useCases = docsParams.useCases as { useCases?: { title: string; description: string }[]; antiPatterns?: { title: string; description: string }[] } | undefined;
  const a11y = docsParams.accessibility as {
    keyboardRows?: KeyboardRow[];
    ariaRoles?: { role: string; description: string }[];
    screenReaderNotes?: React.ReactNode;
    contrastRatios?: { label: string; ratio: string; pass: boolean }[];
  } | undefined;
  const startHere = docsParams.startHere as string | React.ReactNode | undefined;
  const whenToUse = docsParams.whenToUse as string[] | undefined;
  const whenNotToUse = docsParams.whenNotToUse as string[] | undefined;
  const limitations = docsParams.limitations as string[] | undefined;
  const recipes = docsParams.recipes as { title: string; code: string; description?: string; language?: string }[] | undefined;
  const related = docsParams.related as { label: string; href: string; description?: string }[] | undefined;

  const [activeTab, setActiveTab] = useState("overview");

  const { headings, activeId, scrollToSection } = useTOC("#docs-tabpanel-overview");

  const headingCount = useMemo(() => {
    const stack = [...headings];
    let count = 0;
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      count += 1;
      if (current.children.length > 0) {
        stack.push(...current.children);
      }
    }
    return count;
  }, [headings]);

  const hasTOC = activeTab === "overview" && headingCount >= 2;

  const editUrl = editPath
    ? `${DOCS_EDIT_BASE_URL}/${String(editPath).replace(/^\//, "")}`
    : `${DOCS_EDIT_BASE_URL}/${DEFAULT_DOCS_EDIT_PATH}`;

  const tabItems = [
    { id: "overview", label: "Overview" },
    { id: "props", label: "Props" },
    { id: "usage", label: "Usage" },
    { id: "accessibility", label: "Accessibility" },
  ];

  return (
    <div className="docs-custom-page">
      <ComponentHero
        name={componentName}
        description={description || "Component documentation."}
        status={status as "stable" | "beta" | "deprecated" | "new"}
        version={version}
        category={category}
        figma={figma}
        github={github}
        importPath={importPath}
      />

      <div className={`docs-layout ${hasTOC ? "docs-layout--with-toc" : "docs-layout--no-toc"}`}>
        <div className="docs-layout__main">
          <Tabs
            items={tabItems}
            value={activeTab}
            onChange={setActiveTab}
            ariaLabel="Documentation sections"
            idPrefix="docs"
            className="mb-6"
          />

          {activeTab === "overview" && (
            <div
              id="docs-tabpanel-overview"
              role="tabpanel"
              aria-labelledby="docs-tab-overview"
              className="docs-tab-content"
            >
              {props.children != null ? props.children : (
                <>
                  {startHere != null && (
                    <StartHereBlock content={startHere} />
                  )}
                  <WhenToUseBlock whenToUse={whenToUse} whenNotToUse={whenNotToUse} />
                  <Description />
                  <div className="mt-6">
                    <Canvas />
                  </div>
                  {usageItems != null && (usageItems.doItems?.length ?? 0) + (usageItems.dontItems?.length ?? 0) > 0 && (
                    <UsagePanel doItems={usageItems.doItems ?? []} dontItems={usageItems.dontItems ?? []} />
                  )}
                  {limitations != null && limitations.length > 0 && (
                    <KnownLimitationsBlock items={limitations} />
                  )}
                  {recipes != null && recipes.length > 0 && (
                    <RecipeBlock recipes={recipes} />
                  )}
                  {related != null && related.length > 0 && (
                    <RelatedComponents
                      items={related.map((r) => ({
                        name: r.label,
                        description: r.description ?? "",
                        href: r.href,
                      }))}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "props" && (
            <div id="docs-tabpanel-props" role="tabpanel" aria-labelledby="docs-tab-props" className="docs-tab-content">
              {propsTableRows.length > 0 ? (
                <PropsTable rows={propsTableRows} />
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">No props. Add <code>argTypes</code> to meta or <code>parameters.docs.propsTable.rows</code>.</p>
              )}
            </div>
          )}

          {activeTab === "usage" && (
            <div id="docs-tabpanel-usage" role="tabpanel" aria-labelledby="docs-tab-usage" className="docs-tab-content">
              {usageItems != null && (usageItems.doItems?.length ?? 0) + (usageItems.dontItems?.length ?? 0) > 0 ? (
                <>
                  <UsagePanel doItems={usageItems.doItems ?? []} dontItems={usageItems.dontItems ?? []} />
                  {useCases != null && (useCases.useCases?.length ?? 0) > 0 && (
                    <UseCaseList useCases={useCases.useCases ?? []} antiPatterns={useCases.antiPatterns} />
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">No usage guidelines. Add <code>parameters.docs.usage</code> or use MDX.</p>
              )}
            </div>
          )}

          {activeTab === "accessibility" && (
            <div id="docs-tabpanel-accessibility" role="tabpanel" aria-labelledby="docs-tab-accessibility" className="docs-tab-content">
              {a11y != null && (a11y.keyboardRows?.length ?? 0) > 0 ? (
                <AccessibilitySection
                  keyboardRows={a11y.keyboardRows ?? []}
                  ariaRoles={a11y.ariaRoles}
                  screenReaderNotes={a11y.screenReaderNotes}
                  contrastRatios={a11y.contrastRatios}
                />
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">No accessibility notes. Add <code>parameters.docs.accessibility</code> or use MDX.</p>
              )}
            </div>
          )}
        </div>

        {hasTOC && (
          <aside className="docs-layout__aside">
            <TableOfContents
              headings={headings}
              activeId={activeId}
              onNavigate={scrollToSection}
            />
          </aside>
        )}
      </div>

      {hasTOC && (
        <MobileTOC
          headings={headings}
          activeId={activeId}
          onNavigate={scrollToSection}
        />
      )}

      <PrimitiveDivider />

      <footer className="mt-8 border-t border-[var(--color-border-subtle)] pt-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--color-text-muted)]">Was this helpful?</span>
          <Button variant="ghost" size="sm" aria-label="Yes"> <ThumbsUp className="h-4 w-4" /> </Button>
          <Button variant="ghost" size="sm" aria-label="No"> <ThumbsDown className="h-4 w-4" /> </Button>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            {prev != null && (
              <Button variant="ghost" size="sm" asChild>
                <a href={prev.href}><ChevronLeft className="h-4 w-4" /> {prev.label}</a>
              </Button>
            )}
          </div>
          <div>
            {next != null && (
              <Button variant="ghost" size="sm" asChild>
                <a href={next.href}>{next.label} <ChevronRight className="h-4 w-4" /></a>
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
          <a href={editUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-accent)] hover:underline">
            Edit this page on GitHub
          </a>
          {lastUpdated != null && <span>Last updated {lastUpdated}</span>}
        </div>
      </footer>
    </div>
  );
}
