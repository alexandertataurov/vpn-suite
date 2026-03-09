/**
 * Lightweight drop-in for miniapp `cn()` usage.
 * Concatenates class strings; filters falsy values (undefined, null, false, 0, "").
 * Does NOT resolve Tailwind utility conflicts — use only with semantic classes.
 * Alias target: `tailwind-merge` in vite.config.ts and vitest.config.ts.
 */
export function twMerge(...classLists: Array<string | undefined | null | false>): string {
  return classLists.filter(Boolean).join(" ");
}
