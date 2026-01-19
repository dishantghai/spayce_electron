# Spayce Design System - AUTHORITATIVE

> **CRITICAL**: All UI implementations MUST use these EXACT values from `@spayce/shared/theme`.
> Never use arbitrary colors, spacing, or timing values.

## Source of Truth

All design tokens are implemented in:
```
packages/shared/src/theme/
├── colors.ts      # SpayceColors, SpaceThemes
├── spacing.ts     # SpayceSpacing
├── radius.ts      # SpayceRadius
├── animations.ts  # SpayceAnimations
├── shadows.ts     # SpayceShadows
├── typography.ts  # SpayceTypography
└── index.ts       # Barrel exports
```

Import: `import { SpayceColors, SpayceSpacing, ... } from '@spayce/shared/theme'`

---

## Colors

### SpayceColors (Core Palette)

```typescript
export const SpayceColors = {
  // Brand
  primary: '#6D5AE6',           // Primary accent, buttons, focus

  // Backgrounds
  backgroundDark: '#0F0B1A',    // Main app background
  surfaceDark: '#1A1628',       // Cards, modals, elevated surfaces
  sidebarDark: '#131020',       // Sidebar background
  accentDark: '#2D2645',        // Hover states, highlights

  // Text
  textPrimary: '#E5E7EB',       // Main text, headings
  textSecondary: '#9CA3AF',     // Subtitles, descriptions
  textMuted: '#6B7280',         // Placeholders, disabled, icons

  // Borders
  borderDark: '#374151',        // Primary borders
  borderSubtle: '#1F2937',      // Subtle dividers

  // Status
  success: '#10B981',           // Confirmations, local folders
  warning: '#F59E0B',           // Cautions
  error: '#EF4444',             // Errors, destructive actions
  info: '#3B82F6',              // Information, links
};
```

### SpaceThemes (24-color Accent Palette)

Each Space can have a unique accent color from this palette:

```typescript
export const SpaceThemes = [
  '#6D5AE6',  // violet (default)
  '#F59E0B',  // amber
  '#10B981',  // emerald
  '#EC4899',  // pink
  '#3B82F6',  // blue
  '#EF4444',  // red
  '#6366F1',  // indigo
  '#14B8A6',  // teal
  '#06B6D4',  // cyan
  '#84CC16',  // lime
  '#F97316',  // orange
  '#A855F7',  // purple
  '#F43F5E',  // rose
  '#0EA5E9',  // sky
  '#D946EF',  // fuchsia
  '#EAB308',  // yellow
  '#22C55E',  // green
  '#64748B',  // slate
  '#DC2626',  // crimson
  '#5EEAD4',  // mint
  '#FF6B6B',  // coral
  '#B794F6',  // lavender
  '#FFB088',  // peach
  '#4FD1C5',  // aqua
];
```

---

## Spacing

### SpayceSpacing

```typescript
export const SpayceSpacing = {
  // Base scale (in pixels)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Layout Constants
  sidebarWidth: 320,        // Fixed sidebar width
  treeIndent: 16,           // Per-level tree indentation
  cardWidth: 288,           // Space card width
  spaceIconSize: 32,        // Icon size in bottom bar
  navDotSize: 4,            // Separator dots
  bottomTabBarHeight: 60,   // Sidebar bottom bar
  topBarHeight: 56,         // Header/action bars
};
```

---

## Border Radius

### SpayceRadius

```typescript
export const SpayceRadius = {
  // Scale
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 999,    // Circles

  // Component-specific
  button: 8,
  input: 8,
  card: 12,
  sidebar: 16,
  avatar: 999,
  tab: 8,
};
```

---

## Animations

### SpayceAnimations

```typescript
export const SpayceAnimations = {
  // Durations (milliseconds)
  quick: 100,           // Button press, micro-interactions
  hover: 150,           // Hover transitions
  expand: 200,          // Tree expand/collapse, chevron rotation
  sidebarSlide: 250,    // Sidebar open/close
  pageTransition: 300,  // Page-level transitions
  fade: 200,            // Opacity changes

  // CSS Easing Curves
  standardCurve: 'ease-in-out',
  decelerateCurve: 'ease-out',
  accelerateCurve: 'ease-in',
};
```

### Common Animation Patterns

| Animation | Duration | Curve | CSS |
|-----------|----------|-------|-----|
| Tree expand/collapse | 200ms | ease-out | `transition: opacity 200ms ease-out` |
| Folder open icon | 200ms | ease-out | `transition: color 200ms ease-out` |
| Hover background | 150ms | ease | `transition: background-color 150ms ease` |
| Card hover lift | 200ms | ease-out | `transition: transform 200ms ease-out` |
| Context menu appear | 100ms | ease-out | `transition: opacity 100ms ease-out` |

---

## Shadows

### SpayceShadows

```typescript
export const SpayceShadows = {
  sidebarEmbossed: '10px 0 30px -5px rgba(0, 0, 0, 0.5)',
  cardSubtle: '0 2px 8px rgba(0, 0, 0, 0.2)',
  cardHover: '0 4px 16px rgba(0, 0, 0, 0.3)',
  dropdown: '0 4px 12px rgba(0, 0, 0, 0.4)',
};
```

---

## Typography

### SpayceTypography

```typescript
export const SpayceTypography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, monospace',
  },
  fontSize: {
    xs: 11,     // Captions
    sm: 12,     // Small labels, tabs
    base: 14,   // Body text, tree items
    lg: 16,     // Subheadings
    xl: 18,     // Section headers
    '2xl': 20,  // Page titles
    '3xl': 24,  // Major headings
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

### Text Styles Reference

| Style | Size | Weight | Color |
|-------|------|--------|-------|
| Heading Large | 24px | 700 | textPrimary |
| Heading Medium | 18px | 600 | textPrimary |
| Heading Small | 16px | 600 | textPrimary |
| Body | 14px | 400 | textPrimary |
| Body Secondary | 14px | 400 | textSecondary |
| Tree Item | 14px | 500 | textPrimary |
| Tree Sub-Item | 14px | 400 | textSecondary |
| Button | 14px | 600 | textPrimary |
| Caption | 11px | 400 | textMuted |

---

## Icons

### Library: Lucide React

```bash
import { Folder, FolderOpen, Link, File, ChevronRight, ... } from 'lucide-react';
```

### Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| xs | 14px | Compact UI |
| sm | 16px | Tree items, tabs |
| md | 18px | Nav buttons, actions |
| lg | 20px | Larger actions |
| xl | 24px | Hero icons |
| xxl | 32px | Space icons |

### Common Icons

| Purpose | Icon | Color |
|---------|------|-------|
| Folder | `Folder` / `FolderOpen` | `textMuted` or accent |
| Link | `Link` | `info` |
| File | `File` / `FileText` | `textMuted` |
| Local Folder | `Folder` | `success` |
| Add | `Plus` | varies |
| Delete | `Trash2` | `error` |
| Settings | `Settings` | `textMuted` |

---

## Component Specifications

### TreeView

```typescript
const TREE_CONFIG = {
  rowHeight: 32,            // px
  iconSize: 16,             // px
  indent: 16,               // Per-level indentation
  hoverBg: '#2D2645',       // accentDark
  selectedBg: '#2D2645',    // Same as hover
  verticalLineOpacity: 0.3, // Folder nesting indicator
};
```

### Pinned Links Grid

```typescript
const PINNED_GRID = {
  cardSize: 48,
  spacing: 8,
  columns: 5,
  maxPins: 15,  // 5×3
};
```

### Context Menu

```typescript
const CONTEXT_MENU = {
  itemHeight: 32,
  iconSize: 16,
  minWidth: 180,
  borderRadius: 8,
  shadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
};
```

### Create Space Icons (24 icons)

```typescript
const SPACE_ICONS = [
  'rocket', 'code', 'book', 'briefcase', 'brain', 'coffee',
  'compass', 'cpu', 'database', 'flask', 'gamepad', 'globe',
  'guitar', 'hammer', 'heart', 'layers', 'lightbulb', 'music',
  'palette', 'plane', 'puzzle', 'star', 'target', 'zap',
];
```

---

## CSS Variables Template

For CSS Modules, use these custom properties:

```css
:root {
  /* Colors */
  --color-primary: #6D5AE6;
  --color-bg-dark: #0F0B1A;
  --color-bg-surface: #1A1628;
  --color-bg-sidebar: #131020;
  --color-bg-accent: #2D2645;
  --color-text-primary: #E5E7EB;
  --color-text-secondary: #9CA3AF;
  --color-text-muted: #6B7280;
  --color-border-dark: #374151;
  --color-border-subtle: #1F2937;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* Layout */
  --layout-sidebar-width: 320px;
  --layout-tree-indent: 16px;
  --layout-bottom-bar: 60px;
  --layout-top-bar: 56px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 999px;

  /* Shadows */
  --shadow-sidebar: 10px 0 30px -5px rgba(0, 0, 0, 0.5);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.4);

  /* Animations */
  --duration-quick: 100ms;
  --duration-hover: 150ms;
  --duration-expand: 200ms;
  --duration-sidebar: 250ms;
  --ease-out: ease-out;
  --ease-in-out: ease-in-out;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', Menlo, Monaco, monospace;
}
```
