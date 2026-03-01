import { useState, useEffect } from "react";
function formatUtc(): string {
  const now = new Date();
  return now.toISOString().slice(11, 19);
}

export function SystemHeartbeat() {
  const [utc, setUtc] = useState(formatUtc);

  useEffect(() => {
    const id = setInterval(() => setUtc(formatUtc()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="mission-control-heartbeat"
      role="status"
      aria-label={`UTC ${utc}`}
    >
      <span className="mission-control-heartbeat-utc" title="UTC">
        UTC {utc}
      </span>
    </div>
  );
}
