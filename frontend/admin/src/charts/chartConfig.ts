/**
 * Chart colors resolved from design tokens at runtime.
 */
import { getChartTheme } from "./theme";

export function getChartColors() {
  const t = getChartTheme();
  return {
    primary: { solid: t.primary.solid, area: t.primary.area },
  };
}
