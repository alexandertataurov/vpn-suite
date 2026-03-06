/**
 * Lightweight drop-in for miniapp `cn()` usage.
 * We only need concatenation behavior, not Tailwind conflict resolution.
 */
export function twMerge(...classLists: Array<string | undefined | null | false>): string {
  return classLists.filter(Boolean).join(" ");
}
