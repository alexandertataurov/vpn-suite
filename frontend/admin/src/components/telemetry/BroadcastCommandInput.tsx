import { useState, useCallback, useMemo, useEffect, useRef } from "react";

export interface BroadcastCommandInputProps {
  value?: string;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  blastRadius?: { region?: Record<string, number>; tier?: Record<string, number>; total: number };
  dispatching?: boolean;
  dispatchProgress?: { done: number; total: number };
}

const VAR_REGEX = /\{\{[^}]+\}\}/g;

function highlightVars(text: string): Array<{ text: string; isVar: boolean }> {
  const parts: Array<{ text: string; isVar: boolean }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(VAR_REGEX.source, "g");
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), isVar: false });
    parts.push({ text: m[0], isVar: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), isVar: false });
  return parts;
}

/** Black-box command input with syntax-highlighted preview for {{var}}. */
export function BroadcastCommandInput({
  value: controlled,
  onSubmit,
  placeholder = "broadcast | ping | …",
  blastRadius,
  dispatching = false,
  dispatchProgress,
}: BroadcastCommandInputProps) {
  const [internal, setInternal] = useState("");
  const progressRef = useRef<HTMLDivElement>(null);
  const value = (controlled ?? internal).trim();
  const setValue = useCallback((v: string) => { if (controlled === undefined) setInternal(v); }, [controlled]);
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!value) return;
      onSubmit?.(value);
      if (controlled === undefined) setInternal("");
    },
    [value, onSubmit, controlled]
  );

  const previewParts = useMemo(() => (value ? highlightVars(value) : null), [value]);

  useEffect(() => {
    if (!progressRef.current || !dispatchProgress) return;
    const pct = Math.round((dispatchProgress.done / dispatchProgress.total) * 100);
    progressRef.current.style.setProperty("--broadcast-progress", `${pct}%`);
  }, [dispatchProgress]);

  return (
    <div className="broadcast-command-input broadcast-command-input--single-row">
      <form onSubmit={handleSubmit} className="broadcast-command-form" role="search">
        <div className="broadcast-command-line broadcast-command-line--single">
          <span className="broadcast-command-prompt" aria-hidden>&gt;</span>
          <input
            type="text"
            value={controlled ?? internal}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="broadcast-command-input-field"
            aria-label="Broadcast message"
          />
          <button type="submit" className="broadcast-command-launch" disabled={!value || dispatching} aria-label="Launch broadcast">
            {dispatching ? "…" : "Send"}
          </button>
        </div>
        {previewParts && previewParts.some((p) => p.isVar) && (
          <div className="broadcast-command-preview">
            {previewParts.map((p, i) =>
              p.isVar ? (
                <span key={i} className="broadcast-command-var">{p.text}</span>
              ) : (
                <span key={i}>{p.text}</span>
              )
            )}
          </div>
        )}
        {blastRadius && blastRadius.total > 0 && (
          <div className="broadcast-command-blast" role="status">
            <span className="broadcast-command-blast-label">BLAST RADIUS:</span> {blastRadius.total} users
            {Object.keys(blastRadius.region ?? {}).length > 0 && (
              <span className="broadcast-command-blast-detail">
                {" "}({Object.entries(blastRadius.region ?? {}).map(([k, v]) => `${k}: ${v}`).join(", ")})
              </span>
            )}
          </div>
        )}
        {dispatching && dispatchProgress && (
          <div
            className="broadcast-command-progress"
            role="progressbar"
            aria-valuenow={dispatchProgress.done}
            aria-valuemin={0}
            aria-valuemax={dispatchProgress.total}
            ref={progressRef}
          >
            {/* eslint-disable-next-line react/forbid-dom-props -- dynamic progress width */}
            <div className="broadcast-command-progress-bar" />
            <span className="broadcast-command-progress-label">DISPATCH: {dispatchProgress.done}/{dispatchProgress.total}</span>
          </div>
        )}
      </form>
    </div>
  );
}
