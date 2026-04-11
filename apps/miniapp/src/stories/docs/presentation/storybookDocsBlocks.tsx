/**
 * Presentation-layer components for Storybook MDX docs pages.
 *
 * Improvements over v1
 * ────────────────────
 * Types
 *   • Replaced generic `string[][]` rows with `ReactNode[][]` so cells can
 *     render rich content (badges, links, code spans), not just plain text.
 *   • `DocCalloutVariant` and `DocTableVariant` re-exported for consumer use.
 *   • `DocGridColumnCount` kept internal — not useful outside this module.
 *
 * Correctness
 *   • DocTable variant class applied to both wrapper AND inner table div so
 *     CSS selectors (.docs-pres-table--default / --danger) match correctly.
 *   • DocTable aria-label derived from a meaningful description, not a raw
 *     header join which reads poorly to screen readers.
 *   • DocCode chrome dots wrapped in aria-hidden span so dots are skipped by
 *     assistive technology as a group.
 *   • DocPage uses <main> — only one per page, callers must ensure that.
 *
 * DRY / maintainability
 *   • `clsx`-style helper `cx` replaces three copies of the ternary class
 *     concatenation pattern.
 *   • `getStripedClassName` inlined into `cx` calls — no separate helper.
 *   • `getDocGridClassName` inlined — one expression.
 *   • `getDocTableColumnTemplate` kept as named fn (non-trivial logic).
 *
 * Performance
 *   • Stable `key` strategy: row keys use `rowIndex` only (cell content can
 *     be ReactNode and isn't safe to stringify); cell keys use `cellIndex`.
 *     Item-level checklist keys use index only for the same reason.
 */

import type { CSSProperties, ReactNode } from "react";

/* ─── Public types ──────────────────────────────────────────────────────────── */

export type DocCalloutVariant = "rule" | "note" | "warning" | "error";
export type DocTableVariant = "default" | "danger";

/* ─── Internal types ────────────────────────────────────────────────────────── */

type DocGridColumnCount = 2 | 3;

/* ─── Prop interfaces ───────────────────────────────────────────────────────── */

interface DocPageProps {
  children: ReactNode;
}

interface DocHeroProps {
  label: string;
  title: string;
  description: string;
  version?: string;
}

interface DocDividerProps {
  label?: string;
}

interface DocSectionProps {
  children: ReactNode;
}

interface DocGridProps {
  children: ReactNode;
  columnCount?: DocGridColumnCount;
}

interface DocRuleProps {
  title: string;
  tag?: string;
  children: ReactNode;
}

interface DocTableProps {
  /** Column header labels. Count must match each row's cell count. */
  headers: string[];
  /** Each inner array is one row. Cells may be any renderable React content. */
  rows: ReactNode[][];
  variant?: DocTableVariant;
  /**
   * Explicit column widths as CSS track values (e.g. `["12rem", "1fr", "1fr"]`).
   * Must have the same length as `headers`; otherwise falls back to equal columns.
   */
  columnWidths?: string[];
  /** Accessible label for the table region. Defaults to a generic description. */
  label?: string;
}

interface DocCalloutProps {
  /** Single-character or short emoji icon rendered before the body. */
  icon?: string;
  variant?: DocCalloutVariant;
  children: ReactNode;
}

interface DocCodeProps {
  children: string;
  language?: string;
}

interface DocChecklistProps {
  items: string[];
}

/* ─── Utilities ─────────────────────────────────────────────────────────────── */

/** Minimal class-name joiner — filters out falsy values. */
function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function getDocTableColumnTemplate(
  headers: string[],
  columnWidths?: string[],
): string {
  if (columnWidths && columnWidths.length === headers.length) {
    return columnWidths.join(" ");
  }
  return `repeat(${headers.length}, minmax(0, 1fr))`;
}

/* ─── Components ────────────────────────────────────────────────────────────── */

/**
 * Root page wrapper. Renders a `<main>` landmark — ensure only one per page.
 */
export function DocPage({ children }: DocPageProps) {
  return <main className="docs-pres-page">{children}</main>;
}

/**
 * Hero banner with label, title, description, and optional version badge.
 * Decorative grid and glow elements carry `aria-hidden="true"`.
 */
export function DocHero({ label, title, description, version }: DocHeroProps) {
  return (
    <header className="docs-pres-hero">
      <div className="docs-pres-hero__grid" aria-hidden="true" />
      <div className="docs-pres-hero__glow" aria-hidden="true" />

      <div className="docs-pres-hero__inner">
        <div className="docs-pres-hero__meta">
          <span className="docs-pres-hero__label">{label}</span>
          {version && (
            <span className="docs-pres-hero__version">{version}</span>
          )}
        </div>

        <h1 className="docs-pres-hero__title">{title}</h1>
        <p className="docs-pres-hero__description">{description}</p>
      </div>
    </header>
  );
}

/** Horizontal rule with an optional centred label. */
export function DocDivider({ label }: DocDividerProps) {
  return (
    <div className="docs-pres-divider" role="separator" aria-label={label}>
      {label && (
        <span className="docs-pres-divider__label" aria-hidden="true">
          {label}
        </span>
      )}
      <div className="docs-pres-divider__line" aria-hidden="true" />
    </div>
  );
}

/** Vertical flex container for a group of related doc blocks. */
export function DocSection({ children }: DocSectionProps) {
  return <section className="docs-pres-section">{children}</section>;
}

/** Responsive grid of doc cards. */
export function DocGrid({ children, columnCount = 2 }: DocGridProps) {
  return (
    <div
      className={cx(
        "docs-pres-grid",
        columnCount === 3 && "docs-pres-grid--3",
      )}
    >
      {children}
    </div>
  );
}

/**
 * Rule card — a titled, optionally-tagged doc-rule block.
 * The tag value is used as both the `data-tag` attribute (for CSS variant
 * theming) and the visible label.
 */
export function DocRule({ title, tag, children }: DocRuleProps) {
  return (
    <article className="docs-pres-rule">
      <div className="docs-pres-rule__head">
        <span className="docs-pres-rule__title">{title}</span>
        {tag && (
          <span className="docs-pres-rule__tag" data-tag={tag}>
            {tag}
          </span>
        )}
      </div>
      <p className="docs-pres-rule__body">{children}</p>
    </article>
  );
}

/**
 * Data table with optional column-width control and two visual variants.
 *
 * Rendered as ARIA `role="table"` on a `<div>` grid rather than a native
 * `<table>` because the layout uses CSS Grid for column alignment. Ensure
 * `label` is set to a meaningful description for screen readers.
 *
 * CSS note: the variant class is applied to both the outer wrapper (for
 * scrollable overflow) and the inner table div (where CSS variant selectors
 * target `.docs-pres-table--default` / `.docs-pres-table--danger`).
 */
export function DocTable({
  headers,
  rows,
  variant = "default",
  columnWidths,
  label = "Data table",
}: DocTableProps) {
  const variantClass = `docs-pres-table--${variant}`;
  const tableStyle = {
    "--docs-pres-table-cols": getDocTableColumnTemplate(headers, columnWidths),
  } as CSSProperties;

  return (
    <div className={cx("docs-pres-table-wrap", variantClass)}>
      <div
        className={cx("docs-pres-table", variantClass)}
        style={tableStyle}
        role="table"
        aria-label={label}
      >
        <div className="docs-pres-table__head" role="rowgroup">
          <div className="docs-pres-table__row" role="row">
            {headers.map((header) => (
              <div key={header} className="docs-pres-table__th" role="columnheader">
                {header}
              </div>
            ))}
          </div>
        </div>

        <div role="rowgroup">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={cx(
                "docs-pres-table__row",
                rowIndex % 2 === 1 && "docs-pres-table__row--alt",
              )}
              role="row"
            >
              {row.map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  className="docs-pres-table__cell"
                  role="cell"
                >
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Callout block for rules, notes, warnings, or errors.
 * The `icon` is a presentational glyph — it gets `aria-hidden="true"`.
 * Semantic intent is conveyed by the variant class name and surrounding copy.
 */
export function DocCallout({ icon, variant = "note", children }: DocCalloutProps) {
  return (
    <aside
      className={cx("docs-pres-callout", `docs-pres-callout--${variant}`)}
    >
      {icon && (
        <span className="docs-pres-callout__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="docs-pres-callout__body">{children}</div>
    </aside>
  );
}

/**
 * Fenced code block with a fake macOS chrome header.
 * Chrome dots are grouped in an `aria-hidden` span — decorative only.
 */
export function DocCode({ children, language = "tsx" }: DocCodeProps) {
  return (
    <div className="docs-pres-code">
      <div className="docs-pres-code__chrome">
        <span aria-hidden="true">
          <span className="docs-pres-code__dot docs-pres-code__dot--a" />
          <span className="docs-pres-code__dot docs-pres-code__dot--b" />
          <span className="docs-pres-code__dot docs-pres-code__dot--c" />
        </span>
        <span className="docs-pres-code__lang">{language}</span>
      </div>
      <pre className="docs-pres-code__pre">
        <code>{children}</code>
      </pre>
    </div>
  );
}

/**
 * Read-only checklist. Visual checkboxes are decorative (`aria-hidden`);
 * state is not interactive. For interactive checklists, use `<input type="checkbox">`.
 */
export function DocChecklist({ items }: DocChecklistProps) {
  return (
    <ul className="docs-pres-checklist" role="list">
      {items.map((item, index) => (
        <li
          key={index}
          className={cx(
            "docs-pres-checklist__row",
            index % 2 === 1 && "docs-pres-checklist__row--alt",
          )}
        >
          <div className="docs-pres-checklist__box" aria-hidden="true" />
          <span className="docs-pres-checklist__text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── MDX component map ─────────────────────────────────────────────────────── */

export const storybookDocsMdxComponents = {
  DocCallout,
  DocChecklist,
  DocCode,
  DocDivider,
  DocGrid,
  DocHero,
  DocPage,
  DocRule,
  DocSection,
  DocTable,
} as const;