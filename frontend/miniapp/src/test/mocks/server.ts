import { setupServer } from "msw/node";

import { sessionHandlers } from "./handlers/session.handlers";
import { deviceHandlers } from "./handlers/device.handlers";
import { planHandlers } from "./handlers/plan.handlers";

export const server = setupServer(...sessionHandlers, ...deviceHandlers, ...planHandlers);
