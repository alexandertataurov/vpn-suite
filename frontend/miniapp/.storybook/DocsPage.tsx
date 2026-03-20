import type { ReactNode } from "react";
import {
  Description,
  Primary,
  Canvas,
  ArgTypes,
  Controls,
  Stories,
} from "@storybook/addon-docs/blocks";
import { ComponentHero } from "./components/ComponentHero";
import { StartHereBlock } from "./components/StartHereBlock";
import { WhenToUseBlock } from "./components/WhenToUseBlock";
import { UsageSection } from "./components/UsageSection";
import { KnownLimitationsBlock } from "./components/KnownLimitationsBlock";
import { RecipeBlock } from "./components/RecipeBlock";
import { RelatedComponentsBlock } from "./components/RelatedComponentsBlock";

type DocsContextShape = {
  id?: string;
  title?: string;
  parameters?: Record<string, unknown>;
  tags?: string[];
};

type DocsPageProps = {
  /** Storybook may omit this on first paint; guard all reads. */
  context?: DocsContextShape;
  children?: ReactNode;
};

function getComponentName(title: string): string {
  const parts = title?.split("/") ?? [];
  return parts[parts.length - 1] ?? "Docs";
}

function getCategory(title: string): string | undefined {
  const parts = title.split("/").filter(Boolean);
  if (parts.length <= 1) return undefined;
  return parts.slice(0, -1).join(" / ");
}

function getDocsDescription(description: unknown): string {
  if (typeof description === "string") {
    return description.split("\n\n")[0] ?? "";
  }

  if (description != null && typeof description === "object") {
    const typed = description as { component?: unknown; story?: unknown };

    if (typeof typed.component === "string" && typed.component.trim().length > 0) {
      return typed.component.split("\n\n")[0] ?? "";
    }

    if (typeof typed.story === "string" && typed.story.trim().length > 0) {
      return typed.story.split("\n\n")[0] ?? "";
    }
  }

  return "";
}

function getStoryStatus(
  params: Record<string, unknown>,
): "stable" | "beta" | "deprecated" | "new" {
  const docsParams = (params.docs as Record<string, unknown>) ?? {};
  const explicit = docsParams.status;
  if (
    explicit === "stable" ||
    explicit === "beta" ||
    explicit === "deprecated" ||
    explicit === "new"
  ) {
    return explicit;
  }

  const status = params.status as { type?: unknown } | undefined;
  if (
    status != null &&
    (status.type === "stable" ||
      status.type === "beta" ||
      status.type === "deprecated" ||
      status.type === "new")
  ) {
    return status.type;
  }

  return "stable";
}

export function DocsPage({ context, children }: DocsPageProps) {
  const ctx = context ?? {};
  const title = ctx.title ?? "";
  const params = ctx.parameters ?? {};
  const docsParams = (params.docs as Record<string, unknown>) ?? {};
  const description = getDocsDescription(docsParams.description);
  const status = getStoryStatus(params);
  const componentName = getComponentName(title);
  const category = getCategory(title);
  const storyId = ctx.id ?? "";

  const startHere = docsParams.startHere as string | ReactNode | undefined;
  const whenToUse = docsParams.whenToUse as string[] | undefined;
  const whenNotToUse = docsParams.whenNotToUse as string[] | undefined;
  const usageItems = docsParams.usage as {
    doItems?: { label: string; node: ReactNode; explanation?: string }[];
    dontItems?: { label: string; node: ReactNode; explanation?: string }[];
  } | undefined;
  const limitations = docsParams.limitations as string[] | undefined;
  const recipes = docsParams.recipes as { title: string; code: string; description?: string; language?: string }[] | undefined;
  const related = docsParams.related as { label: string; href: string; description?: string }[] | undefined;

  return (
    <div className="docs-custom-page">
      <ComponentHero
        name={componentName}
        description={description || "Component documentation."}
        status={status as "stable" | "beta" | "deprecated" | "new"}
        category={category}
      />
      <div className="docs-page-meta-row" aria-label="Storybook metadata">
        <span className="docs-page-meta">
          <span className="docs-page-meta__label">Status</span>
          <span className={`docs-page-meta__value docs-page-meta__value--${status}`}>
            {status}
          </span>
        </span>
        {category != null && (
          <span className="docs-page-meta">
            <span className="docs-page-meta__label">Section</span>
            <span className="docs-page-meta__value">{category}</span>
          </span>
        )}
        {storyId.length > 0 && (
          <span className="docs-page-meta">
            <span className="docs-page-meta__label">Story ID</span>
            <span className="docs-page-meta__value docs-page-meta__value--mono">{storyId}</span>
          </span>
        )}
      </div>
      <div className="docs-page-content">
        {children != null ? (
          <div className="docs-page-stack">{children}</div>
        ) : (
          <>
            {startHere != null && (
              <section className="docs-panel">
                <StartHereBlock content={startHere} />
              </section>
            )}
            <section className="docs-panel docs-panel--overview">
              <WhenToUseBlock whenToUse={whenToUse} whenNotToUse={whenNotToUse} />
              <Description />
            </section>
            <section className="docs-panel docs-panel--primary">
              <Primary />
              <Canvas />
            </section>
            <section className="docs-panel">
              <Controls />
              <Stories />
            </section>
            <section className="docs-panel">
              <UsageSection
                doItems={usageItems?.doItems}
                dontItems={usageItems?.dontItems}
              />
            </section>
            {limitations != null && limitations.length > 0 && (
              <section className="docs-panel">
                <KnownLimitationsBlock items={limitations} />
              </section>
            )}
            {recipes != null && recipes.length > 0 && (
              <section className="docs-panel">
                <RecipeBlock recipes={recipes} />
              </section>
            )}
            {related != null && related.length > 0 && (
              <section className="docs-panel">
                <RelatedComponentsBlock items={related} />
              </section>
            )}
            <section className="docs-panel">
              <ArgTypes />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
