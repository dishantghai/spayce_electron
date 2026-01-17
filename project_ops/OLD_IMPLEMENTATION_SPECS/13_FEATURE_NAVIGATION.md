# Spayce - Feature: Navigation (Sidebar & Bottom Bar)

> **Document Purpose**: Complete specification of the navigation system for pixel-perfect recreation.

---

## Table of Contents

1. [Navigation Overview](#navigation-overview)
2. [Sidebar Structure](#sidebar-structure)
3. [Bottom Tab Bar](#bottom-tab-bar)
4. [Navigation Components](#navigation-components)
5. [State & Behavior](#state--behavior)
6. [Visual Specifications](#visual-specifications)
7. [Screenshots](#screenshots)

---

## Navigation Overview

### Architecture

Spayce uses a **sidebar-centric navigation** pattern inspired by Arc Browser:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SPAYCE WINDOW                              │
├──────────────────────┬──────────────────────────────────────────────┤
│                      │                                              │
│                      │                                              │
│      SIDEBAR         │              MAIN CONTENT                    │
│      (320px)         │              (Browser View)                  │
│                      │                                              │
│  ┌────────────────┐  │                                              │
│  │ Nav Buttons    │  │                                              │
│  │ [Browser][Tabs]│  │                                              │
│  └────────────────┘  │                                              │
│                      │                                              │
│  ┌────────────────┐  │                                              │
│  │ Space Tree     │  │                                              │
│  │ (scrollable)   │  │                                              │
│  └────────────────┘  │                                              │
│                      │                                              │
│  ┌────────────────┐  │                                              │
│  │ Bottom Bar     │  │                                              │
│  │ [•][•][•][+]👤 │  │                                              │
│  └────────────────┘  │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Navigation Modes

| Mode | Description | Sidebar Content |
|------|-------------|-----------------|
| **Browser** | Web browsing mode | Tab list, URL bar |
| **Spaces** | Content organization | Space tree, items |

---

## Sidebar Structure

### Layout Breakdown

```
┌──────────────────────────── 320px ────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ NAVIGATION HEADER (56px)                        [📌]     │  │
│ │ [🌐 Browser] [📑 Tabs]                                    │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ SPACE HEADER                                              │  │
│ │ MACHINE LEARNING ▼                                  [⚙️]  │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ CONTENT AREA (scrollable, fills remaining space)         │  │
│ │                                                           │  │
│ │ ├─ 📁 AI Deep Dive Series                                │  │
│ │ │   ├─ 🔗 Gemini 3.0 Tutorial                            │  │
│ │ │   └─ 🔗 Claude API Docs                                │  │
│ │ │                                                         │  │
│ │ └─ 🔗 Hugging Face Hub                                   │  │
│ │                                                           │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ BOTTOM TAB BAR (60px)                                     │  │
│ │ [🟣] • [🟠] • [🟢] • [🔴] • [+]              👤 User     │  │
│ └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Section Specifications

| Section | Height | Background | Padding |
|---------|--------|------------|---------|
| Navigation Header | 56px | `sidebarDark` | 12px all |
| Space Header | auto | `sidebarDark` | 16px h, 8px v |
| Content Area | flex | `sidebarDark` | 8px all |
| Bottom Tab Bar | 60px | `sidebarDark` + top border | 16px h, 8px v |

### Sidebar Container Properties

| Property | Value |
|----------|-------|
| Width | 320px (fixed, `SpayceSpacing.sidebarWidth`) |
| Background | `sidebarDark` (#131020) |
| Border Radius (overlay) | 16px top-right, 16px bottom-right |
| Shadow (overlay) | `sidebarEmbossed` |
| Shadow (embedded) | none |

---

## Bottom Tab Bar

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [🟣] • [🟠] • [🟢] • [🔴] • [+]                    👤 User    │
│   ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑                      ↑        │
│  S1  dot S2 dot S3 dot S4 dot Add               Profile       │
└────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Size | Purpose |
|-----------|------|---------|
| Space Icons | 32px circle | Navigate to Space |
| Nav Dots | 4px circle | Visual separator |
| Add Button | 40px circle | Create new Space |
| User Profile | varies | User info & settings |

### Spacing

- Space icons: 0px between (dots provide spacing)
- Nav dot: 8px margin on each side
- Add button: 8px left margin
- User profile: pushed to right (Expanded spacer)

---

## Navigation Components

### SpayceNavButton

Toggle button for Browser/Spaces modes.

```
┌─────────────────────────────────────┐
│  [🌐 Browser]   [📑 Tabs]           │
│       ↑              ↑              │
│   Selected       Unselected         │
└─────────────────────────────────────┘
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `label` | String | Button text |
| `icon` | IconData | Leading icon |
| `isSelected` | bool | Current selection state |
| `onTap` | VoidCallback | Tap handler |

#### Visual States

| State | Background | Text Color | Icon Color |
|-------|------------|------------|------------|
| Default | transparent | `textSecondary` | `textSecondary` |
| Hover | `accentDark` | `textSecondary` | `textSecondary` |
| Selected | `primary` 15% opacity | `primary` | `primary` |

#### Styling

```dart
Container(
  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
  decoration: BoxDecoration(
    color: isSelected 
      ? SpayceColors.primary.withOpacity(0.15)
      : isHovered 
        ? SpayceColors.accentDark 
        : Colors.transparent,
    borderRadius: BorderRadius.circular(8),
  ),
  child: Row(
    children: [
      Icon(icon, size: 20, color: color),
      SizedBox(width: 8),
      Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
    ],
  ),
)
```

---

### SpayceSpaceIcon

Circular icon representing a Space in the bottom bar.

```
   ┌───┐
   │ 📁 │  ← 32px circle with icon
   └───┘
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `icon` | IconData | Lucide icon |
| `accentColor` | Color | Space theme color |
| `isSelected` | bool | Current selection |
| `onTap` | VoidCallback | Selection handler |

#### Visual States

| State | Background | Icon Color | Border |
|-------|------------|------------|--------|
| Default | `accentColor` 20% | `accentColor` | none |
| Hover | `accentColor` 30% | `accentColor` | none |
| Selected | `accentColor` 100% | white | 2px white 20% |

#### Animation

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Hover | Background transition | 150ms |
| Tap Down | Scale to 0.9 | 100ms |
| Tap Up | Scale to 1.0 | 100ms |

#### Implementation

```dart
AnimatedContainer(
  duration: Duration(milliseconds: 150),
  width: 32,
  height: 32,
  decoration: BoxDecoration(
    color: isSelected
      ? accentColor
      : accentColor.withOpacity(isHovered ? 0.3 : 0.2),
    borderRadius: BorderRadius.circular(999),
    border: isSelected 
      ? Border.all(color: Colors.white.withOpacity(0.2), width: 2)
      : null,
  ),
  child: Icon(
    icon,
    size: 16,
    color: isSelected ? Colors.white : accentColor,
  ),
)
```

---

### SpayceNavDot

Small circular dot between Space icons.

```
    •   ← 4px circle
```

#### Properties

| Property | Value |
|----------|-------|
| Size | 4px × 4px |
| Shape | Circle |
| Color | `navDot` (#4B5563) |
| Margin | 8px horizontal |

#### Hover Effect

| State | Color | Scale |
|-------|-------|-------|
| Default | `navDot` | 1.0 |
| Hover | `textSecondary` | 1.5 |

#### Implementation

```dart
MouseRegion(
  onEnter: (_) => setState(() => _isHovered = true),
  onExit: (_) => setState(() => _isHovered = false),
  child: AnimatedContainer(
    duration: Duration(milliseconds: 150),
    width: 4,
    height: 4,
    margin: EdgeInsets.symmetric(horizontal: 8),
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: _isHovered 
        ? SpayceColors.textSecondary 
        : SpayceColors.navDot,
    ),
    transform: Matrix4.identity()..scale(_isHovered ? 1.5 : 1.0),
  ),
)
```

---

### SpayceUserProfile

User information displayed in bottom bar.

```
┌───────────────────────────────────┐
│  [👤]  John Doe                   │
│        Pro Plan           [⚙️]    │
└───────────────────────────────────┘
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `displayName` | String? | User's name |
| `email` | String? | User's email |
| `avatarUrl` | String? | Profile picture URL |
| `onSettingsTap` | VoidCallback? | Settings action |

#### Layout

| Element | Specification |
|---------|---------------|
| Avatar | 32px circle, fallback to initials |
| Name | 14px medium, `textPrimary` |
| Plan/Email | 11px regular, `textMuted` |
| Settings Icon | 18px, `textSecondary` |

---

### SpayceSpaceHeader

Header showing current Space name with actions.

```
┌─────────────────────────────────────────────────────┐
│  MACHINE LEARNING  ▼                          [⚙️]  │
└─────────────────────────────────────────────────────┘
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `spaceName` | String | Current Space name |
| `accentColor` | Color | Space theme color |
| `isExpanded` | bool | Tree expansion state |
| `onExpandToggle` | VoidCallback | Toggle expansion |
| `onSettingsTap` | VoidCallback | Settings action |

#### Styling

| Element | Specification |
|---------|---------------|
| Background | transparent |
| Padding | 16px horizontal, 8px vertical |
| Text | `sectionHeader` style (12px, bold, uppercase, 0.5 letter-spacing) |
| Text Color | Space `accentColor` |
| Chevron | 16px, rotates 90° when collapsed |

---

## State & Behavior

### Navigation State

```dart
// Current navigation mode
enum NavigationMode { browser, spaces }

@riverpod
class NavigationState extends _$NavigationState {
  @override
  NavigationMode build() => NavigationMode.browser;
  
  void toggleMode() {
    state = state == NavigationMode.browser 
      ? NavigationMode.spaces 
      : NavigationMode.browser;
  }
}
```

### Active Space State

```dart
@riverpod
class ActiveSpace extends _$ActiveSpace {
  @override
  int build() => 0;  // Index of selected space
  
  void select(int index) => state = index;
}
```

### Sidebar Visibility (Mobile)

```dart
@riverpod
class SidebarVisible extends _$SidebarVisible {
  @override
  bool build() => true;  // Desktop: always true
  
  void toggle() => state = !state;
  void show() => state = true;
  void hide() => state = false;
}
```

---

## Visual Specifications

### Color Tokens Used

| Purpose | Token | Hex |
|---------|-------|-----|
| Sidebar background | `sidebarDark` | #131020 |
| Surface elements | `surfaceDark` | #1A1628 |
| Hover highlight | `accentDark` | #2D2645 |
| Primary accent | `primary` | #6D5AE6 |
| Text (primary) | `textPrimary` | #E5E7EB |
| Text (secondary) | `textSecondary` | #9CA3AF |
| Text (muted) | `textMuted` | #6B7280 |
| Nav dots | `navDot` | #4B5563 |
| Border (subtle) | `borderSubtle` | #1F2937 |

### Animation Timings

| Interaction | Duration | Curve |
|-------------|----------|-------|
| Hover effects | 150ms | easeInOut |
| Scale press | 100ms | easeInOut |
| Mode switch | 200ms | easeInOut |
| Sidebar slide | 250ms | easeOut |

### Icon Mapping

| Purpose | Icon | Size |
|---------|------|------|
| Browser mode | `Globe` | 20px |
| Spaces mode | `LayoutGrid` | 20px |
| Pin sidebar | `Pin` | 18px |
| Settings | `Settings` | 18px |
| Expand/Collapse | `ChevronDown` | 16px |
| Add | `Plus` | 20px |

---

## Screenshots

### Sidebar with Spaces Open
![Sidebar Spaces](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/App%20Side%20Bar%20with%20Spaces%20Screen%20Open.png)

### Browser Tab Bar
![Browser Tab Bar](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Browser%20Tab%20Bar.png)

### Sidebar Tabs and Context Icons
![Sidebar Icons](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Sidebar%20Tabs%20and%20Spaces%20Contex%20Icons.png)

### Settings Screen
![Settings](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Settings%20Screen.png)

---

## Responsive Behavior

### Desktop (> 1024px)

- Sidebar: Always visible, 320px fixed width
- Main content: Fills remaining space

### Tablet (640px - 1024px)

- Sidebar: Overlay mode with slide animation
- Toggle button to show/hide
- Shadow appears when overlaying content

### Mobile (< 640px)

- Sidebar: Full-screen or bottom sheet
- Hamburger menu to toggle
- Gesture: Swipe from left edge to reveal

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Cmd/Ctrl + 1-9` | Switch to Space 1-9 |
| `Cmd/Ctrl + [` | Previous Space |
| `Cmd/Ctrl + ]` | Next Space |
| `Cmd/Ctrl + \`` | Toggle sidebar |
| `Cmd/Ctrl + L` | Focus URL bar |

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
