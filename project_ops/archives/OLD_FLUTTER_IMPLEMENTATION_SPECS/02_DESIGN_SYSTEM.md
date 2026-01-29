# Spayce - Design System

> **Document Purpose**: Complete design tokens and visual specifications for pixel-perfect recreation in any tech stack.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Iconography](#iconography)
8. [Animations & Transitions](#animations--transitions)
9. [Component Styling Patterns](#component-styling-patterns)

---

## Design Philosophy

### Arc Browser Inspiration
The design follows Arc Browser's principles with exact pixel values:

- **Deep dark purple theme**: Not pure black, but rich purple-tinted dark
- **Color-coded spaces**: Each space has a distinct accent color
- **Hierarchical tree sidebar**: Fixed 320px width with tree indent and border connectors
- **Profile-centric navigation**: Bottom tab bar with nav dots between icons
- **Embossed sidebar overlay**: Shadow with offset and blur for depth
- **Minimal chrome**: Show actions on hover only

### Core Principles

1. **Fixed sidebar width**: Exactly 320px (equivalent to w-80 in Tailwind)
2. **Bottom profile bar**: Space icons with nav-dots, user profile section
3. **Nested tree structure**: 16px left indent with border-l connector
4. **Folder actions on hover**: Toolbar appears on row hover
5. **Rounded corners throughout**: 8px default, 12px extra-large, 16px for sidebar

---

## Color System

### Primary Palette

```
┌────────────────────────────────────────────────────────────────┐
│ PRIMARY                                                        │
├────────────────────────────────────────────────────────────────┤
│ primary         │ #6D5AE6 │ rgba(109, 90, 230, 1)  │ Purple   │
└────────────────────────────────────────────────────────────────┘
```

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `primary` | `#6D5AE6` | `rgb(109, 90, 230)` | Primary actions, active states, brand |

---

### Background Colors

```
┌────────────────────────────────────────────────────────────────┐
│ BACKGROUNDS                                                    │
├────────────────────────────────────────────────────────────────┤
│ backgroundDark  │ #0F0B1A │ Deep purple-black (main bg)       │
│ surfaceDark     │ #1A1628 │ Card/panel backgrounds            │
│ sidebarDark     │ #131020 │ Sidebar background (darker)       │
│ accentDark      │ #2D2645 │ Hover states, subtle highlights   │
└────────────────────────────────────────────────────────────────┘
```

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `backgroundDark` | `#0F0B1A` | `rgb(15, 11, 26)` | Main application background |
| `surfaceDark` | `#1A1628` | `rgb(26, 22, 40)` | Cards, panels, content areas |
| `sidebarDark` | `#131020` | `rgb(19, 16, 32)` | Sidebar (darker than surface) |
| `accentDark` | `#2D2645` | `rgb(45, 38, 69)` | Hover states, scrollbar thumb |

> **Important**: Never use pure black (`#000000`). Always use the purple-tinted dark colors.

---

### Text Colors

```
┌────────────────────────────────────────────────────────────────┐
│ TEXT                                                           │
├────────────────────────────────────────────────────────────────┤
│ textPrimary     │ #E5E7EB │ Main text (gray-200)              │
│ textSecondary   │ #9CA3AF │ Secondary text (gray-400)         │
│ textMuted       │ #6B7280 │ Muted/disabled text (gray-500)    │
└────────────────────────────────────────────────────────────────┘
```

| Token | Hex | Opacity | Usage |
|-------|-----|---------|-------|
| `textPrimary` | `#E5E7EB` | 100% | Headings, primary content, active states |
| `textSecondary` | `#9CA3AF` | 100% | Labels, descriptions, inactive states |
| `textMuted` | `#6B7280` | 100% | Placeholders, disabled text, hints |

---

### Space Accent Colors

Each Space (organizational container) has a unique accent color from this palette:

```
┌────────────────────────────────────────────────────────────────┐
│ SPACE COLORS (Primary 4)                                       │
├────────────────────────────────────────────────────────────────┤
│ space1 (Violet) │ #8B5CF6 │ Machine Learning, AI topics       │
│ space2 (Amber)  │ #F59E0B │ Work, Professional                │
│ space3 (Emerald)│ #10B981 │ Research, Science                 │
│ space4 (Pink)   │ #EC4899 │ Personal, Creative                │
└────────────────────────────────────────────────────────────────┘
```

| Token | Hex | RGB | Example Use Case |
|-------|-----|-----|------------------|
| `space1` | `#8B5CF6` | `rgb(139, 92, 246)` | Violet - ML, AI, Technology |
| `space2` | `#F59E0B` | `rgb(245, 158, 11)` | Amber - Work, Professional |
| `space3` | `#10B981` | `rgb(16, 185, 129)` | Emerald - Research, Science |
| `space4` | `#EC4899` | `rgb(236, 72, 153)` | Pink - Personal, Creative |

### Extended Space Palette

For users with more than 4 spaces:

| Index | Token | Hex | Color Name |
|-------|-------|-----|------------|
| 0 | `space1` | `#8B5CF6` | Violet |
| 1 | `space2` | `#F59E0B` | Amber |
| 2 | `space3` | `#10B981` | Emerald |
| 3 | `space4` | `#EC4899` | Pink |
| 4 | `space5` | `#3B82F6` | Blue |
| 5 | `space6` | `#EF4444` | Red |
| 6 | `space7` | `#14B8A6` | Teal |
| 7 | `space8` | `#F97316` | Orange |

**Color Assignment**: `color = extended[index % 8]`

---

### Item/Icon Colors

```
┌────────────────────────────────────────────────────────────────┐
│ ITEM COLORS                                                    │
├────────────────────────────────────────────────────────────────┤
│ folderDefault   │ #6B7280 │ Default folder icon color         │
│ linkRed         │ #EF4444 │ Video links (YouTube, etc.)       │
│ linkBlue        │ #3B82F6 │ General web links                 │
│ linkYellow      │ #EAB308 │ Documents, files                  │
│ navDot          │ #4B5563 │ Navigation dots between icons     │
└────────────────────────────────────────────────────────────────┘
```

| Token | Hex | Usage |
|-------|-----|-------|
| `folderDefault` | `#6B7280` | Default folder icon |
| `linkRed` | `#EF4444` | Video content (YouTube) |
| `linkBlue` | `#3B82F6` | General links |
| `linkYellow` | `#EAB308` | Documents/files |
| `navDot` | `#4B5563` | Navigation indicator dots |

---

### Border Colors

```
┌────────────────────────────────────────────────────────────────┐
│ BORDERS                                                        │
├────────────────────────────────────────────────────────────────┤
│ borderDark      │ #374151 │ Standard borders (gray-700)       │
│ borderSubtle    │ #1F2937 │ Subtle borders (gray-800)         │
└────────────────────────────────────────────────────────────────┘
```

| Token | Hex | Usage |
|-------|-----|-------|
| `borderDark` | `#374151` | Visible borders, separators |
| `borderSubtle` | `#1F2937` | Subtle dividers, container edges |

---

### Status Colors

```
┌────────────────────────────────────────────────────────────────┐
│ STATUS                                                         │
├────────────────────────────────────────────────────────────────┤
│ success         │ #10B981 │ Emerald - Success states          │
│ warning         │ #F59E0B │ Amber - Warning states            │
│ error           │ #EF4444 │ Red - Error states                │
│ info            │ #3B82F6 │ Blue - Informational              │
└────────────────────────────────────────────────────────────────┘
```

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#10B981` | Success messages, positive actions |
| `warning` | `#F59E0B` | Warnings, important notices |
| `error` | `#EF4444` | Errors, destructive actions |
| `info` | `#3B82F6` | Information, hints |

---

## Typography

### Font Family

**Primary**: Inter (Google Fonts)
**Monospace**: JetBrains Mono (for URL bar)

```
Font Weights Used:
- 400 (Regular/Normal)
- 500 (Medium)
- 600 (SemiBold)
- 700 (Bold)
```

---

### Text Styles Reference

| Style Name | Size | Weight | Letter Spacing | Color | Usage |
|------------|------|--------|----------------|-------|-------|
| `headingLarge` | 24px | 700 (Bold) | Default | textPrimary | Page titles |
| `headingMedium` | 18px | 600 (SemiBold) | Default | textPrimary | Section headers |
| `headingSmall` | 16px | 600 (SemiBold) | Default | textPrimary | Subsection headers |
| `sectionHeader` | 14px | 700 (Bold) | 0.5px | textSecondary | UPPERCASE headers |
| `navButton` | 14px | 500 (Medium) | Default | textPrimary | Navigation buttons |
| `treeItem` | 14px | 500 (Medium) | Default | textPrimary | Tree item text |
| `treeSubItem` | 14px | 400 (Regular) | Default | textSecondary | Nested tree items |
| `tabTitle` | 13px | 500 (Medium) | Default | textPrimary | Browser tab titles |
| `cardHeader` | 12px | 600 (SemiBold) | 0.5px | textSecondary | Card headers (uppercase) |
| `profileName` | 14px | 500 (Medium) | Default | textPrimary | User profile name |
| `body` | 14px | 400 (Regular) | Default | textPrimary | Body text |
| `bodySmall` | 12px | 400 (Regular) | Default | textSecondary | Small body text |
| `button` | 14px | 600 (SemiBold) | Default | textPrimary | Button labels |
| `caption` | 11px | 400 (Regular) | Default | textMuted | Captions, hints |
| `urlBar` | 14px | 400 (Regular) | Default | textSecondary | URL bar (monospace) |

---

### Typography Code Reference

```dart
// Navigation Button
TextStyle(
  fontFamily: 'Inter',
  fontSize: 14,
  fontWeight: FontWeight.w500,  // Medium
  color: Color(0xFFE5E7EB),
)

// Section Header (UPPERCASE)
TextStyle(
  fontFamily: 'Inter',
  fontSize: 14,
  fontWeight: FontWeight.w700,  // Bold
  letterSpacing: 0.5,
  color: Color(0xFF9CA3AF),
)
// Note: Apply .toUpperCase() to the text

// URL Bar (Monospace)
TextStyle(
  fontFamily: 'JetBrains Mono',
  fontSize: 14,
  fontWeight: FontWeight.w400,  // Regular
  color: Color(0xFF9CA3AF),
)
```

---

## Spacing & Layout

### Base Spacing Scale

| Token | Value | Tailwind Equiv | Usage |
|-------|-------|----------------|-------|
| `p1` | 4px | p-1 | Minimal padding/margin |
| `p2` | 8px | p-2 | Small gaps |
| `p3` | 12px | p-3 | Standard padding |
| `p4` | 16px | p-4 | Component padding |
| `p5` | 20px | p-5 | Section spacing |
| `p6` | 24px | p-6 | Content padding |
| `p8` | 32px | p-8 | Large spacing |
| `p10` | 40px | p-10 | Extra large |
| `p12` | 48px | p-12 | Huge spacing |
| `p16` | 64px | p-16 | Maximum |

### Semantic Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tiny gaps |
| `sm` | 8px | Small gaps |
| `md` | 16px | Medium gaps |
| `lg` | 24px | Large gaps |
| `xl` | 32px | Extra large |
| `xxl` | 48px | Huge gaps |

---

### Layout Constants

These are **exact values** that must be matched:

```
┌────────────────────────────────────────────────────────────────┐
│ CRITICAL LAYOUT CONSTANTS                                      │
├────────────────────────────────────────────────────────────────┤
│ sidebarWidth         │ 320px  │ Fixed sidebar width (w-80)    │
│ treeIndent           │ 16px   │ Per-level tree indentation    │
│ cardWidth            │ 288px  │ Content card width (w-72)     │
│ spaceIconSize        │ 32px   │ Bottom bar space icons        │
│ navDotSize           │ 4px    │ Navigation dots diameter      │
│ bottomTabBarHeight   │ 60px   │ Bottom navigation bar         │
│ topBarHeight         │ 56px   │ Top bar / app bar height      │
└────────────────────────────────────────────────────────────────┘
```

### Sidebar Layout

```
┌─────────────────────── 320px ────────────────────────┐
│ ┌─────────────────────────────────────────────────┐ │
│ │ p-3 (12px all sides)                            │ │
│ │                                                  │ │
│ │ Navigation Buttons (px-3 py-2 = 12px,8px)       │ │
│ │                                                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Space Header (px-4 py-2 = 16px,8px)             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Tree Content                                     │ │
│ │   └─ Each level indents 16px                     │ │
│ │      └─ Item padding (px-2 py-1.5 = 8px,6px)    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌───────────────────── 60px ─────────────────────┐ │
│ │ Bottom Tab Bar                                  │ │
│ │ [🟣] • • [🟠] • • [🟢] • • [🔴]  [+]          │ │
│ └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Tree Indentation

```
Level 0:  |─────── Item
Level 1:  |   |──── Item (+ 16px indent)
Level 2:  |   |   |── Item (+ 32px total)
Level 3:  |   |   |   |─ Item (+ 48px total)
```

Formula: `left_padding = depth * 16px`

---

## Border Radius

### Base Radius Values

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Small elements, tags |
| `sm` | 6px | Inputs, small buttons |
| `md` | 8px | Buttons, inputs, tree items |
| `lg` | 12px | Cards, dialogs |
| `xl` | 16px | Sidebar corners |
| `xxl` | 24px | Large modals |
| `full` | 999px | Circular (avatars, dots) |

### Semantic Radius

| Element | Radius | Notes |
|---------|--------|-------|
| `button` | 8px | All interactive buttons |
| `input` | 8px | Text inputs, URL bar |
| `card` | 12px | Content cards, panels |
| `sidebar` | 16px | Sidebar right corners only |
| `tab` | 8px | Browser tabs |
| `avatar` | 999px | User avatars (circular) |

### Sidebar Corner Radius

The sidebar has rounded corners only on the right side (when in overlay mode):

```dart
BorderRadius.only(
  topRight: Radius.circular(16),
  bottomRight: Radius.circular(16),
)
```

---

## Shadows

### Shadow Definitions

#### Sidebar Embossed (Overlay Mode)
```
offset: 10px 0
blur: 30px
spread: -5px
color: rgba(0, 0, 0, 0.5)
```

```dart
BoxShadow(
  color: Colors.black.withOpacity(0.5),
  offset: Offset(10, 0),
  blurRadius: 30,
  spreadRadius: -5,
)
```

#### Card Subtle (Default)
```
offset: 0 2px
blur: 8px
spread: 0
color: rgba(0, 0, 0, 0.2)
```

#### Card Hover (Elevated)
```
offset: 0 4px
blur: 16px
spread: 0
color: rgba(0, 0, 0, 0.3)
```

#### Dropdown/Popup
```
offset: 0 4px
blur: 12px
spread: 0
color: rgba(0, 0, 0, 0.4)
```

### Shadow Usage

| Context | Shadow | Notes |
|---------|--------|-------|
| Sidebar (overlay) | `sidebarEmbossed` | Creates depth effect |
| Sidebar (embedded) | `none` | No shadow when inline |
| Cards (default) | `cardSubtle` | Subtle elevation |
| Cards (hover) | `cardHover` | Raised on hover |
| Context menus | `dropdown` | Floating appearance |
| Dialogs/Modals | `dropdown` | Same as context menus |

---

## Iconography

### Icon Library

**Primary**: Lucide Icons (or Material Symbols Outlined as equivalent)

### Icon Sizes

| Token | Size | Usage |
|-------|------|-------|
| `xs` | 14px | Small indicators, badges |
| `sm` | 16px | Tree items, tabs |
| `md` | 18px | Action buttons, folders |
| `lg` | 20px | Navigation buttons |
| `xl` | 24px | Large icons |
| `xxl` | 32px | Space icons in bottom bar |

### Icon Mapping

| Context | Icon Name | Size | Color |
|---------|-----------|------|-------|
| Browser Nav | `Globe` | 20px | textPrimary |
| Spaces Nav | `LayoutGrid` | 20px | textPrimary |
| Pin Sidebar | `Pin` | 20px | textSecondary |
| Folder Closed | `Folder` | 18px | space color |
| Folder Open | `FolderOpen` | 18px | space color |
| Link | `FileText` | 18px | linkBlue |
| Video Link | `Play` | 18px | linkRed |
| Add | `Plus` | 18px | textSecondary |
| Settings | `Settings` | 18px | textSecondary |
| Back | `ArrowLeft` | 18px | textSecondary |
| Forward | `ArrowRight` | 18px | textSecondary |
| Refresh | `RotateCw` | 18px | textSecondary |
| Lock (Secure) | `Lock` | 14px | textSecondary |
| Close | `X` | 14px | textSecondary |
| More Menu | `MoreVertical` | 18px | textSecondary |

---

## Animations & Transitions

### Duration Constants

| Token | Duration | Usage |
|-------|----------|-------|
| `quick` | 100ms | Immediate feedback |
| `hover` | 150ms | Hover effects |
| `fade` | 200ms | Opacity changes |
| `expand` | 200ms | Expand/collapse |
| `sidebarSlide` | 250ms | Sidebar show/hide |
| `pageTransition` | 300ms | Page/screen changes |

### Easing Curves

| Token | Curve | Usage |
|-------|-------|-------|
| `standardCurve` | `easeInOut` | Most transitions |
| `decelerateCurve` | `decelerate` | Elements entering |
| `accelerateCurve` | `easeIn` | Elements exiting |

### Specific Animations

#### Hover Effects

**Nav Dot Scale**:
```
transform: scale(1.5) on hover
duration: 150ms
curve: easeInOut
```

**Space Icon Background**:
```
default: transparent or rgba(255,255,255,0.1)
hover: rgba(255,255,255,0.2)
duration: 150ms
```

**Tree Item Background**:
```
default: transparent
hover: rgba(255,255,255,0.05)
duration: 150ms
```

#### Expand/Collapse

**Folder Content**:
```
duration: 200ms
curve: easeInOut
type: AnimatedCrossFade or height animation
```

#### Sidebar Slide

**Overlay Sidebar**:
```
property: left position
from: -320px (hidden)
to: 0px (visible)
duration: 250ms
curve: easeOut
```

---

## Component Styling Patterns

### Navigation Button

```
Container:
  - padding: 12px horizontal, 8px vertical
  - borderRadius: 8px
  - background: 
    - active: rgba(31, 41, 55, 0.5) // gray-800/50
    - inactive: transparent
    - hover: rgba(255, 255, 255, 0.05)

Content:
  - Row layout
  - Icon: 20px, right margin 12px
  - Text: 14px medium
  
Colors:
  - active: textPrimary
  - inactive: textSecondary
```

### Tree Item

```
Container:
  - margin-left: depth * 16px
  - padding: 8px horizontal, 6px vertical
  - borderRadius: 8px
  - background:
    - default: transparent
    - hover: rgba(255, 255, 255, 0.05)
    - selected: rgba(255, 255, 255, 0.1)

Nested Items Border:
  - left border: 1px solid rgba(55, 65, 81, 0.5) // borderDark/50
  - padding-left: 8px
```

### Space Icon (Bottom Bar)

```
Container:
  - width: 32px
  - height: 32px
  - borderRadius: 6px
  - background:
    - active: rgba(255, 255, 255, 0.1)
    - inactive: transparent
    - hover: rgba(255, 255, 255, 0.2)

Icon:
  - size: 18px
  - color: space color (space1, space2, etc.)
```

### Nav Dot

```
Container:
  - width: 4px
  - height: 4px
  - shape: circle (borderRadius: full)
  - color: #4B5563 (navDot)
  
Hover:
  - transform: scale(1.5)
  - color: #9CA3AF (lighter)
```

### URL Bar

```
Container:
  - padding: 6px vertical, 8px horizontal
  - borderRadius: 8px
  - background: rgba(26, 22, 40, 0.5) // surfaceDark/50
  - border: 1px solid transparent
  
Focus:
  - border: 1px solid primary

Content:
  - Lock icon: 14px, textSecondary, right margin 8px
  - URL text: 14px monospace (JetBrains Mono)
  - Star icon: 16px, #EAB308 (yellow)
```

---

## Scrollbar Styling

```
Thumb:
  - color: #2D2645 (accentDark)
  - hover: #3E3561 (lighter)
  - borderRadius: 4px
  - width: 8px

Track:
  - color: transparent
```

---

## Responsive Breakpoints

| Breakpoint | Width | Columns | Notes |
|------------|-------|---------|-------|
| Mobile | < 640px | 1 | Single column cards |
| Tablet | 640-1024px | 2 | Two column grid |
| Desktop | 1024-1440px | 3 | Three column grid |
| Large | > 1440px | 4 | Four column grid |

---

## Design Tokens Summary

For quick implementation, here are all tokens in a structured format:

```json
{
  "colors": {
    "primary": "#6D5AE6",
    "backgroundDark": "#0F0B1A",
    "surfaceDark": "#1A1628",
    "sidebarDark": "#131020",
    "accentDark": "#2D2645",
    "textPrimary": "#E5E7EB",
    "textSecondary": "#9CA3AF",
    "textMuted": "#6B7280",
    "borderDark": "#374151",
    "borderSubtle": "#1F2937",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6",
    "space1": "#8B5CF6",
    "space2": "#F59E0B",
    "space3": "#10B981",
    "space4": "#EC4899",
    "folderDefault": "#6B7280",
    "linkRed": "#EF4444",
    "linkBlue": "#3B82F6",
    "linkYellow": "#EAB308",
    "navDot": "#4B5563"
  },
  "spacing": {
    "p1": 4, "p2": 8, "p3": 12, "p4": 16,
    "p5": 20, "p6": 24, "p8": 32, "p12": 48
  },
  "layout": {
    "sidebarWidth": 320,
    "treeIndent": 16,
    "cardWidth": 288,
    "spaceIconSize": 32,
    "navDotSize": 4,
    "bottomTabBarHeight": 60,
    "topBarHeight": 56
  },
  "radius": {
    "xs": 4, "sm": 6, "md": 8,
    "lg": 12, "xl": 16, "full": 999
  },
  "animations": {
    "quick": 100, "hover": 150, "fade": 200,
    "expand": 200, "sidebarSlide": 250, "pageTransition": 300
  },
  "typography": {
    "fontFamily": "Inter",
    "monoFamily": "JetBrains Mono"
  }
}
```

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
