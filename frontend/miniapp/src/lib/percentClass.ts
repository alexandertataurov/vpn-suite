/** Maps a 0–100 value to a CSS class name for progress/load display. */
export function percentClass(pct: number): string {
  if (pct >= 90) return "percent-high";
  if (pct >= 70) return "percent-medium";
  return "percent-low";
}

export const getPercentClass = percentClass;
