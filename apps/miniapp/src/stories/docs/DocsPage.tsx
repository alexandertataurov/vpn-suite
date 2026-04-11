import type { ReactNode } from "react";
import {
  ArgTypes,
  Canvas,
  Controls,
  Description,
  Primary,
  Stories,
} from "@storybook/addon-docs/blocks";
import { ComponentHero } from "./components/ComponentHero";
import { KnownLimitationsBlock } from "./components/KnownLimitationsBlock";
import { RecipeBlock } from "./components/RecipeBlock";
import { RelatedComponentsBlock } from "./components/RelatedComponentsBlock";
import { StartHereBlock } from "./components/StartHereBlock";
import { UsageSection } from "./components/UsageSection";
import { WhenToUseBlock } from "./components/WhenToUseBlock";

type StoryDocsStatus = "stable" | "beta" | "deprecated" | "new";

type DocsContextShape = {
  id?: string;
  title?: string;
  parameters?: Record<string, unknown>;
  tags?: string[];
};

type UsageItem = {
  label: string;
  node: ReactNode;
  explanation?: string;
};

type RecipeItem = {
  title: string;
  code: string;
  description?: string;
  language?: string;
};

type RelatedItem = {
  label: string;
  href: string;
  description?: string;
};

type DocsParameters = {
  description?: unknown;
  startHere?: string | ReactNode;
  whenToUse?: string[];
  whenNotToUse?: string[];
  usage?: {
    doItems?: UsageItem[];
    dontItems?: UsageItem[];
  };
  limitations?: string[];
  recipes?: RecipeItem[];
  related?: RelatedItem[];
  status?: StoryDocsStatus;
};

type DocsPageProps = {
  context?: DocsContextShape;
  children?: ReactNode;
};

function getStoryDisplayName(title: string): string {
  const titleSegments = title.split("/").filter(Boolean);
  return titleSegments[titleSegments.length - 1] ?? "Docs";
}

function getStorySectionName(title: string): string | undefined {
  const titleSegments = title.split("/").filter(Boolean);

  if (titleSegments.length <= 1) {
    return undefined;
  }

  return titleSegments.slice(0, -1).join(" / ");
}

function getPrimaryDocsDescription(description: unknown): string {
  if (typeof description === "string") {
    return description.split("\n\n")[0] ?? "";
  }

  if (description == null || typeof description !== "object") {
    return "";
  }

  const descriptionFields = description as { component?: unknown; story?: unknown };

  if (
    typeof descriptionFields.component === "string" &&
    descriptionFields.component.trim().length > 0
  ) {
    return descriptionFields.component.split("\n\n")[0] ?? "";
  }

  if (typeof descriptionFields.story === "string" && descriptionFields.story.trim().length > 0) {
    return descriptionFields.story.split("\n\n")[0] ?? "";
  }

  return "";
}

function normalizeDocsParameters(parameters: Record<string, unknown>): DocsParameters {
  const docsParameters = (parameters.docs as Record<string, unknown> | undefined) ?? {};

  return {
    description: docsParameters.description,
    limitations: docsParameters.limitations as string[] | undefined,
    recipes: docsParameters.recipes as RecipeItem[] | undefined,
    related: docsParameters.related as RelatedItem[] | undefined,
    startHere: docsParameters.startHere as string | ReactNode | undefined,
    status: docsParameters.status as StoryDocsStatus | undefined,
    usage: docsParameters.usage as DocsParameters["usage"],
    whenNotToUse: docsParameters.whenNotToUse as string[] | undefined,
    whenToUse: docsParameters.whenToUse as string[] | undefined,
  };
}

function resolveStoryStatus(
  parameters: Record<string, unknown>,
  docsParameters: DocsParameters,
): StoryDocsStatus {
  if (
    docsParameters.status === "stable" ||
    docsParameters.status === "beta" ||
    docsParameters.status === "deprecated" ||
    docsParameters.status === "new"
  ) {
    return docsParameters.status;
  }

  const storyStatus = parameters.status as { type?: unknown } | undefined;

  if (
    storyStatus?.type === "stable" ||
    storyStatus?.type === "beta" ||
    storyStatus?.type === "deprecated" ||
    storyStatus?.type === "new"
  ) {
    return storyStatus.type;
  }

  return "stable";
}

function hasItems<T>(items: T[] | undefined): items is T[] {
  return Array.isArray(items) && items.length > 0;
}

export function DocsPage({ context, children }: DocsPageProps) {
  const storyContext = context ?? {};
  const storyTitle = storyContext.title ?? "";
  const storyParameters = storyContext.parameters ?? {};
  const docsParameters = normalizeDocsParameters(storyParameters);
  const storyDescription = getPrimaryDocsDescription(docsParameters.description);
  const storyStatus = resolveStoryStatus(storyParameters, docsParameters);
  const storyDisplayName = getStoryDisplayName(storyTitle);
  const storySectionName = getStorySectionName(storyTitle);
  const storyId = storyContext.id ?? "";

  return (
    <div className="docs-custom-page docs-pres-mdx-root">
      <ComponentHero
        name={storyDisplayName}
        description={storyDescription || "Component documentation."}
        status={storyStatus}
        category={storySectionName}
      />

      <div className="docs-page-meta-row" aria-label="Storybook metadata">
        <span className="docs-page-meta">
          <span className="docs-page-meta__label">Status</span>
          <span className={`docs-page-meta__value docs-page-meta__value--${storyStatus}`}>
            {storyStatus}
          </span>
        </span>

        {storySectionName != null && (
          <span className="docs-page-meta">
            <span className="docs-page-meta__label">Section</span>
            <span className="docs-page-meta__value">{storySectionName}</span>
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
            {docsParameters.startHere != null && (
              <section className="docs-panel">
                <StartHereBlock content={docsParameters.startHere} />
              </section>
            )}

            <section className="docs-panel docs-panel--overview">
              <WhenToUseBlock
                whenToUse={docsParameters.whenToUse}
                whenNotToUse={docsParameters.whenNotToUse}
              />
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
                doItems={docsParameters.usage?.doItems}
                dontItems={docsParameters.usage?.dontItems}
              />
            </section>

            {hasItems(docsParameters.limitations) && (
              <section className="docs-panel">
                <KnownLimitationsBlock items={docsParameters.limitations} />
              </section>
            )}

            {hasItems(docsParameters.recipes) && (
              <section className="docs-panel">
                <RecipeBlock recipes={docsParameters.recipes} />
              </section>
            )}

            {hasItems(docsParameters.related) && (
              <section className="docs-panel">
                <RelatedComponentsBlock items={docsParameters.related} />
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
