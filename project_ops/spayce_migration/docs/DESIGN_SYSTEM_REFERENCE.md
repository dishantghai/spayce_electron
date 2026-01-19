# Spayce Design System Reference

> **Purpose**: Human-readable design system documentation for the Spayce Flutter → Electron migration. All values extracted from Flutter theme files.

---

## Color Palette

### Core Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Primary** | `#6D5AE6` | Buttons, accents, focus states |
| **Background Dark** | `#0F0B1A` | Main app background |
| **Surface Dark** | `#1A1628` | Cards, modals, elevated surfaces |
| **Sidebar Dark** | `#131020` | Sidebar background |
| **Accent Dark** | `#2D2645` | Hover states, highlights |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Text Primary** | `#E5E7EB` | Main text, headings |
| **Text Secondary** | `#9CA3AF` | Subtitles, descriptions |
| **Text Muted** | `#6B7280` | Placeholders, disabled |

### Border Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Border Dark** | `#374151` | Primary borders |
| **Border Subtle** | `#1F2937` | Subtle dividers |

### Status Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#10B981` | Confirmations, local folders |
| **Warning** | `#F59E0B` | Cautions |
| **Error** | `#EF4444` | Errors, destructive actions |
| **Info** | `#3B82F6` | Information, links |

### Space Accent Colors (8-color palette)

```
#8B5CF6  Violet
#F59E0B  Amber
#10B981  Emerald
#EC4899  Pink
#3B82F6  Blue
#EF4444  Red
#14B8A6  Teal
#F97316  Orange
```

---

## Typography

### Font Families

| Name | Family | Usage |
|------|--------|-------|
| **Primary** | Inter | All UI text |
| **Mono** | JetBrains Mono | URLs, code |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Normal | 400 | Body text |
| Medium | 500 | Nav buttons, tree items |
| Semibold | 600 | Buttons, headings |
| Bold | 700 | Section headers, h1 |

### Text Styles

| Style | Size | Weight | Color |
|-------|------|--------|-------|
| Heading Large | 24px | 700 | Primary |
| Heading Medium | 18px | 600 | Primary |
| Heading Small | 16px | 600 | Primary |
| Body | 14px | 400 | Primary |
| Body Small | 12px | 400 | Secondary |
| Nav Button | 14px | 500 | Primary |
| Tree Item | 14px | 500 | Primary |
| Tree Sub-Item | 14px | 400 | Secondary |
| Card Header | 12px | 600 | Secondary (uppercase) |
| Caption | 11px | 400 | Muted |
| Button | 14px | 600 | Primary |

---

## Spacing

### Base Scale

| Token | Value | Tailwind Equiv |
|-------|-------|----------------|
| p1 | 4px | 1 |
| p2 | 8px | 2 |
| p3 | 12px | 3 |
| p4 | 16px | 4 |
| p5 | 20px | 5 |
| p6 | 24px | 6 |
| p8 | 32px | 8 |
| p10 | 40px | 10 |
| p12 | 48px | 12 |
| p16 | 64px | 16 |

### Semantic Spacing

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| xxl | 48px |

### Layout Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Sidebar Width | 320px | Fixed sidebar width |
| Tree Indent | 16px | Per-level indentation |
| Card Width | 288px | Space card width |
| Space Icon | 32px | Icon in bottom bar |
| Nav Dot | 4px | Separator dots |
| Bottom Bar | 60px | Sidebar bottom bar |
| Top Bar | 56px | Header/action bars |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Small elements |
| sm | 6px | - |
| md | 8px | Buttons, inputs, tabs |
| lg | 12px | Cards |
| xl | 16px | Sidebar, modals |
| xxl | 24px | Large rounded |
| full | 999px | Circles (avatars) |

---

## Shadows

| Name | CSS | Usage |
|------|-----|-------|
| Sidebar | `10px 0 30px -5px rgba(0,0,0,0.5)` | Floating sidebar |
| Card | `0 2px 8px rgba(0,0,0,0.2)` | Cards at rest |
| Card Hover | `0 4px 16px rgba(0,0,0,0.3)` | Cards on hover |
| Dropdown | `0 4px 12px rgba(0,0,0,0.4)` | Menus, popups |

---

## Animations

### Durations

| Name | Duration | Usage |
|------|----------|-------|
| Quick | 100ms | Button press |
| Hover | 150ms | Hover transitions |
| Expand | 200ms | Tree expand/collapse |
| Fade | 200ms | Opacity transitions |
| Sidebar | 250ms | Sidebar slide |
| Page | 300ms | Page transitions |

### Curves

| Name | CSS Bezier | Flutter |
|------|------------|---------|
| Standard | `cubic-bezier(0.42, 0, 0.58, 1)` | easeInOut |
| Decelerate | `cubic-bezier(0, 0, 0.2, 1)` | easeOut |
| Accelerate | `cubic-bezier(0.42, 0, 1, 1)` | easeIn |

### Common Patterns

| Animation | Duration | Curve |
|-----------|----------|-------|
| Tree expand/collapse | 200ms | ease-out |
| Icon rotation | 200ms | ease-out |
| Hover background | 150ms | ease |
| Card hover lift | 200ms | ease-out |
| Modal appear | 200ms | ease-out |
| Modal dismiss | 150ms | ease-in |

---

## Icons

### Library
**lucide-react** (React equivalent of lucide_icons)

### Sizes

| Token | Size | Usage |
|-------|------|-------|
| xs | 14px | - |
| sm | 16px | Tree items, tabs |
| md | 18px | Nav buttons, actions |
| lg | 20px | - |
| xl | 24px | - |
| xxl | 32px | Space icons |

### Common Icons

| Purpose | Icon Name |
|---------|-----------|
| Expand | `ChevronRight` |
| Folder | `Folder` / `FolderOpen` |
| Link | `Link` |
| File | `File` / `FileText` |
| Add | `Plus` |
| Delete | `Trash2` |
| Edit | `Pencil` |
| Copy | `Copy` |
| Settings | `Settings` |
| User | `User` |

---

## CSS Variables Template

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
  --layout-card-width: 288px;
  --layout-bottom-bar: 60px;
  --layout-top-bar: 56px;
  
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 999px;
  
  /* Shadows */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-card-hover: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-sidebar: 10px 0 30px -5px rgba(0, 0, 0, 0.5);
  
  /* Animations */
  --duration-quick: 100ms;
  --duration-hover: 150ms;
  --duration-expand: 200ms;
  --duration-sidebar: 250ms;
  --duration-page: 300ms;
  --ease-standard: cubic-bezier(0.42, 0, 0.58, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.42, 0, 1, 1);
  
  /* Typography */
  --font-primary: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

*Extracted from: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/core/theme/`*
