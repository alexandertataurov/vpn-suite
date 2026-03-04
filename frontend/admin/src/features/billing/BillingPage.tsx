import { useSearchParams } from "react-router-dom";
import { SectionTitle, MetaText } from "@/design-system";

const TABS = [
  { id: "subscriptions", label: "Subscriptions" },
  { id: "payments", label: "Payments" },
] as const;

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const active = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : TABS[0].id;

  const setActive = (id: string) => setSearchParams({ tab: id });

  return (
    <div className="page billing-page" data-testid="billing-page">
      <SectionTitle>Billing</SectionTitle>
      <div className="billing-page__tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`billing-page__tab${active === tab.id ? " billing-page__tab--active" : ""}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="billing-page__panel" role="tabpanel">
        {active === "subscriptions" && <MetaText>Subscriptions (placeholder).</MetaText>}
        {active === "payments" && <MetaText>Payments (placeholder).</MetaText>}
      </div>
    </div>
  );
}
