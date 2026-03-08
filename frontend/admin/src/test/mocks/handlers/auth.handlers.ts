import type { RequestHandler } from "msw";

// Why: keep handler list explicit by feature; tests opt-in via server.use in each suite.
export const authHandlers: RequestHandler[] = [];
