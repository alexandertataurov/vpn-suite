import { BootScreen } from "@/design-system";
import "./BrandSplash.css";

export function BrandSplash() {
  return (
    <BootScreen iconState="default" showProgress>
      <div className="boot-brand">
        <span className="boot-wordmark">AmneziaVPN</span>
        <p className="boot-tagline">Secure and private.</p>
      </div>
    </BootScreen>
  );
}
