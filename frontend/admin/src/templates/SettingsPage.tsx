import type { ReactNode } from "react";
import { CommandBar, PageLayout } from "@/components";
import { Tabs } from "@/design-system";
import type { TabsItem } from "@/design-system";

export interface SettingsPageProps {
  title: string;
  tabs: TabsItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Aerospace settings page template: CommandBar → Tabs → FormSections per tab.
 */
export function SettingsPage({
  title,
  tabs,
  activeTab,
  onTabChange,
  children,
  className = "",
  testId,
}: SettingsPageProps) {
  return (
    <PageLayout className={className} testId={testId}>
      <div className="settings-page template-page">
        <CommandBar title={title} />
        <Tabs
          items={tabs}
          value={activeTab}
          onChange={onTabChange}
          ariaLabel="Settings categories"
          className="settings-page__tabs"
        />
        <div className="settings-page__content">
          {children}
        </div>
      </div>
    </PageLayout>
  );
}
