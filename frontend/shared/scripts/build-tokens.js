#!/usr/bin/env node
/**
 * Build design tokens from JSON → tokens.css
 * Run from frontend/shared: node scripts/build-tokens.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOKENS_DIR = path.join(ROOT, 'tokens');
const OUT_CSS = path.join(ROOT, 'src', 'theme', 'tokens.css');

function loadJson(name) {
  const p = path.join(TOKENS_DIR, name + '.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function resolveRef(primitives, ref) {
  if (typeof ref !== 'string') return ref;
  const [palette, shade] = ref.split('.');
  const pal = primitives[palette];
  if (!pal) return ref;
  const val = pal[shade];
  return val != null ? val : ref;
}

function flattenPrimitives(primitives, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(primitives)) {
    const key = prefix ? `${prefix}-${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && (typeof Object.values(v)[0] !== 'object')) {
      for (const [s, val] of Object.entries(v)) out[`${key}-${s}`] = val;
    } else {
      out[key] = v;
    }
  }
  return out;
}

function buildColorPrimitives(primitives) {
  const flat = flattenPrimitives(primitives);
  const lines = [];
  for (const [name, value] of Object.entries(flat)) {
    if (typeof value !== 'string') continue;
    const varName = '--color-' + name.replace(/^([a-z]+)-/, '$1-');
    lines.push(`  ${varName}: ${value};`);
  }
  return lines.join('\n');
}

function buildSemanticColors(primitives, semantic) {
  const lines = [];
  const resolve = (ref) => resolveRef(primitives, ref);

  const map = {
    bg: semantic.background?.primary,
    surface: semantic.background?.secondary,
    'surface-2': semantic.background?.tertiary,
    overlay: semantic.background?.overlay,
    text: semantic.text?.primary,
    'text-muted': semantic.text?.secondary,
    'text-tertiary': semantic.text?.tertiary,
    'text-inverse': semantic.text?.inverse,
    border: semantic.border?.default,
    'border-subtle': semantic.border?.subtle,
    'border-strong': semantic.border?.strong,
    accent: semantic.interactive?.default,
    'accent-hover': semantic.interactive?.hover,
    'accent-active': semantic.interactive?.active,
    'on-accent': semantic.onPrimary,
    'focus-ring': semantic.focus?.ring,
  };
  for (const [cssName, ref] of Object.entries(map)) {
    if (!ref) continue;
    const val = resolve(ref);
    lines.push(`  --color-${cssName}: ${val};`);
  }
  if (semantic.status) {
    lines.push(`  --color-success: ${resolve(semantic.status.success)};`);
    lines.push(`  --color-warning: ${resolve(semantic.status.warning)};`);
    lines.push(`  --color-error: ${resolve(semantic.status.error)};`);
    lines.push(`  --color-info: ${resolve(semantic.status.info)};`);
    lines.push(`  --color-connected: ${resolve(semantic.status.connected)};`);
    lines.push(`  --color-syncing: ${resolve(semantic.status.syncing)};`);
  }
  return lines.join('\n');
}

function getPrimitiveVar(ref) {
  const [palette, shade] = ref.split('.');
  return `var(--color-${palette}-${shade})`;
}

const toKebab = (s) => s.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');

function buildCss() {
  const colors = loadJson('colors');
  const typography = loadJson('typography');
  const spacing = loadJson('spacing');
  const effects = loadJson('effects');

  const primitives = colors.primitives;
  const flatPrim = flattenPrimitives(primitives);
  const primVars = {};
  for (const [k, v] of Object.entries(flatPrim)) {
    if (typeof v === 'string') primVars[k] = v;
  }

  function resolveColor(ref) {
    if (typeof ref !== 'string') return ref;
    if (ref.includes('oklch') && ref.includes('/')) return ref;
    const [palette, shade] = ref.split('.');
    const key = palette + '-' + shade;
    return primVars[key] || ref;
  }

  const out = [];
  out.push('/* Design Tokens — VPN Suite Design System (generated from tokens/*.json) */');
  out.push('/* Theme: data-theme on <html>. Build: node scripts/build-tokens.js */');
  out.push('');

  // ---------- Default (dark) + primitives
  out.push('html,');
  out.push('html[data-theme="dark"] {');
  out.push('  color-scheme: dark;');
  out.push('  /* ========== PRIMITIVES ========== */');
  for (const [name, value] of Object.entries(primVars)) {
    out.push(`  --color-${name}: ${value};`);
  }
  out.push('  /* ========== SEMANTIC (dark) ========== */');
  out.push(buildSemanticColors(primitives, colors.semantic.dark));
  out.push('  /* Surfaces (compat) */');
  out.push('  --surface-glass: oklch(from var(--color-background-secondary) l c h / 0.85);');
  out.push('  --surface-raised: var(--color-background-tertiary);');
  out.push('  --surface-overlay: var(--color-background-overlay);');
  out.push('  --color-primary-subtle: oklch(from var(--color-accent) l c h / 0.1);');
  out.push('  /* Focus */');
  out.push('  --focus-ring: 0 0 0 3px oklch(from var(--color-accent) l c h / 0.3);');
  out.push('  --border-glass: oklch(1 0 0 / 0.08);');
  out.push('}');
  out.push('');

  const isLightTheme = (name) => name === 'light' || name.endsWith('-light');

  const buildThemeBlock = (themeName, semantic) => {
    out.push(`html[data-theme="${themeName}"] {`);
    out.push(`  color-scheme: ${isLightTheme(themeName) ? 'light' : 'dark'};`);
    out.push(buildSemanticColors(primitives, semantic));
    out.push('  --surface-glass: oklch(from var(--color-surface) l c h / 0.9);');
    out.push('  --surface-raised: var(--color-surface-2);');
    out.push('  --surface-overlay: var(--color-overlay);');
    out.push('  --color-primary-subtle: oklch(from var(--color-accent) l c h / 0.1);');
    out.push('  --focus-ring: 0 0 0 3px oklch(from var(--color-accent) l c h / 0.3);');
    out.push(`  --border-glass: ${isLightTheme(themeName) ? 'oklch(0 0 0 / 0.06)' : 'oklch(1 0 0 / 0.08)'};`);
    if (isLightTheme(themeName)) {
      out.push('  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);');
      out.push('  --shadow-md: 0 4px 6px -1px oklch(0% 0 0 / 0.07), 0 2px 4px -2px oklch(0% 0 0 / 0.07);');
      out.push('  --shadow-lg: 0 10px 15px -3px oklch(0% 0 0 / 0.08), 0 4px 6px -4px oklch(0% 0 0 / 0.05);');
    }
    out.push('}');
    out.push('');
  };

  // ---------- Additional themes (semantic-only)
  // NOTE: dark is handled above as default + primitives.
  for (const [themeName, semantic] of Object.entries(colors.semantic)) {
    if (themeName === 'dark') continue;
    buildThemeBlock(themeName, semantic);
  }

  // ---------- prefers-contrast
  out.push('@media (prefers-contrast: high) {');
  out.push('  html {');
  out.push('    --color-text-primary: oklch(0 0 0);');
  out.push('    --color-text-secondary: oklch(0.2 0 0);');
  out.push('  }');
  out.push('  html[data-theme="dark"] {');
  out.push('    --color-text-primary: oklch(1 0 0);');
  out.push('    --color-text-secondary: oklch(0.85 0 0);');
  out.push('  }');
  out.push('}');
  out.push('');

  // ---------- forced-colors
  out.push('@media (forced-colors: active) {');
  out.push('  html {');
  out.push('    --color-bg: Canvas;');
  out.push('    --color-surface: Canvas;');
  out.push('    --color-text: CanvasText;');
  out.push('    --color-text-muted: CanvasText;');
  out.push('    --color-accent: LinkText;');
  out.push('    --color-accent-hover: LinkText;');
  out.push('    --color-focus-ring: CanvasText;');
  out.push('    --color-border: CanvasText;');
  out.push('  }');
  out.push('}');
  out.push('');

  // ---------- Shared: spacing
  out.push('/* ========== SPACING ========== */');
  out.push('html {');
  for (const [name, value] of Object.entries(spacing.scale)) {
    const key = name === '0.5' ? '0-5' : name;
    out.push(`  --spacing-${key}: ${value};`);
  }
  if (spacing.legacy) {
    out.push('  /* Legacy spacing (deprecated) */');
    for (const [name, value] of Object.entries(spacing.legacy)) {
      const key = name === '0.5' ? '0-5' : name;
      out.push(`  --spacing-${key}: ${value};`);
    }
  }
  for (const [name, scaleKey] of Object.entries(spacing.semantic)) {
    const key = scaleKey === '0.5' ? '0-5' : scaleKey;
    const ref = spacing.scale[scaleKey] != null ? `var(--spacing-${key})` : scaleKey;
    const cssName = name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    out.push(`  --spacing-${cssName}: ${ref};`);
  }
  for (const [alias, scaleKey] of Object.entries(spacing.aliases)) {
    const key = scaleKey === '0.5' ? '0-5' : scaleKey;
    out.push(`  --spacing-${alias}: var(--spacing-${key});`);
  }
  out.push('  --space-xs: var(--spacing-1);');
  out.push('  --space-sm: var(--spacing-2);');
  out.push('  --space-md: var(--spacing-4);');
  out.push('  --space-lg: var(--spacing-6);');
  out.push('  --space-xl: var(--spacing-8);');
  out.push('}');
  out.push('');

  // ---------- Typography
  out.push('/* ========== TYPOGRAPHY ========== */');
  out.push('html {');
  for (const [name, value] of Object.entries(typography.fontFamily)) {
    out.push(`  --font-${name}: ${value};`);
  }
  for (const [name, value] of Object.entries(typography.fontWeight)) {
    out.push(`  --font-weight-${name}: ${value};`);
  }
  for (const [name, value] of Object.entries(typography.lineHeight)) {
    out.push(`  --line-height-${name}: ${value};`);
  }
  for (const [name, value] of Object.entries(typography.letterSpacing)) {
    out.push(`  --letter-spacing-${name}: ${value};`);
  }
  const scale = typography.fontSize.scale;
  for (const [name, value] of Object.entries(scale)) {
    out.push(`  --font-size-${name}: ${value}px;`);
  }
  if (typography.fontSize.legacyScale) {
    out.push('  /* Legacy font sizes (deprecated) */');
    for (const [name, value] of Object.entries(typography.fontSize.legacyScale)) {
      out.push(`  --font-size-${name}: ${value}px;`);
    }
  }
  const fontVar = (f) => `var(--font-${f})`;
  const weightVar = (w) => `var(--font-weight-${w})`;
  const sizeVar = (s) => `var(--font-size-${s})`;
  const lhVar = (l) => (typeof l === 'number' ? l : `var(--line-height-${l})`);
  for (const [styleName, def] of Object.entries(typography.textStyles)) {
    const w = weightVar(def.weight);
    const sz = sizeVar(def.size);
    const lh = lhVar(def.lineHeight);
    const font = fontVar(def.font || 'sans');
    const kebab = styleName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    out.push(`  --text-${kebab}: ${w} ${sz}/${lh} ${font};`);
  }
  out.push('}');
  out.push('');

  // ---------- Effects
  out.push('/* ========== EFFECTS ========== */');
  out.push('html {');
  for (const [name, value] of Object.entries(effects.shadow)) {
    out.push(`  --shadow-${name}: ${value};`);
  }
  if (effects.legacyShadow) {
    out.push('  /* Legacy shadows (deprecated) */');
    for (const [name, value] of Object.entries(effects.legacyShadow)) {
      if (!effects.shadow[name]) out.push(`  --shadow-${name}: ${value};`);
    }
  }
  for (const [name, value] of Object.entries(effects.borderWidth)) {
    out.push(`  --border-width-${name}: ${value};`);
  }
  for (const [name, value] of Object.entries(effects.radius)) {
    out.push(`  --radius-${name}: ${value};`);
  }
  if (effects.legacyRadius) {
    out.push('  /* Legacy radius (deprecated) */');
    for (const [name, value] of Object.entries(effects.legacyRadius)) {
      if (!effects.radius[name]) out.push(`  --radius-${name}: ${value};`);
    }
  }
  for (const [alias, ref] of Object.entries(effects.radiusAliases || {})) {
    out.push(`  --radius-${alias}: var(--radius-${ref});`);
  }
  for (const [name, value] of Object.entries(effects.opacity)) {
    out.push(`  --opacity-${name}: ${value};`);
  }
  for (const [name, value] of Object.entries(effects.blur)) {
    out.push(`  --blur-${name}: ${value};`);
  }
  for (const [name, value] of Object.entries(effects.duration)) {
    out.push(`  --duration-${name}: ${value};`);
  }
  for (const [name, value] of Object.entries(effects.ease)) {
    out.push(`  --ease-${toKebab(name)}: ${value};`);
  }
  for (const [alias, ref] of Object.entries(effects.easeAliases || {})) {
    out.push(`  --ease-${toKebab(alias)}: var(--ease-${toKebab(ref)});`);
  }
  for (const [name, value] of Object.entries(effects.iconSize)) {
    out.push(`  --icon-size-${name}: ${value};`);
  }
  out.push('  --shadow-focus: 0 0 0 3px oklch(from var(--color-accent) l c h / 0.3);');
  out.push('}');
  out.push('');

  // Dark shadow overrides
  out.push('html[data-theme="dark"] {');
  for (const [name, value] of Object.entries(effects.shadowDark || {})) {
    out.push(`  --shadow-${name}: ${value};`);
  }
  out.push('}');
  out.push('');

  // Layout & z-index
  out.push('/* ========== LAYOUT ========== */');
  out.push('html {');
  for (const [name, value] of Object.entries(effects.layout || {})) {
    const k = name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    out.push(`  --${k}: ${value};`);
  }
  for (const [name, value] of Object.entries(effects.zIndex || {})) {
    out.push(`  --z-${name}: ${value};`);
  }
  if (effects.breakpoints) {
    for (const [name, value] of Object.entries(effects.breakpoints)) {
      out.push(`  --breakpoint-${name}: ${value};`);
    }
  }
  out.push('}');
  out.push('');

  // ---------- Compatibility aliases
  out.push('/* ========== COMPATIBILITY ALIASES ========== */');
  out.push('html {');
  out.push('  /* New semantic tokens */');
  out.push('  --color-bg: var(--color-bg);');
  out.push('  --color-surface: var(--color-surface);');
  out.push('  --color-surface-2: var(--color-surface-2);');
  out.push('  --color-overlay: var(--color-overlay);');
  out.push('  --color-text: var(--color-text);');
  out.push('  --color-text-muted: var(--color-text-muted);');
  out.push('  --color-text-tertiary: var(--color-text-tertiary);');
  out.push('  --color-text-inverse: var(--color-text-inverse);');
  out.push('  --color-border: var(--color-border);');
  out.push('  --color-border-subtle: var(--color-border-subtle);');
  out.push('  --color-border-strong: var(--color-border-strong);');
  out.push('  --color-accent: var(--color-accent);');
  out.push('  --color-accent-hover: var(--color-accent-hover);');
  out.push('  --color-accent-active: var(--color-accent-active);');
  out.push('  --color-on-accent: var(--color-on-accent);');
  out.push('  --color-focus-ring: var(--color-focus-ring);');
  out.push('  /* Legacy semantic aliases */');
  out.push('  --color-background-primary: var(--color-bg);');
  out.push('  --color-background-secondary: var(--color-surface);');
  out.push('  --color-background-tertiary: var(--color-surface-2);');
  out.push('  --color-background-overlay: var(--color-overlay);');
  out.push('  --color-text-primary: var(--color-text);');
  out.push('  --color-text-secondary: var(--color-text-muted);');
  out.push('  --color-text-tertiary: var(--color-text-tertiary);');
  out.push('  --color-text-inverse: var(--color-text-inverse);');
  out.push('  --color-border-default: var(--color-border);');
  out.push('  --color-border-subtle: var(--color-border-subtle);');
  out.push('  --color-border-strong: var(--color-border-strong);');
  out.push('  --color-interactive-default: var(--color-accent);');
  out.push('  --color-interactive-hover: var(--color-accent-hover);');
  out.push('  --color-interactive-active: var(--color-accent-active);');
  out.push('  --color-on-primary: var(--color-on-accent);');
  out.push('  --color-primary: var(--color-accent);');
  out.push('  --color-primary-hover: var(--color-accent-hover);');
  out.push('  --color-on-primary: var(--color-on-accent);');
  out.push('  --color-border: var(--color-border);');
  out.push('  --color-danger: var(--color-error);');
  out.push('  /* Design system (brief) surface aliases */');
  out.push('  --surface-base: var(--color-bg);');
  out.push('  --surface-raised: var(--color-surface-2);');
  out.push('  --accent-primary: var(--color-accent);');
  out.push('  --accent-hover: var(--color-accent-hover);');
  out.push('  --accent-muted: var(--color-primary-subtle);');
  out.push('  --border-subtle: var(--color-border-subtle);');
  out.push('  --text-primary: var(--color-text);');
  out.push('  --text-secondary: var(--color-text-muted);');
  out.push('  --text-tertiary: var(--color-text-tertiary);');
  out.push('  /* Neutral scale (design ref: gray = neutral) */');
  for (const n of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']) {
    out.push(`  --color-neutral-${n}: var(--color-gray-${n});`);
  }
  out.push('  /* danger = error (admin compat) */');
  for (const n of ['50', '100', '200', '300', '400', '500', '600', '700']) {
    out.push(`  --color-danger-${n}: var(--color-error-${n});`);
  }
  out.push('  /* Ref-aligned semantic aliases */');
  out.push('  --muted: var(--color-gray-100);');
  out.push('  --muted-foreground: var(--color-gray-500);');
  out.push('  --accent: var(--color-gray-100);');
  out.push('  --accent-foreground: var(--color-gray-900);');
  out.push('  --input-background: var(--color-gray-100);');
  out.push('  --sidebar: var(--color-background-primary);');
  out.push('  --sidebar-border: var(--color-gray-200);');
  out.push('  --sidebar-primary: var(--color-interactive-default);');
  out.push('  /* Chart tokens (axis 11px, grid, tooltip, series) */');
  out.push('  --chart-axis-font-size: 11px;');
  out.push('  --chart-grid: var(--color-gray-200);');
  out.push('  --chart-tooltip-bg: var(--surface-raised);');
  out.push('  --chart-tooltip-border: var(--border-subtle);');
  out.push('  --chart-series-1: var(--color-interactive-default);');
  out.push('  --chart-series-2: var(--color-gray-500);');
  out.push('  --chart-series-3: var(--color-gray-400);');
  out.push('  --chart-series-4: var(--color-gray-300);');
  out.push('  /* Brief typography (design ref: 16px base, tracking-tight headings) */');
  out.push('  --text-xs: 12px;');
  out.push('  --text-xs-line: 16px;');
  out.push('  --text-sm: 13px;');
  out.push('  --text-sm-line: 18px;');
  out.push('  --text-base: 14px;');
  out.push('  --text-base-line: 20px;');
  out.push('  --text-lg: 16px;');
  out.push('  --text-lg-line: 20px;');
  out.push('  --text-xl: 16px;');
  out.push('  --text-xl-line: 20px;');
  out.push('  --text-2xl: 16px;');
  out.push('  --text-2xl-line: 20px;');
  out.push('  --font-family: var(--font-sans);');
  out.push('  --font-normal: 400;');
  out.push('  --font-medium: 500;');
  out.push('  --font-semibold: 600;');
  out.push('  --line-height-tight: 1.2;');
  out.push('  --line-height-snug: 1.3;');
  out.push('  --line-height-normal: 1.4;');
  out.push('}');
  out.push('');

  // ---------- Operator console (Bloomberg-style)
  out.push('/* ========== OPERATOR CONSOLE (data-console="operator") ========== */');
  out.push('html[data-theme="light"] [data-console="operator"] {');
  out.push('  --color-op-bg: #f7f8fa;');
  out.push('  --color-op-surface: #ffffff;');
  out.push('  --color-op-surface-raised: #ffffff;');
  out.push('  --color-op-border: oklch(0.92 0.005 247);');
  out.push('  --color-op-primary: oklch(0.45 0.08 265);');
  out.push('  --color-op-success: oklch(0.5 0.12 145);');
  out.push('  --color-op-warning: oklch(0.65 0.12 85);');
  out.push('  --color-op-error: oklch(0.55 0.15 25);');
  out.push('  --color-op-info: oklch(0.5 0.08 250);');
  out.push('}');
  out.push('');
  out.push('html[data-theme="dark"] [data-console="operator"] {');
  out.push('  --color-op-bg: #0f1115;');
  out.push('  --color-op-surface: oklch(0.18 0.01 265);');
  out.push('  --color-op-surface-raised: oklch(0.22 0.01 265);');
  out.push('  --color-op-border: oklch(0.28 0.01 265);');
  out.push('  --color-op-primary: oklch(0.65 0.1 265);');
  out.push('  --color-op-success: oklch(0.55 0.12 145);');
  out.push('  --color-op-warning: oklch(0.7 0.12 85);');
  out.push('  --color-op-error: oklch(0.6 0.15 25);');
  out.push('  --color-op-info: oklch(0.6 0.08 250);');
  out.push('}');
  out.push('');
  out.push('[data-console="operator"] {');
  out.push('  --spacing-op-1: 4px;');
  out.push('  --spacing-op-2: 8px;');
  out.push('  --spacing-op-3: 12px;');
  out.push('  --spacing-op-4: 16px;');
  out.push('  --spacing-op-5: 20px;');
  out.push('  --spacing-op-6: 24px;');
  out.push('  --spacing-op-8: 32px;');
  out.push('  --spacing-section-gap: var(--spacing-op-6);');
  out.push('  --spacing-component-padding: var(--spacing-op-2);');
  out.push('  --spacing-component-padding-lg: var(--spacing-op-3);');
  out.push('  --spacing-component-gap: var(--spacing-op-2);');
  out.push('  --spacing-layout-gutter: var(--spacing-op-4);');
  out.push('  --font-size-op-base: 13px;');
  out.push('  --font-size-op-sm: 12px;');
  out.push('  --font-size-op-heading: 14px;');
  out.push('  --font-size-op-heading-lg: 16px;');
  out.push('  --line-height-op-normal: 1.4;');
  out.push('  --line-height-op-compact: 1.2;');
  out.push('  --radius-op: 4px;');
  out.push('  --table-row-height-op: 32px;');
  out.push('  --spacing-status-group-gap: var(--spacing-op-4);');
  out.push('  --spacing-section-top: var(--spacing-op-6);');
  out.push('  --spacing-section-inner: var(--spacing-op-4);');
  out.push('  --spacing-section-bottom: var(--spacing-op-4);');
  out.push('  --spacing-nav-item: var(--spacing-op-8);');
  out.push('  --text-op-score: 15px;');
  out.push('  --text-op-nav-section: 11px;');
  out.push('  --spacing-nav-section-top: var(--spacing-op-6);');
  out.push('  --spacing-nav-section-below: var(--spacing-op-2);');
  out.push('}');
  out.push('');
  out.push('[data-console="operator"] {');
  out.push('  --text-op-base: 13px;');
  out.push('  --text-op-sm: 12px;');
  out.push('  --text-op-table: 12.5px;');
  out.push('  --text-op-heading: 14px;');
  out.push('  --text-op-heading-lg: 16px;');
  out.push('  --font-size-base: 13px;');
  out.push('  --font-size-sm: 12px;');
  out.push('  --text-base: 13px;');
  out.push('  --text-sm: 12px;');
  out.push('  --text-xs: 11px;');
  out.push('  --text-lg: 14px;');
  out.push('  --text-lg-line: 20px;');
  out.push('  --text-xl: 16px;');
  out.push('  --text-xl-line: 22px;');
  out.push('  --text-2xl: 16px;');
  out.push('  --text-2xl-line: 22px;');
  out.push('  --radius-md: 4px;');
  out.push('  --radius-lg: 4px;');
  out.push('  --radius-xl: 4px;');
  out.push('  --radius-card: 4px;');
  out.push('  --border-op: 1px solid var(--color-op-border);');
  out.push('  --shadow-op: 0 1px 0 0 oklch(0 0 0 / 0.04);');
  out.push('  --shadow-sm: none;');
  out.push('  --shadow-md: none;');
  out.push('  --color-bg: var(--color-op-bg);');
  out.push('  --color-surface: var(--color-op-surface);');
  out.push('  --color-surface-2: var(--color-op-surface-raised);');
  out.push('  --color-border-subtle: var(--color-op-border);');
  out.push('  --color-border: var(--color-op-border);');
  out.push('  --color-border-strong: color-mix(in oklab, var(--color-op-border) 70%, black 30%);');
  out.push('  --color-accent: var(--color-op-primary);');
  out.push('  --color-accent-hover: color-mix(in oklab, var(--color-op-primary) 84%, white 16%);');
  out.push('  --color-accent-active: color-mix(in oklab, var(--color-op-primary) 88%, black 12%);');
  out.push('  --color-success: var(--color-op-success);');
  out.push('  --color-warning: var(--color-op-warning);');
  out.push('  --color-error: var(--color-op-error);');
  out.push('  --color-info: var(--color-op-info);');
  out.push('  --surface-base: var(--color-op-bg);');
  out.push('  --surface-raised: var(--color-op-surface-raised);');
  out.push('  --color-primary-subtle: color-mix(in oklab, var(--color-op-primary) 8%, transparent);');
  out.push('  --bg-primary: var(--color-op-bg);');
  out.push('  --bg-secondary: var(--color-op-surface);');
  out.push('  --border-default: var(--color-op-border);');
  out.push('  --text-primary: var(--color-text);');
  out.push('  --text-muted: var(--color-text-muted);');
  out.push('  --accent-primary: var(--color-op-primary);');
  out.push('  --status-success: var(--color-op-success);');
  out.push('  --status-warning: var(--color-op-warning);');
  out.push('  --status-error: var(--color-op-error);');
  out.push('  --status-info: var(--color-op-info);');
  out.push('}');
  out.push('');

  return out.join('\n');
}

const css = buildCss();
fs.mkdirSync(path.dirname(OUT_CSS), { recursive: true });
fs.writeFileSync(OUT_CSS, css, 'utf8');
