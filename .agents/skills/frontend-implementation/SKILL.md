---
name: frontend-implementation
description: Use this skill when implementing or refactoring frontend UI in React/TypeScript projects, especially with Tailwind and a component library such as shadcn. Use it for pages, dashboards, forms, tables, settings screens, lists, detail views, and layout improvements. Do not use it for backend-only tasks, API design, database work, or open-ended visual exploration without implementation.
---

# Frontend Implementation Skill

You are implementing production-quality frontend UI, not inventing random aesthetics.

## Core objective

Build clean, consistent, shippable UI that:
- reuses the existing design system and component patterns
- keeps hierarchy obvious
- avoids visual clutter and unnecessary nesting
- works across common breakpoints
- includes real states, not just the happy path

## Default stack assumptions

Unless the repo clearly uses something else:
- React
- TypeScript
- Tailwind CSS
- existing local UI components
- shadcn-style composition patterns when available

Respect the repo first. Do not migrate frameworks or styling systems unless explicitly requested.

## Activation behavior

When invoked, follow this order:

1. Inspect the existing frontend patterns before writing code.
2. Identify the nearest matching components, layouts, and pages in the repo.
3. Reuse those patterns instead of inventing a new visual language.
4. Only then implement the requested screen or change.

## Hard rules

### 1) Do not "design from scratch" unless explicitly asked

If no design is provided:
- infer style from the repo
- keep the UI simple and restrained
- prefer familiar SaaS/product patterns over novelty

When design input exists, prefer it in this order:
1. explicit user instructions
2. Figma / screenshots / mocks
3. existing repo patterns
4. this skill's defaults

### 2) Reuse existing components first

Before creating a new component:
- search for an existing button, card, form field, modal, table, tabs, badge, empty state, or layout shell
- reuse and compose
- only create a new component if no close match exists

If creating a new component:
- keep it small
- keep props minimal
- name it by domain purpose, not visual trivia

### 3) Avoid common bad AI UI habits

Do not:
- nest cards inside cards unless there is a real information architecture reason
- add extra wrappers purely for decoration
- use too many accent surfaces
- introduce inconsistent padding or random spacing
- create oversized headers for simple views
- add multiple competing call-to-actions
- invent new colors, shadows, radii, or typography scales without approval

### 4) Prefer strong hierarchy over visual noise

For every screen:
- define one primary action
- define one page title
- make secondary actions visually secondary
- group related controls together
- keep labels and supporting text concise

### 5) Always implement real UI states

Every new or changed screen should consider:
- loading
- empty
- error
- disabled
- success/confirmation
- hover/focus/selected where relevant

If a state is not applicable, say so briefly in the final summary.

### 6) Responsive by default

Check at minimum:
- mobile / narrow width
- tablet / medium width
- desktop / wide width

Prevent:
- overflow
- broken button sizing
- collapsed table chaos
- unreadable density
- inconsistent stacking

### 7) Accessibility is part of done

Ensure:
- semantic structure where practical
- accessible labels for form controls
- visible focus states
- adequate contrast using repo tokens/utilities
- keyboard-friendly interaction for dialogs, menus, tabs, and forms

## Implementation workflow

For each task, follow this sequence:

### Step A — Read the terrain

Inspect:
- routing/layout structure
- nearby screens
- shared components
- UI primitives
- table/form/dialog conventions
- spacing and typography patterns
- lint/type/test commands if obvious

### Step B — Clarify the UI contract internally

Before coding, decide:
- what is the user trying to do on this screen?
- what is the primary action?
- what information is primary vs secondary?
- what states must exist?
- which existing components should be reused?

If the request is ambiguous, choose the simplest robust implementation that matches the repo and note the assumption afterward.

### Step C — Implement conservatively

Prefer:
- composition over abstraction
- local state over premature lifting
- readable JSX over clever indirection
- small presentational helpers over giant multipurpose components

Avoid unnecessary:
- useEffect
- useRef
- prop drilling
- custom hooks
- context
unless the task clearly benefits from them.

### Step D — Verify

Before finishing:
- run the relevant type/lint/test checks if available
- inspect for spacing/alignment issues
- inspect for obvious responsive issues
- inspect for missing states

## Visual defaults

When no stronger design signal exists, use these defaults:
- restrained layout
- clear spacing rhythm
- one primary CTA
- subtle sectioning
- clean tables and forms
- concise copy
- moderate border radius
- avoid decorative chrome

Think "usable product UI" before "fancy mockup".

## Tables

For tables:
- prioritize readability over density unless the repo is clearly dense
- align numeric columns consistently
- keep actions predictable
- truncate long values carefully
- support empty state and loading state
- do not turn every row into a carnival of badges and icons

## Forms

For forms:
- group related fields
- keep labels explicit
- use helper/error text consistently
- avoid excessive columns on narrow screens
- make the submit action obvious

## Dashboards

For dashboards:
- start from the decision the user needs to make
- do not add widgets just to fill space
- prefer a few meaningful panels over many weak ones
- avoid repetitive cards with tiny differences

## References

Read [references/frontend-style-guide.md](references/frontend-style-guide.md) for style guardrails.
Read [references/ui-checklist.md](references/ui-checklist.md) before closing the task.

## Final response contract

At the end of the task, provide a short summary with:
- what changed
- which existing components/patterns were reused
- any assumptions made
- any states or responsive cases checked
- any known UI debt left intentionally unchanged
