import type { ReactNode } from "react";

export type AddDeviceWizardStep = "name" | "install";

export interface AddDeviceWizardContentProps {
  step: AddDeviceWizardStep;
  /** For step="name": name input slot */
  nameSlot: ReactNode;
  /** For step="install": kicker, message, steps list, store links */
  installKicker: string;
  installMessage: string;
  installSteps: readonly string[];
  storeLinks: ReactNode;
}

/**
 * Add device wizard content: 2-step stepper + step-specific content.
 * Design-system pattern for devices-add-wizard.
 */
export function AddDeviceWizardContent({
  step,
  nameSlot,
  installKicker,
  installMessage,
  installSteps,
  storeLinks,
}: AddDeviceWizardContentProps) {
  const isNameStep = step === "name";
  return (
    <div className="devices-add-wizard">
      <div className="devices-add-wizard-stepper" aria-hidden="true">
        <span
          className={`devices-add-wizard-step ${isNameStep ? "devices-add-wizard-step--active" : "devices-add-wizard-step--complete"}`}
        />
        <span
          className={`devices-add-wizard-step ${isNameStep ? "" : "devices-add-wizard-step--active"}`}
        />
      </div>
      {isNameStep ? (
        nameSlot
      ) : (
        <div className="devices-add-wizard-card">
          <p className="devices-add-wizard-kicker">{installKicker}</p>
          <p className="devices-add-wizard-message">{installMessage}</p>
          <ol className="devices-add-wizard-list">
            {installSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <div className="devices-add-wizard-links">{storeLinks}</div>
        </div>
      )}
    </div>
  );
}
