import { setupServer } from "msw/node";

import { authHandlers } from "./handlers/auth.handlers";
import { clientHandlers } from "./handlers/client.handlers";
import { deviceHandlers } from "./handlers/device.handlers";
import { userHandlers } from "./handlers/user.handlers";
import { serverHandlers } from "./handlers/server.handlers";

// Why: central shared MSW server instance avoids duplicate global listeners in tests.
export const server = setupServer(
  ...authHandlers,
  ...clientHandlers,
  ...deviceHandlers,
  ...userHandlers,
  ...serverHandlers
);
