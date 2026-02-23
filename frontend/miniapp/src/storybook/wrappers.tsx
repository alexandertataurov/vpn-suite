import type { ReactNode } from "react";

export function MiniappFrame({ children }: { children: ReactNode }) {
  return (
    <div className="miniapp-layout">
      <main className="miniapp-main">{children}</main>
    </div>
  );
}
