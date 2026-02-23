import { formatTime, type TimeZoneMode } from "@vpn-suite/shared";

export type TooltipRow = {
  name: string;
  color: string;
  value: string;
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildAxisTooltipHTML(args: {
  tsMs: number;
  tz: TimeZoneMode;
  rows: TooltipRow[];
}) {
  const title = esc(formatTime(args.tsMs, { tz: args.tz, withSeconds: true }));
  const rows = args.rows
    .map(
      (r) => `
<div class="ref-chart-tooltip-row">
  <div class="ref-chart-tooltip-left">
    <span class="ref-chart-tooltip-dot" style="background:${r.color}"></span>
    <span class="ref-chart-tooltip-name">${esc(r.name)}</span>
  </div>
  <span class="ref-chart-tooltip-value">${esc(r.value)}</span>
</div>`
    )
    .join("");

  return `
<div class="ref-chart-tooltip">
  <div class="ref-chart-tooltip-title">${title}</div>
  <div class="ref-chart-tooltip-grid">${rows}</div>
</div>`;
}
