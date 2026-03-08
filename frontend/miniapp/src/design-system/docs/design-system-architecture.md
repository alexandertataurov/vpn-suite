# React Design System Architecture Guide

Version: 1.0
Audience: Frontend Engineers, UI Engineers, Design System Maintainers
Goal: Maintain scalable, consistent, and maintainable React UI components.

---

# Overview

A design system should be treated as a **product**, not a random collection of reusable components.

A well-structured system prevents:

• duplicated UI logic
• inconsistent styling
• uncontrolled component APIs
• fragile UI architecture

The recommended architecture follows a **layered model**:

```
Design Tokens
      ↓
Foundations
      ↓
Primitives
      ↓
Components
      ↓
Patterns
      ↓
Page Recipes
      ↓
Feature Components (Application Layer)
```

Each layer has strict responsibilities.

---

# Layer Architecture

## 1. Design Tokens

Design tokens represent the **raw visual decisions** of the design system.

Tokens must be the **single source of truth**.

### Typical Tokens

```
colors
spacing
typography
radius
shadows
zIndex
motion
breakpoints
```

### Example

```ts
export const colors = {
  brand: {
    500: "#2563eb",
    600: "#1d4ed8"
  },
  neutral: {
    0: "#ffffff",
    900: "#111827"
  },
  danger: {
    500: "#dc2626"
  }
}
```

Prefer mapping tokens to **CSS variables**.

Example:

```css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #111827;
  --space-3: 12px;
  --radius-md: 8px;
}
```

### Token Rules

Never hardcode colors inside components.

Bad:

```
color: #2563eb
```

Correct:

```
color: var(--color-brand-500)
```

Tokens must remain **pure values only**.

No logic allowed.

---

# 2. Foundations

Foundations apply tokens globally.

Responsibilities:

• theme configuration
• global CSS variables
• typography rules
• resets
• theme switching (light/dark)

### Files

```
foundations/
  theme.ts
  css-variables.css
  global.css
```

---

# 3. Primitives

Primitives are **low-level building blocks**.

They are simple and stable.

They should never contain business logic.

### Typical Primitives

```
Box
Flex
Grid
Stack
Text
Heading
Icon
ButtonBase
```

### Example Primitive

```
Stack
```

Handles:

• layout direction
• spacing
• alignment

It should **not know anything about application logic**.

Primitives exist only to provide **layout and accessibility primitives**.

---

# 4. Components

Components are the **core reusable UI elements**.

Examples:

```
Button
Input
Checkbox
Switch
Select
Tooltip
Modal
Card
Tabs
Badge
Toast
```

These components must follow consistent APIs.

### Component API Rules

Use standardized props.

```
variant
size
tone
disabled
loading
```

Avoid boolean prop explosions.

Bad:

```
<Button primary secondary danger small rounded />
```

Correct:

```
<Button variant="primary" size="sm" />
```

---

# 5. Patterns

Patterns combine components into **common UI structures**.

Examples:

```
FormField
PageHeader
EmptyState
FilterBar
SettingsSection
SearchBar
```

Patterns remove duplication across screens.

Patterns **should not include business logic**.

They only combine components.

---

# 6. Feature Components

## 6. Page Recipes

Page recipes are reusable page-shaped wrappers built from layouts and patterns.

Examples:

```
PageHeaderBadge
PageCardSection
HeroFirstPage
FormPageSection
```

Rules:

- page recipes may compose layouts, patterns, and components
- page recipes must not fetch data
- page recipes are reusable contracts, not one-page shortcuts
- if a structural page wrapper is reused across screens, it belongs here instead of `pages/`

---

# 7. Feature Components

Feature components belong to the **application**, not the design system.

Examples:

```
UserBillingCard
VpnServerStatusPanel
CheckoutSummary
TelegramConnectionCard
```

Feature components live inside the application layer:

```
features/
components/
pages/
```

Design systems must **not become a dumping ground** for app components.

---

# Recommended Project Structure

```
src/

  design-system/

    tokens/
      colors.ts
      spacing.ts
      typography.ts
      radius.ts
      shadows.ts
      motion.ts
      breakpoints.ts

    foundations/
      theme.ts
      css-variables.css
      global.css

    primitives/
      Box/
        Box.tsx
        Box.types.ts
        index.ts

      Stack/
      Text/
      Heading/
      Icon/
      ButtonBase/

    components/
      Button/
        Button.tsx
        Button.types.ts
        Button.styles.ts
        Button.test.tsx
        Button.stories.tsx
        index.ts

      Input/
      Select/
      Checkbox/
      Modal/
      Tooltip/
      Card/
      Tabs/

    patterns/
      FormField/
      PageHeader/
      SearchBar/
      EmptyState/

    hooks/
      useBreakpoint.ts
      useControllableState.ts
      useThemeMode.ts

    utils/
      cx.ts
      polymorphic.ts
      accessibility.ts

    icons/
    types/
    docs/

  components/      # shared app components
  features/        # feature specific UI
  pages/           # routes
```

---

# Component Folder Structure

Each component should be **self-contained**.

```
Button/

  Button.tsx
  Button.types.ts
  Button.styles.ts
  Button.test.tsx
  Button.stories.tsx
  index.ts
```

Benefits:

• easier maintenance
• easier testing
• easier documentation

---

# Composition vs Prop Explosion

Prefer **composition** over massive prop lists.

Bad pattern:

```
<Card title="" subtitle="" icon="" footer="" />
```

Better:

```
<Card>
  <CardHeader>
    <CardTitle />
    <CardSubtitle />
  </CardHeader>

  <CardContent />

  <CardFooter />
</Card>
```

Composition scales better for large applications.

---

# Visual vs Business Logic

Design system components must **never fetch data or contain business logic**.

Bad:

```
<UserTable fetchUsers={...} />
```

Correct:

```
<DataTable rows={rows} columns={columns} />
```

Business logic belongs in **features or pages**.

---

# Accessibility Requirements

All components must include built-in accessibility support.

Required:

• semantic HTML
• keyboard navigation
• focus states
• aria attributes where necessary
• screen reader compatibility

Accessibility must be implemented **during component creation**, not later.

---

# Theming Strategy

Use **semantic tokens**.

Example:

```
--color-bg-primary
--color-text-primary
--color-border-muted
```

Components should use semantic tokens rather than raw colors.

This allows:

• dark mode
• white label themes
• design updates without component rewrites

---

# Hooks

Common reusable hooks belong in the design system.

Examples:

```
useBreakpoint
useThemeMode
useControllableState
useFocusVisible
```

Hooks should support component functionality but remain UI-agnostic.

---

# Utility Functions

Shared utilities improve consistency.

Examples:

```
cx.ts            // class merging
polymorphic.ts   // polymorphic components
accessibility.ts // aria helpers
```

---

# Versioning Strategy

Never silently change components in large systems.

Use:

• changelog
• deprecation warnings
• migration guides
• codemods when possible

Breaking changes must follow **semantic versioning**.

---

# Governance Model

Recommended ownership structure:

| Layer      | Ownership          |
| ---------- | ------------------ |
| Tokens     | Design + Platform  |
| Primitives | Frontend Platform  |
| Components | Design System Team |
| Patterns   | Design + Product   |
| Features   | Product Teams      |

This ensures proper architectural boundaries.

---

# Best Practices

Follow these principles consistently.

### Keep APIs Small

Small APIs are easier to maintain.

### Avoid Boolean Props

Prefer structured variants.

### Separate Layout and UI

Use primitives for layout, components for UI.

### Enforce Tokens

No hardcoded values inside components.

### Document Everything

Every component should have:

• usage examples
• prop documentation
• accessibility notes

Storybook is recommended.

---

# Example Usage

```
<PageHeader>
  <PageHeaderTitle>Dashboard</PageHeaderTitle>
  <PageHeaderActions>
    <Button variant="primary">Create</Button>
  </PageHeaderActions>
</PageHeader>
```

The page composes patterns and components without duplicating layout logic.

---

# Summary

A maintainable React design system requires strict layering.

```
Tokens
↓
Foundations
↓
Primitives
↓
Components
↓
Patterns
      ↓
Page Recipes
      ↓
Features
```

This architecture provides:

• predictable UI development
• consistent styling
• scalable component APIs
• easier onboarding for developers
• long-term maintainability

A design system that follows these rules remains stable even as applications grow to thousands of components.

---

# Related Docs

- [Design System Enforcement Checklist](./design-system-enforcement-checklist.md)
- [Miniapp Design System README](../README.md)
