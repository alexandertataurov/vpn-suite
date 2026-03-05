import { useSearchParams } from "react-router-dom";
import { Button } from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { MetaText } from "@/design-system/typography";

const TABS = [
  { id: "subscriptions", label: "Subscriptions" },
  { id: "payments", label: "Payments" },
] as const;

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const active = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : TABS[0].id;
  const panelId = `billing-tabpanel-${active}`;

  const setActive = (id: string) => setSearchParams({ tab: id });

  return (
    <PageLayout title="Billing" pageClass="billing-page" dataTestId="billing-page">
      <div className="billing-page__tabs" role="tablist">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            role="tab"
            id={`billing-tab-${tab.id}`}
            aria-controls={`billing-tabpanel-${tab.id}`}
            aria-selected={active === tab.id}
            tabIndex={active === tab.id ? 0 : -1}
            variant="default"
            className={`billing-page__tab${active === tab.id ? " billing-page__tab--active" : ""}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div
        className="billing-page__panel"
        role="tabpanel"
        id={panelId}
        aria-labelledby={`billing-tab-${active}`}
      >
        {active === "subscriptions" && <MetaText>Subscriptions (placeholder).</MetaText>}
        {active === "payments" && <MetaText>Payments (placeholder).</MetaText>}
      </div>
    </PageLayout>
  );
}
