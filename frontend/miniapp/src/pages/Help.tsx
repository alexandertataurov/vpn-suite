import { Panel } from "@vpn-suite/shared/ui";

export function HelpPage() {
  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Help</h1>
          <p className="miniapp-page-subtitle">Installation and troubleshooting</p>
        </div>
      </div>
      <Panel>
        <h2 className="card-title">Installation</h2>
        <p>1. Subscribe to a plan.</p>
        <p>2. Go to Devices and add a device.</p>
        <p>3. Download the config for your platform (iOS, Android, Windows, macOS).</p>
        <p>4. Open the config in the VPN app (AmneziaVPN or compatible).</p>
      </Panel>
    </div>
  );
}
