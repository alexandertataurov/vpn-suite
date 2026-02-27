import { useState } from "react";
import { Panel, Button, getButtonClassName } from "@vpn-suite/shared/ui";
import { TroubleshooterStep } from "../components/TroubleshooterStep";
import { useTrackScreen } from "../hooks/useTrackScreen";
import { useSession } from "../hooks/useSession";
import { getWebappToken } from "../api/client";

const TROUBLESHOOTER_STEPS = [
  {
    title: "Is your subscription active?",
    body: "Check the Home or Plan tab. If you have no active plan, choose a plan and complete payment.",
    nextLabel: "Yes, it's active",
    backLabel: "Back",
  },
  {
    title: "Do you have a device config?",
    body: "Go to Devices and add a device to get a config. Install it in AmneziaVPN or a compatible app.",
    nextLabel: "I have a config",
    backLabel: "Back",
  },
  {
    title: "Try reissuing the config",
    body: "In Devices, revoke the device and add it again to get a fresh config. Sometimes the server was updated.",
    nextLabel: "Next",
    backLabel: "Back",
  },
  {
    title: "Contact support",
    body: "If you still can't connect, contact support via the VPN bot or the official support channel.",
    nextLabel: "Done",
    backLabel: "Back",
  },
];

export function SupportPage() {
  const hasToken = !!getWebappToken();
  const { data } = useSession(hasToken);
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  useTrackScreen("support", activeSub?.plan_id ?? null);

  const [step, setStep] = useState(0);
  const totalSteps = TROUBLESHOOTER_STEPS.length;
  const current = TROUBLESHOOTER_STEPS[step];

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Support</h1>
          <p className="miniapp-page-subtitle">Troubleshooting and help</p>
        </div>
      </div>

      <h2 className="miniapp-section-title">Troubleshooter</h2>
      <TroubleshooterStep
        stepIndex={step + 1}
        totalSteps={totalSteps}
        title={current.title}
        body={current.body}
        nextLabel={current.nextLabel}
        onNext={() => setStep((s) => (s + 1 < totalSteps ? s + 1 : 0))}
        backLabel={step > 0 ? current.backLabel : undefined}
        onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
      />

      <h2 className="miniapp-section-title mt-lg">FAQ</h2>
      <Panel className="card mb-md">
        <h3 className="card-title">Installation</h3>
        <p className="fs-sm mb-0">
          1. Subscribe to a plan. 2. Go to Devices and add a device. 3. Download the config. 4. Open it in AmneziaVPN or compatible app.
        </p>
      </Panel>
      <Panel className="card mb-md">
        <h3 className="card-title">Privacy & security</h3>
        <p className="fs-sm mb-0">
          Treat each config as a secret. If compromised, revoke the device in Devices and add a new one.
        </p>
      </Panel>

      <Panel className="card mb-md">
        <h3 className="card-title">Report a problem</h3>
        <p className="fs-sm mb-sm">Contact support via the VPN bot or the official support channel linked from the bot profile.</p>
      </Panel>

      <div className="miniapp-cta">
        <a
          href="https://t.me/support"
          target="_blank"
          rel="noopener noreferrer"
          className={getButtonClassName("primary", "lg")}
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
