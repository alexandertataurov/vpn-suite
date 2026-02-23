export interface SavedView<T> {
  name: string;
  state: T;
}

function keyFor(scope: string): string {
  return `vpn-suite-admin-saved-view:${scope}`;
}

export function loadSavedViews<T>(scope: string): SavedView<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedView<T>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.name === "string");
  } catch {
    return [];
  }
}

export function writeSavedViews<T>(scope: string, views: SavedView<T>[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(scope), JSON.stringify(views));
  } catch {
    /* ignore */
  }
}

export function upsertSavedView<T>(
  scope: string,
  existing: SavedView<T>[],
  view: SavedView<T>
): SavedView<T>[] {
  const normalizedName = view.name.trim();
  if (!normalizedName) return existing;
  const withoutCurrent = existing.filter(
    (item) => item.name.toLowerCase() !== normalizedName.toLowerCase()
  );
  const next = [...withoutCurrent, { name: normalizedName, state: view.state }];
  writeSavedViews(scope, next);
  return next;
}

export function removeSavedView<T>(
  scope: string,
  existing: SavedView<T>[],
  name: string
): SavedView<T>[] {
  const next = existing.filter((item) => item.name !== name);
  writeSavedViews(scope, next);
  return next;
}
