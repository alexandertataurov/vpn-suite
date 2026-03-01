import type { ReactNode } from "react";

export function MiniappFrame({ children }: { children: ReactNode }) {
  return (
    <div className="miniapp-shell miniapp-shell--stack">
      <main className="miniapp-main miniapp-main--stack">{children}</main>
    </div>
  );
}
