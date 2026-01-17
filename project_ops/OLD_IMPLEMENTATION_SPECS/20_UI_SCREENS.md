# Spayce - UI Screens

> **Document Purpose**: Complete specification of all screens and their layouts for pixel-perfect recreation.

---

## Table of Contents

1. [Screen Overview](#screen-overview)
2. [Home/Spaces Screen](#homespaces-screen)
3. [Browser View](#browser-view)
4. [Workspace View](#workspace-view)
5. [Settings Screen](#settings-screen)
6. [Dialogs & Modals](#dialogs--modals)
7. [Responsive Behavior](#responsive-behavior)

---

## Screen Overview

### Screen Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              APP SHELL                              │
├──────────────────────┬──────────────────────────────────────────────┤
│                      │                                              │
│      SIDEBAR         │              MAIN CONTENT                    │
│      (320px)         │              (remaining width)               │
│                      │                                              │
│  ┌────────────────┐  │  ┌────────────────────────────────────────┐ │
│  │ Nav Header     │  │  │                                        │ │
│  └────────────────┘  │  │                                        │ │
│                      │  │                                        │ │
│  ┌────────────────┐  │  │         SCREEN CONTENT                 │ │
│  │ Content Area   │  │  │                                        │ │
│  │ (scrollable)   │  │  │   - Spaces Screen (Grid)              │ │
│  └────────────────┘  │  │   - Browser View (WebView)            │ │
│                      │  │   - Workspace View (File Tree)        │ │
│  ┌────────────────┐  │  │   - Settings Screen                   │ │
│  │ Bottom Bar     │  │  │                                        │ │
│  └────────────────┘  │  └────────────────────────────────────────┘ │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Navigation Flow

```
                        ┌──────────────┐
                        │  App Launch  │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Auth Check   │
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌──────────┐     ┌──────────┐     ┌──────────┐
       │ Login    │     │ Home     │     │ Browser  │
       │ Screen   │     │ (Spaces) │     │ View     │
       └──────────┘     └──────────┘     └──────────┘
```

---

## Home/Spaces Screen

The main screen showing all Spaces in a responsive grid.

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR                │ MAIN CONTENT                               │
│ (320px)                │                                            │
│                        │ ┌────────────────────────────────────────┐ │
│ ┌──────────────────┐   │ │ SPACES (header)              [🔍] [+] │ │
│ │ [Browser][Spaces]│   │ └────────────────────────────────────────┘ │
│ └──────────────────┘   │                                            │
│                        │ ┌───────────┐ ┌───────────┐ ┌───────────┐ │
│ ┌──────────────────┐   │ │   SPACE   │ │   SPACE   │ │   SPACE   │ │
│ │ ACTIVE SPACE ▼   │   │ │   CARD    │ │   CARD    │ │   CARD    │ │
│ │ (tree content)   │   │ │  (288px)  │ │  (288px)  │ │  (288px)  │ │
│ │                  │   │ └───────────┘ └───────────┘ └───────────┘ │
│ │                  │   │                                            │
│ │                  │   │ ┌───────────┐ ┌───────────┐               │
│ │                  │   │ │   SPACE   │ │   SPACE   │               │
│ └──────────────────┘   │ │   CARD    │ │   CARD    │               │
│                        │ └───────────┘ └───────────┘               │
│ ┌──────────────────┐   │                                            │
│ │ [•][•][•][+] 👤  │   │                                            │
│ └──────────────────┘   │                                            │
└────────────────────────┴────────────────────────────────────────────┘
```

### Main Content Area

| Property | Value |
|----------|-------|
| Background | `backgroundDark` (#0F0B1A) |
| Padding | 24px all sides |
| Header Height | 56px |

### Space Cards Grid

| Property | Value |
|----------|-------|
| Card Width | 288px (fixed) |
| Grid Gap | 16px |
| Columns | Responsive (1-4 based on width) |

### Header Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│  SPACES                                            [🔍]   [+]      │
│    ↑                                                ↑      ↑        │
│  Title (24px bold)                            Search  Add Space    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Browser View

Full-screen browser with WebView content.

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR                │ BROWSER VIEW                               │
│ (320px)                │                                            │
│                        │ ┌────────────────────────────────────────┐ │
│ ┌──────────────────┐   │ │ [←][→][🔄] │ 🔒 url.com          [⭐] │ │
│ │ [Browser][Spaces]│   │ └────────────────────────────────────────┘ │
│ └──────────────────┘   │ ┌────────────────────────────────────────┐ │
│                        │ │▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░ (loading)│ │
│ ┌──────────────────┐   │ └────────────────────────────────────────┘ │
│ │ TAB LIST         │   │                                            │
│ │ ├─ 🌐 Tab 1      │   │ ┌────────────────────────────────────────┐ │
│ │ └─ 🌐 Tab 2      │   │ │                                        │ │
│ │                  │   │ │                                        │ │
│ │                  │   │ │              WEB VIEW                  │ │
│ │                  │   │ │              CONTENT                   │ │
│ │                  │   │ │                                        │ │
│ └──────────────────┘   │ │                                        │ │
│                        │ │                                        │ │
│ ┌──────────────────┐   │ │                                        │ │
│ │ [•][•][•][+] 👤  │   │ └────────────────────────────────────────┘ │
│ └──────────────────┘   │                                            │
└────────────────────────┴────────────────────────────────────────────┘
```

### Toolbar Specifications

| Property | Value |
|----------|-------|
| Height | 48px |
| Background | `surfaceDark` (#1A1628) |
| Padding | 8px horizontal, 6px vertical |
| Border | Bottom 1px `borderSubtle` |

### WebView Container

| Property | Value |
|----------|-------|
| Background | White (web content default) |
| Fills | Remaining height |
| Overflow | Clip |

---

## Workspace View

File browser and content management view.

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR                │ WORKSPACE VIEW                             │
│ (320px)                │                                            │
│                        │ ┌────────────────────────────────────────┐ │
│ ┌──────────────────┐   │ │ 📂 home > projects > spayce   [•••]   │ │
│ │ [Browser][Spaces]│   │ └────────────────────────────────────────┘ │
│ └──────────────────┘   │                                            │
│                        │ ┌────────────────────────────────────────┐ │
│ ┌──────────────────┐   │ │ FILE TREE                              │ │
│ │ WORKSPACE TREE   │   │ │                                        │ │
│ │ ├─ 📁 frontend   │   │ │ ├─ 📁 lib                              │ │
│ │ │   ├─ 📁 lib    │   │ │ │   ├─ 📁 core                        │ │
│ │ │   └─ 📁 test   │   │ │ │   ├─ 📁 features                    │ │
│ │ └─ 📁 backend    │   │ │ │   └─ 📄 main.dart                   │ │
│ │                  │   │ │ ├─ 📄 pubspec.yaml                     │ │
│ │                  │   │ │ └─ 📄 README.md                        │ │
│ └──────────────────┘   │ │                                        │ │
│                        │ │                                        │ │
│ ┌──────────────────┐   │ └────────────────────────────────────────┘ │
│ │ [•][•][•][+] 👤  │   │ ┌────────────────────────────────────────┐ │
│ └──────────────────┘   │ │ STATUS BAR                             │ │
└────────────────────────┴─┴────────────────────────────────────────┘─┘
```

### Breadcrumb Bar

| Property | Value |
|----------|-------|
| Height | 40px |
| Background | `surfaceDark` |
| Padding | 12px horizontal |
| Font | 14px medium |
| Separator | `›` (chevron) |

### File Tree

| Property | Value |
|----------|-------|
| Background | `backgroundDark` |
| Padding | 16px |
| Item Height | 32px |
| Indent | 16px per level |

### Status Bar

| Property | Value |
|----------|-------|
| Height | 24px |
| Background | `sidebarDark` |
| Font | 11px regular |
| Text Color | `textMuted` |

---

## Settings Screen

User settings and preferences.

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR                │ SETTINGS                                   │
│ (320px)                │                                            │
│                        │ ┌────────────────────────────────────────┐ │
│ ┌──────────────────┐   │ │ SETTINGS (header)                [X]  │ │
│ │ [Browser][Spaces]│   │ └────────────────────────────────────────┘ │
│ └──────────────────┘   │                                            │
│                        │ ┌────────────────────────────────────────┐ │
│ ┌──────────────────┐   │ │ ACCOUNT                                │ │
│ │ Settings Nav     │   │ │ ┌────────────────────────────────────┐ │ │
│ │ > Account        │   │ │ │ [👤] John Doe                     │ │ │
│ │   Appearance     │   │ │ │      john@example.com              │ │ │
│ │   Browser        │   │ │ └────────────────────────────────────┘ │ │
│ │   Privacy        │   │ │ [Sign Out]                             │ │
│ │   About          │   │ └────────────────────────────────────────┘ │
│ │                  │   │                                            │
│ └──────────────────┘   │ ┌────────────────────────────────────────┐ │
│                        │ │ APPEARANCE                             │ │
│ ┌──────────────────┐   │ │ Theme: [Dark ▼]                       │ │
│ │ [•][•][•][+] 👤  │   │ │ Accent Color: [🟣 Violet ▼]           │ │
│ └──────────────────┘   │ └────────────────────────────────────────┘ │
└────────────────────────┴────────────────────────────────────────────┘
```

### Settings Sections

| Section | Contents |
|---------|----------|
| Account | User info, sign out, subscription |
| Appearance | Theme, accent color, font size |
| Browser | Default search, homepage, privacy |
| Privacy | Data, cache, cookies |
| About | Version, licenses, support |

### Settings Card

| Property | Value |
|----------|-------|
| Background | `surfaceDark` |
| Border Radius | 12px |
| Padding | 16px |
| Margin Bottom | 16px |
| Title | 14px bold, `textSecondary` |

---

## Dialogs & Modals

### Create Space Dialog

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │  CREATE NEW SPACE                                    [X]  │     │
│   ├───────────────────────────────────────────────────────────┤     │
│   │                                                           │     │
│   │  Name                                                     │     │
│   │  ┌─────────────────────────────────────────────────────┐ │     │
│   │  │ Machine Learning                                    │ │     │
│   │  └─────────────────────────────────────────────────────┘ │     │
│   │                                                           │     │
│   │  Color                                                    │     │
│   │  [🟣] [🟠] [🟢] [🔴] [🔵] [⚫] [🟤] [🟧]               │     │
│   │                                                           │     │
│   │  Icon                                                     │     │
│   │  ┌─────────────────────────────────────────────────────┐ │     │
│   │  │ [📁][💼][🏠][❤️][👤][💻][🎨][📖][🎯][⭐]...      │ │     │
│   │  └─────────────────────────────────────────────────────┘ │     │
│   │                                                           │     │
│   │  Preview                                                  │     │
│   │  ┌───┐                                                    │     │
│   │  │🟣│  Machine Learning                                  │     │
│   │  └───┘                                                    │     │
│   │                                                           │     │
│   │                           [Cancel]  [Create Space]        │     │
│   └───────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Dialog Specifications

| Property | Value |
|----------|-------|
| Width | 400px (max) |
| Background | `surfaceDark` |
| Border Radius | 16px |
| Padding | 24px |
| Shadow | `dropdown` |
| Overlay | Black 50% opacity |

---

### Confirmation Dialog

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  DELETE SPACE                                           │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │  Are you sure you want to delete "Machine Learning"?   │ │
│  │  This action cannot be undone.                         │ │
│  │                                                         │ │
│  │                         [Cancel]  [Delete]             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Width | 360px |
| Delete Button | `error` background |

---

### Context Menu

```
┌─────────────────────────┐
│ 🌐 Open in Browser      │
│ 📋 Copy Link            │
│ ✏️  Rename               │
│ 📁 Move to...           │
│ ─────────────────────   │
│ 🗑️  Delete               │
└─────────────────────────┘
```

| Property | Value |
|----------|-------|
| Width | 200px |
| Background | `surfaceDark` |
| Border Radius | 8px |
| Shadow | `dropdown` |
| Item Height | 36px |
| Item Padding | 12px horizontal |
| Divider | 1px `borderDark` |
| Destructive | `error` color |

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Sidebar overlay, 1 column |
| Tablet | 640-1024px | Sidebar overlay, 2 columns |
| Desktop | 1024-1440px | Sidebar embedded, 3 columns |
| Large | > 1440px | Sidebar embedded, 4 columns |

### Mobile Layout

```
┌─────────────────────────┐
│ ☰  SPAYCE         [👤]  │  ← App Bar with hamburger
├─────────────────────────┤
│                         │
│ ┌───────────────────┐   │
│ │    SPACE CARD     │   │  ← Full width cards
│ └───────────────────┘   │
│                         │
│ ┌───────────────────┐   │
│ │    SPACE CARD     │   │
│ └───────────────────┘   │
│                         │
│                         │
│                         │
├─────────────────────────┤
│ [🟣][🟠][🟢][+]   [👤] │  ← Bottom navigation
└─────────────────────────┘
```

### Sidebar Behavior

| Screen Size | Sidebar Mode | Toggle |
|-------------|--------------|--------|
| Mobile | Full-screen overlay | Hamburger menu |
| Tablet | Slide-in overlay | Swipe gesture |
| Desktop | Embedded (always visible) | Pin/unpin |

---

## Screenshots Reference

### Spaces Screen
![Spaces Screen](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Spaces%20Screen%20from%20Spaces%20Tab.png)

### Sidebar with Spaces
![Sidebar Spaces](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/App%20Side%20Bar%20with%20Spaces%20Screen%20Open.png)

### Browser View
![Browser View](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Browser%20View.png)

### Workspace View
![Workspace](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Worskspace%20View.png)

### Settings Screen
![Settings](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Settings%20Screen.png)

### Create New Space
![Create Space](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Create%20New%20Space%20from%20Bottom%20Bar%20in%20App%20Sidebar.png)

### Choose Space Icon
![Space Icons](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Create%20New%20Space%20Choose%20Space%20Icon.png)

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
