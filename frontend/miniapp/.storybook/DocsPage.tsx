import type { ReactNode } from "react";
import {
  Description,
  Primary,
  Canvas,
  ArgTypes,
} from "@storybook/addon-docs/blocks";
import { ComponentHero } from "./components/ComponentHero";
import { StartHereBlock } from "./components/StartHereBlock";
import { WhenToUseBlock } from "./components/WhenToUseBlock";
import { UsageSection } from "./components/UsageSection";
import { KnownLimitationsBlock } from "./components/KnownLimitationsBlock";
import { RecipeBlock } from "./components/RecipeBlock";
import { RelatedComponentsBlock } from "./components/RelatedComponentsBlock";

type DocsPageProps = {
  context: Record<string, unknown>;
  children?: ReactNode;
};

function getComponentName(title: string): string {
  const parts = title?.split("/") ?? [];
  return parts[parts.length - 1] ?? "Docs";
}

export function DocsPage({ context, children }: DocsPageProps) {
  const ctx = context as { id?: string; title?: string; parameters?: Record<string, unknown> };
  const title = ctx?.title ?? "";
  const params = ctx?.parameters ?? {};
  const docsParams = (params.docs as Record<string, unknown>) ?? {};
  const description =
    typeof docsParams.description === "object" &&
    docsParams.description !== null &&
    "component" in docsParams.description
      ? String((docsParams.description as { component?: string }).component ?? "")
          .split("\n\n")[0]
      : "";
  const status =
    (docsParams as { status?: string }).status ??
    (typeof params.status === "object" && params.status != null && "type" in params.status
      ? (params.status as { type: string }).type
      : "stable");
  const componentName = getComponentName(title);

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
      />
      <div className="docs-page-content">
        {children != null ? (
          children
        ) : (
          <>
            {startHere != null && <StartHereBlock content={startHere} />}
            <WhenToUseBlock whenToUse={whenToUse} whenNotToUse={whenNotToUse} />
            <Description />
            <div className="docs-preview-section">
              <Primary />
            </div>
            <Canvas />
            <UsageSection
              doItems={usageItems?.doItems}
              dontItems={usageItems?.dontItems}
            />
            {limitations != null && limitations.length > 0 && (
              <KnownLimitationsBlock items={limitations} />
            )}
            {recipes != null && recipes.length > 0 && (
              <RecipeBlock recipes={recipes} />
            )}
            {related != null && related.length > 0 && (
              <RelatedComponentsBlock items={related} />
            )}
            <ArgTypes />
          </>
        )}
      </div>
    </div>
  );
}
