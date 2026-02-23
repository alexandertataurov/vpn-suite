# Typography — VPN Suite Design System

Defined in `tokens/typography.json`, compiled to `src/theme/tokens.css`. Uses **fluid sizes** with `clamp()` and variable-friendly stacks.

## Font stacks

| Token | Stack |
|-------|--------|
| `--font-sans` | Inter Variable, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI Variable, system-ui, sans-serif |
| `--font-serif` | Charter, Iowan Old Style, Georgia, serif |
| `--font-mono` | JetBrains Mono Variable, SF Mono, Cascadia Code, Consolas, monospace |

## Fluid type scale

| Token | Approx. range | Use |
|-------|----------------|-----|
| `--font-size-xs` | 12–14px | Captions, badges |
| `--font-size-sm` | 14–16px | Secondary text |
| `--font-size-base` | 16–18px | Body |
| `--font-size-md` | 18–20px | Lead |
| `--font-size-lg` | 20–24px | Subheadings |
| `--font-size-xl` | 24–30px | Section titles |
| `--font-size-2xl` | 30–36px | Page titles |
| `--font-size-3xl` | 36–48px | Hero |
| `--font-size-4xl` | 48–60px | Display |
| `--font-size-5xl` | 60–72px | Hero large |

Base 16px, ratio 1.25 (Major Third). All use `clamp(min, preferred, max)`.

## Weights & line height

- **Weights:** `--font-weight-light` (300) … `--font-weight-extrabold` (800).
- **Line height:** `--line-height-tight` (1.25), `--line-height-snug` (1.375), `--line-height-normal` (1.5), `--line-height-relaxed` (1.625), `--line-height-loose` (2).
- **Letter spacing:** `--letter-spacing-tighter` … `--letter-spacing-widest`.

## Composite text styles

Use the `font` shorthand for consistent type:

| Token | Use |
|-------|-----|
| `--text-h1` … `--text-h6` | Headings |
| `--text-body-lg`, `--text-body`, `--text-body-sm` | Body |
| `--text-button-lg`, `--text-button`, `--text-button-sm` | Buttons |
| `--text-caption` | Captions |
| `--text-overline` | Overline (add `letter-spacing: var(--letter-spacing-wider); text-transform: uppercase;`) |

Example: `font: var(--text-h1);`

## Font loading

- **System fonts first:** No external font required; stack falls back to system-ui/sans-serif.
- **Variable fonts (optional):** If using Inter Variable or JetBrains Mono Variable, load via `<link>` or `@font-face` with `font-display: swap`. Prefer subset (e.g. latin) for performance.

## OpenType

In base/typography layer, consider:

```css
font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "tnum" 1;
```

For data/tables use `"tnum" 1` (tabular figures).
