type DividerProps = {
  label?: string;
};

export function Divider({ label }: DividerProps) {
  if (label) {
    return (
      <div className="my-8 flex items-center gap-4">
        <hr className="flex-1 border-0 border-t border-[var(--color-border-subtle)]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          {label}
        </span>
        <hr className="flex-1 border-0 border-t border-[var(--color-border-subtle)]" />
      </div>
    );
  }
  return (
    <hr className="my-8 border-0 border-t border-[var(--color-border-subtle)]" />
  );
}
