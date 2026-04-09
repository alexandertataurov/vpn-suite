import type { ReactNode } from "react";
import { KeyboardTable } from "./KeyboardTable";
import type { KeyboardRow } from "./KeyboardTable";
import { Callout } from "./Callout";

export interface ContrastRatioRow {
  label: string;
  ratio: string;
  pass: boolean;
  fg?: string;
  bg?: string;
}

export interface AccessibilitySectionProps {
  keyboardRows: KeyboardRow[];
  keyboardGroups?: { title: string; rows: KeyboardRow[] }[];
  ariaRoles?: { role: string; description: string }[];
  screenReaderNotes?: ReactNode;
  contrastRatios?: ContrastRatioRow[];
  focusManagement?: ReactNode;
}

export function AccessibilitySection(props: AccessibilitySectionProps) {
  const {
    keyboardRows,
    keyboardGroups,
    ariaRoles = [],
    screenReaderNotes,
    contrastRatios = [],
    focusManagement,
  } = props;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
        Accessibility
      </h2>
      <div className="space-y-6">
        <KeyboardTable rows={keyboardRows} groups={keyboardGroups} title="Keyboard" />
        {ariaRoles.length > 0 && (
          <div className="overflow-x-auto rounded border border-[var(--color-border-subtle)]">
            <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]">
              ARIA Roles and Attributes
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {ariaRoles.map((r) => (
                  <tr key={r.role} className="border-b border-[var(--color-border-faint)] last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-accent)]">{r.role}</td>
                    <td className="px-4 py-2 text-[var(--color-text-secondary)]">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {screenReaderNotes != null && (
          <Callout variant="info" title="Screen reader">
            {screenReaderNotes}
          </Callout>
        )}
        {focusManagement != null && (
          <div className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">Focus management</h3>
            <div className="text-sm text-[var(--color-text-secondary)]">{focusManagement}</div>
          </div>
        )}
        {contrastRatios.length > 0 && (
          <div className="overflow-hidden rounded border border-[var(--color-border-subtle)]">
            <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]">
              Color contrast
            </h3>
            <div className="divide-y divide-[var(--color-border-faint)] p-4">
              {contrastRatios.map((c) => (
                <div key={c.label} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="text-sm text-[var(--color-text-secondary)]">{c.label}</span>
                  <span className="flex items-center gap-2">
                    {c.fg != null && c.bg != null ? (
                      <span className="flex items-center gap-1">
                        <span className="h-5 w-5 rounded border border-[var(--color-border-subtle)]" style={{ backgroundColor: c.fg }} aria-hidden />
                        <span className="h-5 w-5 rounded border border-[var(--color-border-subtle)]" style={{ backgroundColor: c.bg }} aria-hidden />
                      </span>
                    ) : null}
                    <span className={c.pass ? "text-sm font-medium text-[var(--color-nominal-bright)]" : "text-sm font-medium text-[var(--color-critical-bright)]"}>
                      {c.ratio} {c.pass ? "Pass" : "Fail"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
