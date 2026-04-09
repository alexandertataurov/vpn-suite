import React from "react";
import { DocsPage } from "@storybook/blocks";

type DocsPageLayoutProps = React.ComponentProps<typeof DocsPage>;

export function DocsPageLayout(props: DocsPageLayoutProps) {
  const context = props.context;
  const storyId = context?.id ?? "";
  const path = storyId.split("--")[0];
  const breadcrumbs = path ? path.replace(/-/g, " / ") : "Docs";

  const linkClass = "text-[var(--color-text-accent)] no-underline hover:underline focus:outline-none focus:underline";
  return (
    <>
      <header className="mb-8 border-b border-[var(--color-border-subtle)] pb-4">
        <nav className="text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase" aria-label="Breadcrumb">
          {breadcrumbs}
        </nav>
      </header>
      <DocsPage {...props} />
      <footer className="mt-12 border-t border-[var(--color-border-subtle)] pt-5">
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]" aria-label="Design system">
          <a href="/?path=/docs/design-system-introduction--docs" className={linkClass}>Design System</a>
          <span aria-hidden="true">·</span>
          <a href="/?path=/docs/foundations-overview--docs" className={linkClass}>Foundations</a>
          <span aria-hidden="true">·</span>
          <a href="/?path=/docs/patterns-overview--docs" className={linkClass}>Patterns</a>
          <span aria-hidden="true">·</span>
          <a href="/?path=/docs/composites-overview--docs" className={linkClass}>Composites</a>
        </nav>
      </footer>
    </>
  );
}
