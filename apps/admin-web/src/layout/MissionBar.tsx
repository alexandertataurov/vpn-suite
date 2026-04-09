import type { ReactNode } from "react";
import { PageTitle } from "@/design-system/typography";

interface MissionBarProps {
  title?: string;
  children?: ReactNode;
}

export function MissionBar({ title = "Dashboard", children }: MissionBarProps) {
  return (
    <header className="mission-bar" role="banner">
      <PageTitle className="mission-bar__title">{title}</PageTitle>
      {children && <div className="mission-bar__actions">{children}</div>}
    </header>
  );
}
