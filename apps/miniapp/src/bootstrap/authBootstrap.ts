/**
 * WebApp auth bootstrap: /webapp/auth exchange with deduplication.
 * Use via authenticateWebApp(). Call resetForTest() in tests to clear module state.
 */

import type { WebAppAuthResponse } from "@vpn-suite/shared";
import { postAuth } from "../api";

let webappAuthPromise: Promise<WebAppAuthResponse> | null = null;

/**
 * Authenticate webapp via /webapp/auth.
 * Deduplicates in-flight requests via module-level promise.
 * @internal Only useBootstrapMachine should call this.
 */
export async function authenticateWebApp(initData: string): Promise<WebAppAuthResponse> {
  if (!webappAuthPromise) {
    webappAuthPromise = postAuth(initData)
      .finally(() => {
        webappAuthPromise = null;
      });
  }
  return webappAuthPromise;
}

/** Reset auth promise for tests. Call before/after tests that mutate auth state. */
export function resetAuthForTest(): void {
  webappAuthPromise = null;
}
