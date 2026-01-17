# Spayce Design System - AUTHORITATIVE

> **CRITICAL**: All UI implementations MUST use these EXACT values.
> Never use arbitrary colors, spacing, or timing values.

## Colors

### Core Palette
```typescript
export const SpayceColors = {
  primary: '#6D5AE6',
  backgroundDark: '#0F0B1A',
  surfaceDark: '#1A1628',
  sidebarDark: '#131020',
  accentDark: '#2D2645',
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  borderDark: '#374151',
  borderSubtle: '#1F2937',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};
```

### Space Theme Colors (24 colors)
```typescript
export const SpaceThemes = [
  '#6D5AE6', // violet
  '#F59E0B', // amber
  '#10B981', // emerald
  '#EC4899', // pink
  '#3B82F6', // blue
  '#EF4444', // red
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#A855F7', // purple
  '#F43F5E', // rose
  '#0EA5E9', // sky
  '#D946EF', // fuchsia
  '#EAB308', // yellow
  '#22C55E', // green
  '#64748B', // slate
  '#DC2626', // crimson
  '#5EEAD4', // mint
  '#FF6B6B', // coral
  '#B794F6', // lavender
  '#FFB088', // peach
  '#4FD1C5', // aqua
];
```

## Spacing

```typescript
export const SpayceSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Layout Constants
  sidebarWidth: 320,
  treeIndent: 16,
  cardWidth: 288,
  spaceIconSize: 32,
  navDotSize: 4,
  bottomTabBarHeight: 60,
  topBarHeight: 56,
};
```

## Border Radius

```typescript
export const SpayceRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 999,
  
  // Component-specific
  button: 8,
  input: 8,
  card: 12,
  sidebar: 16,
  avatar: 999,
  tab: 8,
};
```

## Animations

```typescript
export const SpayceAnimations = {
  // Durations (ms)
  quick: 100,
  hover: 150,
  expand: 200,
  sidebarSlide: 250,
  pageTransition: 300,
  fade: 200,
  
  // Curves
  standardCurve: 'ease-in-out',
  decelerateCurve: 'ease-out',
  accelerateCurve: 'ease-in',
};
```

## Shadows

```typescript
export const SpayceShadows = {
  sidebarEmbossed: '10px 0 30px -5px rgba(0, 0, 0, 0.5)',
  cardSubtle: '0 2px 8px rgba(0, 0, 0, 0.2)',
  cardHover: '0 4px 16px rgba(0, 0, 0, 0.3)',
  dropdown: '0 4px 12px rgba(0, 0, 0, 0.4)',
};
```

## Typography

```typescript
export const SpayceTypography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, monospace',
  },
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

## Component Specifications

### Pinned Links Grid
```typescript
const PINNED_GRID = {
  cardSize: 48,
  spacing: 8,
  columns: 5,
  maxPins: 15, // 5×3
};
```

### Drag & Drop
```typescript
const DRAG_CONFIG = {
  autoExpandDelay: 500,    // Folder auto-expand on hover
  collapseDebounce: 150,
  flashDuration: 700,
  longPressDelay: 150,
  edgeZoneRatio: 0.20,     // 20% top/bottom for drop zones
};
```

### Link Preview Popup
```typescript
const PREVIEW_CONFIG = {
  width: '85%',
  height: '90%',
  animation: {
    duration: 200,
    scale: { from: 0.9, to: 1.0 },
    fade: { from: 0, to: 1 },
  },
  backdropOpacity: 0.6,
};
```

### Workspace Theme (Separate)
```typescript
export const WorkspaceTheme = {
  workspaceBg: '#0B0B0B',
  editorBg: '#0D0D0D',
  surfaceBg: '#141414',
  activeSurface: '#1E1E1E',
  statusBar: '#1A1A1A',
  statusBarAccent: '#3B82F6',
  border: '#262626',
  
  activityBarWidth: 48,
  sidebarWidth: 260,
  tabHeight: 35,
  statusBarHeight: 22,
  fileRowHeight: 24,
  treeIndent: 12,
};
```
