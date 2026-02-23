import { useSearchParams } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Tabs } from "@vpn-suite/shared/ui";
import { SubscriptionsTab } from "./billing/SubscriptionsTab";
import { PaymentsTab } from "./billing/PaymentsTab";

type BillingTab = "subscriptions" | "payments";
const BILLING_TAB_ITEMS = [
  { id: "subscriptions" as const, label: "Subscriptions" },
  { id: "payments" as const, label: "Payments" },
];

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: BillingTab = searchParams.get("tab") === "payments" ? "payments" : "subscriptions";

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  };

  return (
    <div className="ref-page" data-testid="billing-page">
      <PageHeader
        icon={CreditCard}
        title="Billing"
        description="Subscriptions and payment history"
      />

      <Tabs
        items={BILLING_TAB_ITEMS}
        value={activeTab}
        onChange={setTab}
        ariaLabel="Billing tabs"
        className="tabs tabs-page"
        tabClassName="tabs-page-item"
        idPrefix="billing"
      />

      <div
        id="billing-tabpanel-subscriptions"
        role="tabpanel"
        aria-labelledby="billing-tab-subscriptions"
        hidden={activeTab !== "subscriptions"}
      >
        {activeTab === "subscriptions" ? <SubscriptionsTab /> : null}
      </div>
      <div
        id="billing-tabpanel-payments"
        role="tabpanel"
        aria-labelledby="billing-tab-payments"
        hidden={activeTab !== "payments"}
      >
        {activeTab === "payments" ? <PaymentsTab /> : null}
      </div>
    </div>
  );
}
