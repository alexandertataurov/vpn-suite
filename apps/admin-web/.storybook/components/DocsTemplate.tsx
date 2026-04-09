import type { ReactNode } from "react";
import { DocsPage } from "@storybook/blocks";
import { DOCS_EDIT_BASE_URL, DEFAULT_DOCS_EDIT_PATH } from "../docsConfig";

export interface DocsTemplateMeta {
  lastUpdated?: string;
  /** Full URL override for "Edit this page". */
  editUrl?: string;
  /** Relative path from repo root (e.g. "apps/admin-web/src/design-system/docs/Introduction.mdx"). Used when editUrl is not set. */
  editPath?: string;
  readingMinutes?: number;
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
}

export interface DocsTemplateProps {
  context?: unknown;
  /** Optional meta for this doc page */
  meta?: DocsTemplateMeta;
  children?: ReactNode;
}

const linkClass =
  "text-[#0EA5E9] no-underline hover:underline focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:ring-offset-2 focus:ring-offset-[var(--color-app-content)] transition-colors duration-[150ms]";

export function DocsTemplate({
  context,
  meta = {},
  children,
}: DocsTemplateProps) {
  const {
    lastUpdated,
    editUrl: metaEditUrl,
    editPath,
    readingMinutes,
    prev,
    next,
  } = meta;

  const editUrl =
    metaEditUrl ??
    (editPath
      ? `${DOCS_EDIT_BASE_URL}/${editPath.replace(/^\//, "")}`
      : `${DOCS_EDIT_BASE_URL}/${DEFAULT_DOCS_EDIT_PATH}`);

  const storyId = (context as { id?: string })?.id ?? "";
  const path = storyId.split("--")[0];
  const breadcrumbs = path ? path.replace(/-/g, " / ") : "Docs";

  return (
    <div className="docs-template" style={{ maxWidth: 860, margin: "0 auto" }}>
      <header
        className="mb-8 border-b pb-4"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <nav
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--color-text-muted)" }}
          aria-label="Breadcrumb"
        >
          {breadcrumbs}
        </nav>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {readingMinutes != null && (
            <span>{readingMinutes} min read</span>
          )}
          {lastUpdated && (
            <span>Updated {lastUpdated}</span>
          )}
          {editUrl && (
            <a href={editUrl} className={linkClass} target="_blank" rel="noopener noreferrer">
              Edit this page
            </a>
          )}
        </div>
      </header>

      {children}

      <footer
        className="mt-12 border-t pt-6"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        {(prev ?? next) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>{prev ? <a href={prev.href} className={linkClass}>← {prev.label}</a> : null}</div>
            <div>{next ? <a href={next.href} className={linkClass}>{next.label} →</a> : null}</div>
          </div>
        )}
        <nav
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
          style={{ color: "var(--color-text-muted)" }}
          aria-label="Design system"
        >
          <a href="/?path=/docs/design-system-introduction--docs" className={linkClass}>Design System</a>
          <span aria-hidden="true">·</span>
          <a href="/?path=/docs/foundations-overview--docs" className={linkClass}>Foundations</a>
          <span aria-hidden="true">·</span>
          <a href="/?path=/docs/patterns-overview--docs" className={linkClass}>Patterns</a>
          <span aria-hidden="true">·</span>
          <a href="/?path=/docs/composites-overview--docs" className={linkClass}>Composites</a>
        </nav>
      </footer>
    </div>
  );
}

/**
 * Wrapper that uses DocsTemplate for layout and renders Storybook's DocsPage inside.
 * Use as docs.page in preview.tsx to get breadcrumb + meta + prev/next on every doc.
 */
type DocsPageLayoutProps = React.ComponentProps<typeof DocsPage>;

export function DocsTemplateWithPage(props: DocsPageLayoutProps) {
  const context = props.context;
  const meta: DocsTemplateMeta = {};
  return (
    <DocsTemplate context={context} meta={meta}>
      <DocsPage {...props} />
    </DocsTemplate>
  );
}
