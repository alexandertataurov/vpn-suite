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
      <Panel className="card mb-lg">
        <h2 className="card-title">Installation</h2>
        <p>1. Subscribe to a plan.</p>
        <p>2. Go to Devices and add a device.</p>
        <p>3. Download the config for your platform (iOS, Android, Windows, macOS).</p>
        <p>4. Open the config in the VPN app (AmneziaVPN or compatible).</p>
      </Panel>
      <Panel className="card mb-lg">
        <h2 className="card-title">Privacy & security</h2>
        <p>
          Your VPN configs are issued per-device from this mini app. Treat each config as a secret:
          do not share it or publish screenshots of it.
        </p>
        <p>
          If you suspect a device or config is compromised, revoke the device from the
          <strong> My devices</strong> tab and issue a new one.
        </p>
      </Panel>
      <Panel className="card">
        <h2 className="card-title">Support</h2>
        <p>
          If you cannot connect, first check that your subscription is active and that you have at
          least one active device config.
        </p>
        <p>
          If problems persist, contact support via the VPN bot or the official support channel linked
          from the bot profile.
        </p>
      </Panel>
    </div>
  );
}
