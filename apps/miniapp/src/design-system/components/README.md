# Components

Reusable UI with consistent variant/size/tone APIs. Compose primitives and tokens; no data fetching.

**Export order (see `index.ts`):**

| Group | Exports |
|-------|--------|
| **Typography** | Display, H1, H2, H3, Body, Caption |
| **Buttons** | Button, getButtonClassName |
| **Forms** | Field, Input, Label, HelperText, Select, Textarea |
| **Feedback** | Skeleton, InlineAlert, Modal, Popover, Toast |
| **Display** | ProgressBar |
| **Utility** | TelegramThemeBridge |

- **Typography** — semantic text over primitives (Heading/Text).
- **Forms** — Field = label + slot + description + error; use with Input/Select/Textarea.
- **Feedback** — overlays and status (Modal, Toast, Popover, InlineAlert, Skeleton).
- Cards: use **patterns** (e.g. MissionCard, ListCard), not components.
