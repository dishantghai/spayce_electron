# Spayce - UI Components Library

> **Document Purpose**: Complete component specifications for pixel-perfect recreation of all reusable UI elements.

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Navigation Components](#navigation-components)
3. [Sidebar Components](#sidebar-components)
4. [Spaces Components](#spaces-components)
5. [Browser Components](#browser-components)
6. [Form Components](#form-components)
7. [Feedback Components](#feedback-components)
8. [Layout Components](#layout-components)

---

## Component Architecture

### Component Naming Convention

All components use the `Spayce` prefix:

```
SpayceNavButton       - Navigation toggle button
SpayceSpaceIcon       - Space icon in bottom bar
SpayceNavDot          - Separator dot
SpayceBottomTabBar    - Bottom navigation bar
SpayceOverlaySidebar  - Sidebar container
SpayceTreeItem        - Tree view item
SpayceCard            - Content card
```

### Component Categories

| Category | Purpose |
|----------|---------|
| Navigation | App-level navigation |
| Sidebar | Sidebar-specific elements |
| Spaces | Content organization UI |
| Browser | WebView-related UI |
| Form | Inputs, buttons |
| Feedback | Toasts, loading |
| Layout | Containers, grids |

---

## Navigation Components

### SpayceNavButton

Toggle button for navigation modes (Browser/Spaces).

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | String | ✓ | - | Button text |
| `icon` | IconData | ✓ | - | Leading icon |
| `isSelected` | bool | ✓ | - | Selection state |
| `onTap` | VoidCallback | ✓ | - | Tap handler |

#### Variants

| Variant | Icon | Label |
|---------|------|-------|
| Browser | `Globe` | "Browser" |
| Spaces | `LayoutGrid` | "Spaces" |
| Tabs | `Layers` | "Tabs" |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Padding: 12px horizontal         │
│           8px vertical            │
│  Border Radius: 8px               │
│  Gap (icon-text): 8px             │
│  Icon Size: 20px                  │
│  Font: 14px medium                │
└───────────────────────────────────┘
```

#### States

| State | Background | Text/Icon Color |
|-------|------------|-----------------|
| Default | transparent | `textSecondary` (#9CA3AF) |
| Hover | `accentDark` (#2D2645) | `textSecondary` (#9CA3AF) |
| Selected | `primary` 15% | `primary` (#6D5AE6) |
| Disabled | transparent | `textMuted` 50% |

---

### SpayceSpaceIcon

Circular icon for Space selection in bottom bar.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | IconData | ✓ | - | Lucide icon |
| `accentColor` | Color | ✓ | - | Space theme color |
| `isSelected` | bool | | false | Selection state |
| `onTap` | VoidCallback | | null | Tap handler |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Size: 32px × 32px                │
│  Shape: Circle (radius: 999)      │
│  Icon Size: 16px                  │
│  Border (selected): 2px white 20% │
└───────────────────────────────────┘
```

#### States

| State | Background | Icon Color |
|-------|------------|------------|
| Default | `accentColor` 20% | `accentColor` |
| Hover | `accentColor` 30% | `accentColor` |
| Selected | `accentColor` 100% | white |
| Pressed | scale 0.9 | - |

#### Animation

- Hover: 150ms background transition
- Press: 100ms scale animation (1.0 → 0.9)

---

### SpayceNavDot

Small separator dot between Space icons.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| (none) | - | - | - | Stateless component |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Size: 4px × 4px                  │
│  Shape: Circle                    │
│  Color: navDot (#4B5563)          │
│  Margin: 8px horizontal           │
└───────────────────────────────────┘
```

#### States

| State | Color | Scale |
|-------|-------|-------|
| Default | `navDot` (#4B5563) | 1.0 |
| Hover | `textSecondary` (#9CA3AF) | 1.5 |

---

### SpayceBottomTabBar

Bottom navigation bar with Space icons and user profile.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `spaces` | List\<Space> | ✓ | - | List of spaces |
| `selectedSpaceIndex` | int | ✓ | - | Current selection |
| `onSpaceSelected` | Function(int) | ✓ | - | Selection handler |
| `onNewSpace` | VoidCallback | | null | Add space handler |
| `userName` | String? | | null | User display name |
| `userEmail` | String? | | null | User email |
| `userAvatarUrl` | String? | | null | Avatar URL |
| `onSettingsTap` | VoidCallback | | null | Settings handler |

#### Visual Specifications

```
┌────────────────────────────────────────────────────────────────┐
│  Height: 60px                                                  │
│  Padding: 16px horizontal, 8px vertical                        │
│  Background: sidebarDark (#131020)                             │
│  Border: top 1px borderSubtle (#1F2937)                        │
└────────────────────────────────────────────────────────────────┘
```

#### Layout

```
[Space1] • [Space2] • [Space3] • [+]             [User Profile]
   ↑      ↑    ↑      ↑    ↑      ↑                    ↑
SpaceIcon Dot SpaceIcon Dot SpaceIcon AddButton    UserProfile
```

---

### SpayceUserProfile

User information display in bottom bar.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `displayName` | String? | | null | User name |
| `email` | String? | | null | User email |
| `avatarUrl` | String? | | null | Profile picture |
| `onSettingsTap` | VoidCallback? | | null | Settings action |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Avatar: 32px circle              │
│  Name: 14px medium, textPrimary   │
│  Email: 11px regular, textMuted   │
│  Settings Icon: 18px              │
│  Gap: 8px between elements        │
└───────────────────────────────────┘
```

---

## Sidebar Components

### SpayceOverlaySidebar

Main sidebar container with overlay mode support.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isVisible` | bool | ✓ | - | Visibility state |
| `isOverlay` | bool | | true | Overlay vs embedded |
| `onClose` | VoidCallback | | null | Close handler |
| `child` | Widget | ✓ | - | Sidebar content |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Width: 320px                     │
│  Background: sidebarDark          │
│  Border Radius (overlay):         │
│    top-right: 16px                │
│    bottom-right: 16px             │
│  Shadow (overlay): sidebarEmbossed│
└───────────────────────────────────┘
```

#### Overlay Shadow

```css
box-shadow: 10px 0 30px -5px rgba(0, 0, 0, 0.5);
```

---

### SpayceSpaceHeader

Header showing current Space with actions.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `spaceName` | String | ✓ | - | Space display name |
| `accentColor` | Color | ✓ | - | Space theme color |
| `isExpanded` | bool | | true | Expansion state |
| `onExpandToggle` | VoidCallback | | null | Toggle handler |
| `onSettingsTap` | VoidCallback | | null | Settings action |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Padding: 16px horizontal         │
│           8px vertical            │
│  Text: sectionHeader style        │
│        (12px bold uppercase)      │
│  Text Color: accentColor          │
│  Chevron: 16px, rotates 90°       │
└───────────────────────────────────┘
```

---

### SpayceTreeItem

Individual item in the tree view.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `item` | SpaceItem | ✓ | - | Item data |
| `depth` | int | | 0 | Nesting level |
| `isSelected` | bool | | false | Selection state |
| `onTap` | VoidCallback | | null | Tap handler |
| `onExpand` | VoidCallback | | null | Expand toggle |
| `onContextMenu` | Function(Offset) | | null | Context menu |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Left Indent: depth × 16px        │
│  Padding: 8px horizontal          │
│           6px vertical            │
│  Border Radius: 8px               │
│  Icon Size: 18px                  │
│  Text: 14px medium                │
│  Chevron: 16px (folders only)     │
└───────────────────────────────────┘
```

#### States

| State | Background | Text Color |
|-------|------------|------------|
| Default | transparent | `textPrimary` |
| Hover | white 5% | `textPrimary` |
| Selected | white 10% | `textPrimary` |

#### Nested Border

For items at depth > 0:
```css
border-left: 1px solid rgba(55, 65, 81, 0.5);
padding-left: 8px;
```

---

## Spaces Components

### SpayceCard

Content card for Space grid view.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `space` | Space | ✓ | - | Space data |
| `onTap` | VoidCallback | | null | Card tap |
| `onEdit` | VoidCallback | | null | Edit action |
| `onDelete` | VoidCallback | | null | Delete action |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Width: 288px                     │
│  Background: surfaceDark          │
│  Border Radius: 12px              │
│  Padding: 12px                    │
│  Shadow: cardSubtle               │
│  Shadow (hover): cardHover        │
└───────────────────────────────────┘
```

#### Card Structure

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ HEADER (accentDark bg)              │ │
│ │ [Icon] SPACE NAME         [•••]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ CONTENT (tree items)                    │
│ ├─ 📁 Folder                            │
│ │   └─ 🔗 Link                          │
│ └─ 🔗 Another Link                      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ FOOTER (action buttons)             │ │
│ │ [+ Link] [+ Folder] [+ Import]      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### SpaceFolderActions

Hover toolbar for folder items.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onAddLink` | VoidCallback | | null | Add link action |
| `onAddFolder` | VoidCallback | | null | Add folder action |
| `onMore` | VoidCallback | | null | Context menu |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Opacity: 0 (default)             │
│           1 (parent hover)        │
│  Transition: 150ms                │
│  Button Size: 24px                │
│  Icon Size: 14px                  │
│  Gap: 4px                         │
└───────────────────────────────────┘
```

---

## Browser Components

### SpayceBrowserNav

Browser navigation controls.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `canGoBack` | bool | ✓ | - | Back enabled |
| `canGoForward` | bool | ✓ | - | Forward enabled |
| `isLoading` | bool | ✓ | - | Loading state |
| `onBack` | VoidCallback | ✓ | - | Back action |
| `onForward` | VoidCallback | ✓ | - | Forward action |
| `onRefresh` | VoidCallback | ✓ | - | Refresh action |
| `onStop` | VoidCallback | ✓ | - | Stop action |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Button Size: 36px × 36px         │
│  Icon Size: 18px                  │
│  Border Radius: 8px               │
│  Gap: 4px between buttons         │
└───────────────────────────────────┘
```

#### Button States

| State | Background | Icon Color |
|-------|------------|------------|
| Default | transparent | `textSecondary` |
| Hover | `accentDark` | `textSecondary` |
| Disabled | transparent | `textMuted` 50% |

---

### SpayceUrlBar

URL input field with validation.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `url` | String | ✓ | - | Current URL |
| `isSecure` | bool | | false | HTTPS indicator |
| `isSaved` | bool | | false | Exists in Space |
| `onSubmit` | Function(String) | ✓ | - | Navigate action |
| `onAddToSpace` | VoidCallback | | null | Save to Space |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Height: 36px                     │
│  Padding: 8px horizontal          │
│  Background: surfaceDark 50%      │
│  Border: 1px transparent          │
│  Border (focus): 2px primary      │
│  Border Radius: 8px               │
│  Font: JetBrains Mono 14px        │
└───────────────────────────────────┘
```

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 🔒  flutter.dev/docs/get-started                        ⭐  │
│  ↑   ↑                                                   ↑   │
│ Lock URL text (editable)                            Star    │
└─────────────────────────────────────────────────────────────┘
```

---

### SpayceBrowserTab

Individual browser tab component.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tab` | BrowserTab | ✓ | - | Tab data |
| `isActive` | bool | | false | Active state |
| `onSelect` | VoidCallback | | null | Select handler |
| `onClose` | VoidCallback | | null | Close handler |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Height: 32px                     │
│  Max Width: 200px                 │
│  Min Width: 100px                 │
│  Padding: 8px                     │
│  Border Radius: 8px top only      │
│  Favicon: 16px                    │
│  Close: 14px (on hover)           │
└───────────────────────────────────┘
```

---

## Form Components

### SpayceButton

Standard button component.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | String | ✓ | - | Button text |
| `icon` | IconData? | | null | Leading icon |
| `variant` | ButtonVariant | | primary | Style variant |
| `size` | ButtonSize | | medium | Size variant |
| `isLoading` | bool | | false | Loading state |
| `isDisabled` | bool | | false | Disabled state |
| `onPressed` | VoidCallback | | null | Press handler |

#### Variants

| Variant | Background | Text Color | Border |
|---------|------------|------------|--------|
| Primary | `primary` | white | none |
| Secondary | transparent | `textPrimary` | `borderDark` |
| Ghost | transparent | `textSecondary` | none |
| Danger | `error` 20% | `error` | none |

#### Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| Small | 28px | 8px | 12px |
| Medium | 36px | 12px | 14px |
| Large | 44px | 16px | 16px |

---

### SpayceTextField

Text input field.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | String | | "" | Current value |
| `label` | String? | | null | Field label |
| `placeholder` | String? | | null | Placeholder text |
| `prefix` | Widget? | | null | Leading widget |
| `suffix` | Widget? | | null | Trailing widget |
| `error` | String? | | null | Error message |
| `onChanged` | Function(String) | | null | Change handler |
| `onSubmitted` | Function(String) | | null | Submit handler |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Height: 40px                     │
│  Padding: 12px horizontal         │
│  Background: surfaceDark          │
│  Border: 1px borderDark           │
│  Border (focus): 2px primary      │
│  Border (error): 2px error        │
│  Border Radius: 8px               │
│  Font: 14px regular               │
└───────────────────────────────────┘
```

---

## Feedback Components

### SpayceToast

Toast notification.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | String | ✓ | - | Toast message |
| `type` | ToastType | | info | Notification type |
| `action` | Widget? | | null | Action button |
| `duration` | Duration | | 3s | Auto-dismiss time |

#### Types

| Type | Icon | Color |
|------|------|-------|
| Info | `Info` | `info` (#3B82F6) |
| Success | `CheckCircle` | `success` (#10B981) |
| Warning | `AlertTriangle` | `warning` (#F59E0B) |
| Error | `XCircle` | `error` (#EF4444) |

#### Visual Specifications

```
┌───────────────────────────────────┐
│  Padding: 12px 16px               │
│  Background: surfaceDark          │
│  Border Radius: 8px               │
│  Shadow: dropdown                 │
│  Max Width: 400px                 │
└───────────────────────────────────┘
```

---

### SpayceSpinner

Loading spinner.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | double | | 24 | Spinner diameter |
| `color` | Color | | primary | Spinner color |
| `strokeWidth` | double | | 2 | Line thickness |

---

## Layout Components

### SpayceResponsiveGrid

Responsive grid for Space cards.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | List\<Widget> | ✓ | - | Grid items |
| `itemWidth` | double | | 288 | Card width |
| `gap` | double | | 16 | Grid gap |

#### Breakpoints

| Breakpoint | Width | Columns |
|------------|-------|---------|
| Mobile | < 640px | 1 |
| Tablet | 640-1024px | 2 |
| Desktop | 1024-1440px | 3 |
| Large | > 1440px | 4 |

---

### SpayceScrollView

Styled scrollable container.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `child` | Widget | ✓ | - | Scrollable content |
| `padding` | EdgeInsets | | zero | Content padding |

#### Scrollbar Styling

```
┌───────────────────────────────────┐
│  Thumb Color: accentDark          │
│  Thumb Hover: lighter             │
│  Thumb Radius: 4px                │
│  Thumb Width: 8px                 │
│  Track: transparent               │
└───────────────────────────────────┘
```

---

## Component File Locations

```
frontend/lib/features/navigation/presentation/widgets/
├── spayce_bottom_tab_bar.dart
├── spayce_nav_button.dart
├── spayce_nav_dot.dart
├── spayce_space_icon.dart
├── spayce_space_header.dart
├── spayce_user_profile.dart

frontend/lib/features/spaces/presentation/widgets/
├── space_card.dart
├── space_tree_view.dart
├── tree_item_widget.dart
├── folder_actions.dart
├── inline_input.dart

frontend/lib/features/browser/presentation/widgets/
├── browser_toolbar.dart
├── url_bar.dart
├── browser_tab.dart
├── progress_bar.dart
```

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
