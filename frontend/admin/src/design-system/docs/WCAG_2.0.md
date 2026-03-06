# WCAG 2.0 UI Compliance Guide
Accessibility Implementation Checklist for UI Systems

Version: WCAG 2.0  
Recommended Target Level: **AA**

---

# Overview

WCAG (Web Content Accessibility Guidelines) defines how to make digital interfaces accessible for people with disabilities.

WCAG 2.0 is structured around **4 core principles**:

| Principle | Meaning |
|----------|--------|
| Perceivable | Users must be able to perceive the information |
| Operable | Users must be able to operate the interface |
| Understandable | UI and interactions must be understandable |
| Robust | Content must work with assistive technologies |

These principles are divided into **12 guidelines** and **61 success criteria** across three compliance levels:

| Level | Meaning |
|------|--------|
| A | Minimum accessibility requirements |
| AA | Industry standard (recommended) |
| AAA | Advanced accessibility |

Most production applications target **WCAG 2.0 AA**.

---

# 1. Perceivable

Users must be able to perceive all UI content.

---

## 1.1 Text Alternatives

### 1.1.1 Non-text Content (A)

All non-text content must have a text alternative.

Examples:

- Images → `alt` text
- Icons → accessible labels
- Graphs → textual explanation
- Decorative images → `alt=""`

Example:

```html
<img src="chart.png" alt="Revenue growth chart from 2021 to 2024">
````

---

## 1.2 Time-based Media

### 1.2.1 Audio-only / Video-only (Prerecorded) (A)

Provide alternative content for audio-only or video-only media.

### 1.2.2 Captions (Prerecorded) (A)

All prerecorded videos must include captions.

### 1.2.3 Audio Description (Prerecorded) (A)

Provide audio descriptions when visual information is not obvious.

### 1.2.4 Captions (Live) (AA)

Live video streams must support captions.

### 1.2.5 Audio Description (AA)

Audio description for prerecorded video content.

### AAA criteria

* Sign language
* Extended audio descriptions
* Full text alternatives

---

## 1.3 Adaptable

Content must be structured so assistive technologies can interpret it.

### 1.3.1 Info and Relationships (A)

Use semantic HTML.

Examples:

Good:

```html
<h1>Main Title</h1>
<h2>Section</h2>
```

Bad:

```html
<div class="title-large">Main Title</div>
```

---

### 1.3.2 Meaningful Sequence (A)

Content must remain logical when read by screen readers.

---

### 1.3.3 Sensory Characteristics (A)

Instructions must not rely only on sensory characteristics.

Bad:

> Click the red button.

Good:

> Click the **Submit button** below.

---

## 1.4 Distinguishable

Content must be easily distinguishable.

### 1.4.1 Use of Color (A)

Color must not be the only way to convey information.

Example:

Bad:

* Error message shown only in red.

Good:

* Red + icon + text.

---

### 1.4.2 Audio Control (A)

Audio playing automatically for more than **3 seconds** must provide controls.

---

### 1.4.3 Contrast Minimum (AA)

Text contrast ratio must be:

| Text Type   | Ratio     |
| ----------- | --------- |
| Normal text | **4.5:1** |
| Large text  | **3:1**   |

---

### 1.4.4 Resize Text (AA)

Users must be able to resize text up to **200%** without loss of functionality.

---

### 1.4.5 Images of Text (AA)

Avoid images containing text unless necessary.

---

### AAA (advanced)

* Enhanced contrast
* Adjustable background audio
* Customizable layout

---

# 2. Operable

Users must be able to interact with the interface.

---

## 2.1 Keyboard Accessible

### 2.1.1 Keyboard (A)

All functionality must be usable via keyboard.

Example keys:

* Tab
* Enter
* Space
* Arrow keys

---

### 2.1.2 No Keyboard Trap (A)

Users must be able to move focus away from any component.

---

### 2.1.3 Keyboard (AAA)

All interactions must be fully keyboard accessible.

---

## 2.2 Enough Time

Users must have enough time to read and interact.

### 2.2.1 Timing Adjustable (A)

Allow users to extend time limits.

---

### 2.2.2 Pause / Stop / Hide (A)

Moving or blinking content must be controllable.

Examples:

* sliders
* auto-updating feeds
* animations

---

## 2.3 Seizures

### 2.3.1 Three Flashes Rule (A)

Content must not flash more than **3 times per second**.

---

## 2.4 Navigable

Interfaces must support clear navigation.

---

### 2.4.1 Bypass Blocks (A)

Provide **skip navigation links**.

Example:

```html
<a href="#main-content">Skip to content</a>
```

---

### 2.4.2 Page Titled (A)

Each page must have a meaningful title.

---

### 2.4.3 Focus Order (A)

Focus must follow logical reading order.

---

### 2.4.4 Link Purpose (A)

Links must describe their destination.

Bad:

```
Click here
```

Good:

```
Download annual report
```

---

### 2.4.5 Multiple Ways (AA)

Provide multiple navigation methods:

* search
* sitemap
* menu

---

### 2.4.6 Headings and Labels (AA)

Headings must clearly describe sections.

---

### 2.4.7 Focus Visible (AA)

Keyboard focus must be visually visible.

Example CSS:

```css
:focus {
  outline: 3px solid #005fcc;
}
```

---

# 3. Understandable

Users must understand both content and behavior.

---

## 3.1 Readable

### 3.1.1 Language of Page (A)

Declare page language.

```html
<html lang="en">
```

---

### 3.1.2 Language of Parts (AA)

Specify language changes inside content.

---

## 3.2 Predictable

### 3.2.1 On Focus (A)

Elements must not trigger unexpected actions on focus.

---

### 3.2.2 On Input (A)

Changing form inputs must not automatically trigger navigation.

---

### 3.2.3 Consistent Navigation (AA)

Navigation components must remain consistent across pages.

---

### 3.2.4 Consistent Identification (AA)

UI components with the same function must be labeled consistently.

---

## 3.3 Input Assistance

Forms must help users avoid and correct mistakes.

---

### 3.3.1 Error Identification (A)

Errors must be clearly identified.

---

### 3.3.2 Labels or Instructions (A)

All form fields must include labels.

Example:

```html
<label for="email">Email address</label>
<input id="email" type="email">
```

---

### 3.3.3 Error Suggestion (AA)

Provide suggestions to fix errors.

Example:

> Password must include at least 8 characters.

---

### 3.3.4 Error Prevention (AA)

Important transactions must allow:

* confirmation
* review
* cancellation

---

# 4. Robust

Content must work with assistive technologies.

---

## 4.1 Compatible

### 4.1.1 Parsing (A)

HTML must be valid.

Avoid:

* duplicate IDs
* broken tags
* invalid nesting

---

### 4.1.2 Name, Role, Value (A)

All UI components must expose accessibility information.

Example:

```html
<button aria-label="Close dialog">
  ×
</button>
```

---

# Engineering Implementation Rules

## Must Pass

All UI components must support:

* keyboard navigation
* visible focus
* ARIA roles where necessary
* semantic HTML

---

## Required Accessibility Testing

Tools:

* Lighthouse
* axe DevTools
* NVDA / VoiceOver
* keyboard-only navigation

---

## Design System Rules

Components must guarantee:

| Component  | Requirement             |
| ---------- | ----------------------- |
| Buttons    | keyboard accessible     |
| Forms      | labels + error messages |
| Navigation | logical focus order     |
| Icons      | accessible names        |
| Charts     | textual descriptions    |

---

# Recommended Accessibility Workflow

1. Design phase → check contrast and readability
2. Development → semantic HTML + ARIA
3. Automated audit → Lighthouse / axe
4. Manual testing → keyboard + screen reader
5. CI pipeline accessibility checks

---

# Compliance Target

| Level | Recommendation                  |
| ----- | ------------------------------- |
| A     | Minimum baseline                |
| AA    | **Production standard**         |
| AAA   | Optional advanced accessibility |

---

# Summary

To achieve WCAG 2.0 AA compliance:

Ensure:

* Proper contrast
* Full keyboard accessibility
* Visible focus indicators
* Semantic HTML structure
* Accessible form inputs
* ARIA labels for custom components
* Clear navigation and headings

---

# UI Accessibility Design Rules (WCAG 2.0 AA Practical Implementation)

This section turns WCAG requirements into enforceable design system + frontend rules (fonts, contrast tokens, focus rings, hit areas, and layout resilience).
**This is where most teams win or lose accessibility in production.**

---

## 1) Typography Rules

### Minimum Font Sizes

| Text Type      | Minimum Size | Recommended |
| -------------- | ------------ | ----------- |
| Body text      | **16px**     | 16–18px     |
| Secondary text | **14px**     | 14–16px     |
| Caption text   | **12px**     | 13–14px     |
| Headings       | **20px+**    | 24–48px     |

Rules:

* **Never go below 12px.**
* Prefer using `rem` units so user text scaling works.

### Line Height

| Text Size     | Line Height   |
| ------------- | ------------- |
| Body          | **1.5 – 1.7** |
| Headings      | **1.2 – 1.4** |
| Dense UI text | **1.4**       |

Bad:

```css
line-height: 1.1;
```

Good:

```css
line-height: 1.6;
```

### Maximum Line Length (Readability)

Target:

* **45–75 characters per line** for paragraph content
* Use narrower containers for contracts / long-form text

---

## 2) Color Contrast Rules

### Text Contrast (WCAG 2.0 AA)

| Text                                                   | Minimum Contrast |
| ------------------------------------------------------ | ---------------- |
| Body text                                              | **4.5 : 1**      |
| Large text (18px+ regular OR 14px+ bold)               | **3 : 1**        |
| UI component boundaries (inputs, buttons, focus rings) | **3 : 1**        |

### Disabled Text

Rule:

* Disabled text must remain readable; target **≥ 3:1** where possible.

### Error / Success / Warning

Rule:

* Never rely on color alone.
* Use **Color + Icon + Text** (and for forms: `aria-describedby`).

Example:

* ❌ “Invalid email address”
* ✅ “Payment confirmed”

---

## 3) Focus Visibility Rules (Keyboard)

Rules:

* Never remove focus outlines globally.
* Use `:focus-visible` to avoid noisy mouse focus.

Recommended CSS:

```css
:focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 2px;
}
```

Minimum:

* Focus indicator must be **clearly visible** on all backgrounds.
* Focus must be visible for: links, buttons, inputs, custom controls, menus, modals.

---

## 4) Click / Touch Target Sizes (Motor Accessibility)

Rule of thumb (production-friendly):

* Primary target size: **44 × 44 px**

| Element           | Minimum Size                           |
| ----------------- | -------------------------------------- |
| Buttons           | **44 × 44 px**                         |
| Icon buttons      | **40 × 40 px**                         |
| Links in dense UI | **32px min height** + adequate spacing |

---

## 5) Spacing Resilience (Text Spacing Overrides)

UI must not break when users apply spacing overrides.

Support at minimum:

* Line height: **1.5**
* Paragraph spacing: **2× font size**
* Letter spacing: **0.12em**
* Word spacing: **0.16em**

Rule:

* Content must not clip, overlap, or become unusable under these conditions.

---

## 6) Motion & Animation

Rules:

* Avoid flashing (already covered by 2.3.1).
* Reduce motion when the OS requests it.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 7) Forms (Contracts, Checkout, Legal Flows)

This is where accessibility + revenue risk meet.

### Required for every input

* Visible `<label>` (or programmatic label for custom controls)
* Clear helper text where needed
* Clear error message bound with `aria-describedby`
* Error summary at top for multi-field forms (recommended)

Example:

```html
<label for="email">Email address</label>
<input id="email" type="email" aria-describedby="email-help email-error">

<div id="email-help">We’ll send receipts here.</div>
<div id="email-error">Invalid email address.</div>
```

### Error Prevention for Legal/Financial/Data (WCAG 3.3.4 AA)

For contracts, payments, and irreversible actions, provide at least one:

* Review step / confirmation screen
* Ability to correct errors before final submit
* Cancel / undo where feasible

Practical pattern:

* “Review & confirm” screen with clear summary + edit links.

---

## 8) Layout Rules (Zoom & Reflow)

Rules:

* Must remain usable at **200% zoom** without losing functionality.
* Avoid horizontal scrolling for primary content where possible.

Practical guidance:

* At high zoom, layouts should naturally reflow into a single column.
* Sticky headers/sidebars must not block content.

---

## 9) Icon Accessibility

Rules:

* Interactive icons require accessible names:

  * `aria-label` or visible text
* Decorative icons:

  * `aria-hidden="true"` and not focusable

Example (interactive):

```html
<button aria-label="Close dialog">×</button>
```

Example (decorative):

```html
<span aria-hidden="true">★</span>
```

---

## 10) Charts & Data Visualization

Rules:

* Provide a textual summary of key insight(s).
* Provide a table view or downloadable data for complex charts (recommended).

Example summary:

* “Revenue increased from $1.0M to $2.5M between 2021 and 2024.”

---

## 11) Contracts & Long-form Legal Text (High-impact UI)

This is where “font sizes, spacing, readability” actually matters.

### Readability defaults (recommended baseline)

* Body: **16–18px**
* Line-height: **1.6–1.8**
* Max width: **60–80ch**
* Provide clear headings + anchored TOC for long docs (recommended)
* Use bullet/numbered lists for obligations and exceptions

### Interaction rules

* Provide **download as PDF** and/or “copy link to clause” (optional but very practical)
* Ensure links to terms open in a way that preserves context (new tab is fine, but don’t trap users)
* If you use sticky “Accept” bars, ensure they:

  * don’t cover content at 200% zoom
  * are reachable by keyboard
  * have visible focus states

### Consent / Acceptance

* Use explicit checkbox text (not vague):

  * “I have read and accept the Terms of Service.”
* Provide inline access to the referenced terms (and keep it accessible).

---

## 12) Testing & CI Enforcement (Make it real)

### Manual must-pass

* Keyboard-only navigation: every flow end-to-end
* Screen reader spot-check on critical flows:

  * signup/login
  * payments/checkout
  * contracts/terms acceptance
  * account settings
* Zoom at 200% on key pages
* Focus visible everywhere

### Automated must-pass

* No axe critical violations
* Lighthouse accessibility score target: **≥ 90** (aim), but treat **axe** as truth for failures

---

## Production Rule

Accessibility must be enforced **inside the design system**, not “fixed per page”.

Rule:

* If a component is shipped in the system, it must be accessible by default:

  * keyboard
  * focus
  * name/role/value
  * error messaging (forms)
  * contrast

