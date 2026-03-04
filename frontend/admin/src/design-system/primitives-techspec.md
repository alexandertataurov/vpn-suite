Technical Specification
Primitives Design System — Component Library
Version 1.0  ·  Dark Terminal Aesthetic  ·  HTML/CSS  ·  Zero Dependencies


1. Overview
Primitives is a zero-dependency, single-file HTML/CSS component library implementing a dark terminal design aesthetic. All components are built on CSS custom properties (design tokens), IBM Plex Mono for UI text, and IBM Plex Sans for body copy. The system is designed to be consumed directly by AI agents for UI generation, design scaffolding, and component composition tasks.

1.1 Design Philosophy
•	Dark-first: all colors are calibrated for dark backgrounds only
•	Monospace-forward: IBM Plex Mono is the primary UI typeface for all interactive elements
•	Token-driven: every color, spacing, and radius value is a CSS custom property
•	Zero dependencies: no JavaScript frameworks, no icon libraries, no build tools required
•	Semantic-first: component variants map to operational states (success/warning/danger/info)

1.2 File Structure
primitives.html          // Complete single-file implementation
  ├── <style>            // All CSS tokens + component styles
  │     ├── :root {}     // Design token declarations
  │     ├── .btn         // Button component
  │     ├── .input       // Input / Textarea / Select
  │     ├── .checkbox-wrap, .radio-wrap, .toggle-wrap
  │     ├── .badge       // Badge + count badge
  │     ├── .tag         // Tag/chip component
  │     ├── .alert       // Alert/callout component
  │     ├── .progress-*  // Progress bar
  │     ├── .stat-card   // Stat card
  │     ├── .skeleton    // Skeleton loader
  │     └── .divider     // Divider variants
  └── <body>             // Live component demonstrations

2. Design Tokens
All design decisions are encoded as CSS custom properties on :root. Tokens must never be overridden with hardcoded values in component rules.

2.1 Color Tokens — Surface & Background
TOKEN	DEFAULT	USAGE
--bg	#0D0F10	Root page background. Deepest layer. Never use on components.
--surface-1	#121618	Component backgrounds: inputs, cards, stat cards.
--surface-2	#171B1E	Elevated surfaces: hover states, adornments, tooltip backgrounds.
--surface-3	#1D2226	Active/pressed states, deep sections.
--surface-4	#232A2F	Deepest inset surfaces (v2/extended).
--border-subtle	#1E2428	Hairline separators, section dividers.
--border-default	#252B30	Default border on all interactive components.
--border-bright	#2E363C	Hover/focused borders, emphasis borders.
--border-focus	#3A8CFF	Focus rings on all focusable elements. 2px box-shadow.

2.2 Color Tokens — Text
TOKEN	DEFAULT	USAGE
--text-primary	#C8D2DA	Headings, stat values, emphasized content.
--text-secondary	#8A9AA8	Body text, labels, input values.
--text-muted	#4E5E6A	Placeholders, hints, metadata, section labels.
--text-disabled	#313C44	Disabled component text.
--text-inverse	#0D0F10	Text on solid interactive backgrounds (btn-solid).

2.3 Semantic Color Tokens
Each semantic color has three associated tokens: the base color, a dim background (8% opacity equivalent), and a border color (20–22% opacity; interactive uses 22%).

NAME	BASE TOKEN	HEX	ALSO EXPORTS
success	--success	#3DBA6A	--success-dim, --success-border
warning	--warning	#E8A020	--warning-dim, --warning-border
danger	--danger	#E85050	--danger-dim, --danger-border
info	--info	#4A9EE8	--info-dim, --info-border
accent	--accent	#A070E8	--accent-dim, --accent-border
interactive	--interactive	#3A8CFF	--interactive-dim, --interactive-border

3. Typography
3.1 Font Families
TOKEN	FAMILY	USAGE
--font-mono	IBM Plex Mono	All UI labels, button text, badge text, input values, code, section labels. Loaded from Google Fonts.
--font-sans	IBM Plex Sans	Alert descriptions, hint text, body copy, descriptions. Supports weight 300 (light) for large body text.

3.2 Typographic Roles in React
When building React components in the admin app, apply the following CSS classes from `src/design-system/typography.css`:

- **Page / shell titles**: `type-h1` on mission bar title (`.mission-bar__title`) and primary page headings.
- **Section headings**: `type-h2`/`type-h3` on page-level `h2`/`h3` (e.g. dashboard sections, side panel titles).
- **Card / widget titles**: `type-h4` on card titles such as overview widgets (“Sessions”, “Telemetry”, “API latency”).
- **Body copy**: `type-body` for standard body text; `type-body-sm`/`type-body-xs` for secondary copy and captions.
- **Navigation**: `type-nav` on nav labels (e.g. `.nav-rail__label`), `type-badge` on compact nav codes (`.nav-rail__short`).
- **Metadata & timestamps**: `type-meta` on “Last updated…” lines and similar status/meta text.
- **KPI values & numbers**: `type-data-xl`/`type-data-lg`/`type-data-md` on primary KPI values, badges, and table numeric columns.
- **Deltas / trends**: `type-delta` on change indicators, combined with contextual classes for up/down/flat state.
- **Login / auth**: `type-display-sm` or `type-h1` on the product name; `type-h3` on “Sign in” or similar subheadings.

3.2 Type Scale
ROLE	SIZE	TRACKING	USAGE
section-label	9px	0.14em	Section headers, component category labels. Uppercase.
badge-sm	9px	0.09em	Small badges. Uppercase mono.
badge-md	10px	0.07em	Default badge. Uppercase mono.
btn-sm	9px	0.08em	Small buttons. Uppercase mono.
btn-md	10px	0.08em	Default button size. Uppercase mono.
btn-lg	11px	0.08em	Large button. Uppercase mono.
input	11px	0.00em	Input values, textarea. Mixed case mono.
body	12px	0.00em	Alert descriptions, hints. Sans light.
stat-value	22px	−0.02em	Stat card primary number. Mono bold.

4. Component Specifications
4.1 Button
Buttons are the primary interactive trigger. All variants use monospace uppercase text and share consistent height/padding across sizes.

Props / Classes
PROP	TYPE	REQ	DESCRIPTION
variant	"default" | "primary" | "solid" | "ghost" | "success" | "warning" | "danger"	—	Visual style. Applied as .btn-{variant} alongside .btn.
size	"sm" | "md" | "lg"	—	Height: 24/30/38px. Applied as .btn-{size}. Defaults to md.
disabled	boolean (HTML attr)	—	Reduces opacity to 0.3, blocks pointer events.
icon-only	boolean (class)	—	Add .btn-icon-only for square aspect ratio icon buttons.

State Styles
STATE	CSS CLASS	BEHAVIOR
default	(base)	border-color: --border-bright, background: --surface-2
hover	:hover	background lightens by one surface step
active	:active	background darkens by one surface step
focus	:focus-visible	box-shadow: 0 0 0 2px --border-focus
disabled	[disabled]	opacity: 0.3, pointer-events: none, cursor: not-allowed

Height & Padding
.btn-sm  { height: 24px; padding: 0 10px; font-size: 9px; }
.btn-md  { height: 30px; padding: 0 14px; font-size: 10px; }
.btn-lg  { height: 38px; padding: 0 18px; font-size: 11px; }

4.2 Input
Input fields use monospace text for values, with semantic border-color states for validation feedback.

Props / Classes
PROP	TYPE	REQ	DESCRIPTION
type	HTML input type	✓	text, email, password, number, etc.
state	"is-error" | "is-success"	—	Adds colored border + shadow. Use with .input-hint for message.
disabled	HTML attr	—	opacity 0.35, cursor not-allowed
adornment	Input group pattern	—	Wrap in .input-group with .input-adornment.left or .right

Validation States
// Error state
.input.is-error { border-color: var(--danger-border); }
.input.is-error:focus { border-color: var(--danger); box-shadow: 0 0 0 2px var(--danger-dim); }

// Success state
.input.is-success { border-color: var(--success-border); }
.input.is-success:focus { border-color: var(--success); box-shadow: 0 0 0 2px var(--success-dim); }

Adornment Pattern
<div class="input-group">
  <span class="input-adornment left">https://</span>
  <input type="text" class="input" placeholder="your.domain.io">
</div>

4.3 Badge
Badges are compact read-only labels. They always use uppercase monospace text, a 2px border-radius, a semantic tinted background fill (6–8% opacity), and a matching border.

Props / Classes
PROP	TYPE	REQ	DESCRIPTION
variant	"neutral" | "success" | "warning" | "danger" | "info" | "accent"	—	Semantic color. Applied as .badge-{variant}.
size	"sm" | "md" | "lg"	—	9/10/11px. Applied as .badge-{size}.
pulse	boolean (child class)	—	Add <span class="dot pulse"></span> as first child for live status.
count	boolean (element class)	—	Use .badge-count instead of .badge for numeric values.

Pulse Animation
// Pulse dot uses currentColor for the ring, variant sets the color
@keyframes pulse-badge {
  0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  60%  { box-shadow: 0 0 0 4px transparent; opacity: 0.6; }
  100% { box-shadow: 0 0 0 0 transparent; opacity: 1; }
}

// Usage
<span class="badge badge-md badge-success">
  <span class="dot pulse"></span>Online
</span>

4.4 Toggle
Toggles use a CSS-only checkbox pattern. The visual track and thumb are sibling spans of the hidden checkbox input, controlled entirely via the :checked pseudo-class and adjacent sibling combinator.

HTML Structure
<label class="toggle-wrap [success|danger]">
  <input type="checkbox" class="toggle-input" [checked] [disabled]>
  <span class="toggle-track">
    <span class="toggle-thumb"></span>
  </span>
  <span class="toggle-label">Label text</span>
</label>

State Mechanism
// Off state: thumb is at left: 2px
// On state: thumb translates right by 16px
.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(16px);
  background: var(--interactive);
}

// Success variant overrides thumb color
.toggle-wrap.success .toggle-input:checked + .toggle-track .toggle-thumb {
  background: var(--success);
}

4.5 Alert
Alerts are read-only informational panels with an icon, title, and description. The left accent comes from the semantic border color.

HTML Structure
<div class="alert [info|success|warning|danger]">
  <span class="alert-icon">ℹ</span>
  <div class="alert-body">
    <div class="alert-title">Title</div>
    <div class="alert-desc">Description text here.</div>
  </div>
</div>

Icon Glyphs by Variant
VARIANT	GLYPH	UNICODE
info	ℹ	U+2139
success	✓	U+2713
warning	⚠	U+26A0
danger	✕	U+2715

5. Accessibility
5.1 Focus Management
All interactive elements expose :focus-visible styles using a 2px box-shadow with --border-focus (#3A8CFF). This avoids showing focus rings on mouse click while ensuring keyboard visibility.

.btn:focus-visible,
.input:focus,
.checkbox-wrap input:focus-visible,
.radio-wrap input:focus-visible,
.toggle-input:focus-visible + .toggle-track {
  box-shadow: 0 0 0 2px rgba(58, 140, 255, 0.2);
  /* or border-color: var(--border-focus) for inputs */
}

5.2 ARIA Requirements
COMPONENT	ARIA ATTRIBUTE	NOTES
Button (icon-only)	aria-label="[action]"	Required when no visible text. e.g. aria-label="Delete"
Input	aria-describedby="hint-id"	Connect hint text to input via id reference
Input (error)	aria-invalid="true"	Apply when .is-error class is active
Checkbox (indet.)	aria-checked="mixed"	Set via JS: element.indeterminate = true
Badge (pulse)	aria-label="[status]"	e.g. aria-label="Status: Online"
Tag (remove)	aria-label="Remove [name]"	On the × button inside .tag
Progress	role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax	Required on .progress-track

6. Anti-Patterns
The following patterns are explicitly prohibited and will break the design system's visual consistency.

❌  DO NOT		✓  DO INSTEAD
Hardcode color values (color: #3DBA6A)		Use tokens: color: var(--success)
Use inline styles for spacing/sizing		Use token-based utility or component classes
Mix sans-serif and mono on the same label		Buttons/badges: mono only. Descriptions: sans only.
Use border-radius > 3px on any component		Max radius: --r-sm (2px) for components, --r-md (3px) for cards
Add box-shadows as depth/elevation cues		Use border-color changes and surface color steps for elevation
Use light backgrounds on any component		System is dark-only; all surfaces must be --bg or --surface-*
Add color to component fills > 10% opacity		Semantic fills cap at 8% opacity (--success-dim, etc.)
Use Inter, Roboto, or system-ui		Use IBM Plex Mono (UI) and IBM Plex Sans (body) exclusively

7. Usage with AI Agents
This document is structured to be directly referenceable in AI agent prompts. When generating UI with this design system, the agent should apply the following rules.

7.1 Class Naming Conventions
// Pattern: .{component}[-{modifier}][-{variant}]
.btn                      // base class, always required
.btn-md                   // size modifier
.btn-primary              // variant modifier

.badge                    // base
.badge-md .badge-success  // size + variant

.input                    // base
.input.is-error           // state modifier (note: no dash)

7.2 Prompt Template for Component Generation
// Use this template when prompting an AI agent to generate UI:
// ----------------------------------------------------------------
// "Using the Primitives design system (dark terminal aesthetic,
//  IBM Plex Mono, CSS tokens), generate a [component] with:
//  - variant: [neutral|success|warning|danger|info|accent]
//  - size: [sm|md|lg]
//  - state: [default|error|success|disabled|pulse]
//  Follow the class naming convention .{component}-{size}-{variant}"

7.3 Token Reference Summary for Prompts
When including token context in a prompt, use the following condensed reference:

PRIMITIVES TOKENS (condensed for AI context):
bg=#0D0F10, surface1=#121618, surface2=#171B1E, surface3=#1D2226
border=#252B30, border-bright=#2E363C, focus=#3A8CFF
text=#C8D2DA, text-sec=#8A9AA8, text-muted=#4E5E6A
success=#3DBA6A, warning=#E8A020, danger=#E85050, info=#4A9EE8, accent=#A070E8
font-mono='IBM Plex Mono', font-sans='IBM Plex Sans'
radius: 2px (components), 3px (cards)
transitions: 0.1s (colors), 0.15s (transforms)



Primitives Design System — Technical Specification v1.0
Dark Terminal Aesthetic · Zero Dependencies · Token-Driven · AI-Ready
