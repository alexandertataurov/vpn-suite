import type { RequestHandler } from "msw";

// Why: split by domain keeps mock ownership close to feature area.
export const clientHandlers: RequestHandler[] = [];
