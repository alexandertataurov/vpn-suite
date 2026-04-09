import type { ReactNode } from "react";
import { KeyboardTable } from "./KeyboardTable";
import type { KeyboardRow } from "./KeyboardTable";

export interface AccessibilitySectionProps {
  keyboardRows: KeyboardRow[];
  ariaRoles?: { role: string; description: string }[];
  screenReaderNotes?: ReactNode;
  contrastRatios?: { label: string; ratio: string; pass: boolean }[];
}

export function AccessibilitySection({
  keyboardRows,
  ariaRoles = [],
  screenReaderNotes,
  contrastRatios = [],
}: AccessibilitySectionProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">Accessibility</h2>
      <div className="space-y-6">
        {keyboardRows.length > 0 && <KeyboardTable rows={keyboardRows} title="Keyboard" />}
        {ariaRoles.length > 0 && (
          <div className="overflow-x-auto rounded border border-[var(--color-border-subtle)]">
            <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]">
              ARIA Roles & Attributes
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {ariaRoles.map((r) => (
                  <tr
                    key={r.role}
                    className="border-b border-[var(--color-border-faint)] last:border-0"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-accent)]">
                      {r.role}
                    </td>
                    <td className="px-4 py-2 text-[var(--color-text-secondary)]">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {screenReaderNotes && (
          <div className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
              Screen Reader
            </h3>
            <div className="text-sm text-[var(--color-text-secondary)]">{screenReaderNotes}</div>
          </div>
        )}
        {contrastRatios.length > 0 && (
          <div className="rounded border border-[var(--color-border-subtle)] overflow-hidden">
            <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]">
              Color Contrast
            </h3>
            <div className="divide-y divide-[var(--color-border-faint)] p-4">
              {contrastRatios.map((c) => (
                <div key={c.label} className="flex items-center justify-between py-1">
                  <span className="text-sm text-[var(--color-text-secondary)]">{c.label}</span>
                  <span
                    className={`text-sm font-medium ${c.pass ? "text-[var(--color-nominal-bright)]" : "text-[var(--color-warning-bright)]"}`}
                  >
                    {c.ratio}
                    {c.pass ? " ✓" : " (fails WCAG AA)"}
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
