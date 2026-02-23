# Shared UI

Components and styles for VPN Suite apps (admin, miniapp).

## Structure

```
ui/
├── styles/              # CSS modules
│   ├── index.css        # Main entry (imports tokens + all modules)
│   └── *.css
├── buttons/             # Button, ButtonLink, CopyButton
├── forms/               # Field, Input, Textarea, Select, Checkbox, SearchInput, Label, HelperText, InlineError, FormStack
├── layout/              # Inline
├── feedback/            # Modal, Drawer, Toast, InlineAlert, Spinner, Skeleton, EmptyState, ErrorState, PageError
├── display/             # Panel, LiveIndicator, Tabs, CodeBlock, CodeText, Stat, ProgressBar
├── typography/          # Text, Heading
├── misc/                # DeviceCard, ProfileCard, QrPanel, DropdownMenu, BulkActionsBar, RelativeTime, VisuallyHidden
├── table/               # Table, VirtualTable, TableContainer, TableSkeleton, TableSortHeader, cell utils
├── index.ts             # Barrel export
└── __tests__/
```

## Usage

```ts
import { Button, Panel, Input } from "@vpn-suite/shared/ui";
```

Styles are loaded via `@vpn-suite/shared/global.css` (admin/miniapp import this in their entry).
