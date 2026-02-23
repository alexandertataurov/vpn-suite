interface ModeDisplayProps {
  mode: string;
  interval?: string;
  stream?: boolean;
}

export function ModeDisplay({ mode, interval, stream }: ModeDisplayProps) {
  const label = stream
    ? "Live Stream"
    : interval
      ? `${mode.charAt(0).toUpperCase() + mode.slice(1)} · ${interval}`
      : mode;
  return (
    <div className="operator-mode-display operator-health-cell">
      <div className="operator-health-label">Mode</div>
      <div className="operator-health-value">
        <span className={`operator-live-dot${stream ? " operator-live-dot--stream" : ""}`} title={stream ? "Stream" : "Polling"} aria-hidden />
        {label}
      </div>
    </div>
  );
}
