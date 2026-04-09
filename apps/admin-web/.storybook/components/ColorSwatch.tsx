type ColorSwatchProps = {
  token: string;
  value: string;
};

export function ColorSwatch({ token, value }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-3 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
      <div
        className="h-10 w-10 shrink-0 rounded border border-[var(--color-border-subtle)]"
        style={{ backgroundColor: value }}
      />
      <div>
        <code className="text-xs text-[var(--color-text-primary)]">{token}</code>
        <div className="text-xs text-[var(--color-text-muted)]">{value}</div>
      </div>
    </div>
  );
}
