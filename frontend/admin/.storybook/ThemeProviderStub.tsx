import type { ReactNode } from "react";

/** Stub for Storybook: admin has no shared/theme; themes applied via globals in preview. */
export function ThemeProvider({
  children,
}: {
  children: ReactNode;
  themes?: string[];
  defaultTheme?: string;
  storageKey?: string;
}) {
  return <>{children}</>;
}
