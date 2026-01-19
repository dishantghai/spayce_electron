# F001: Complete Sidebar Navigation System

## Overview

The Sidebar is the primary navigation component in Spayce, providing access to spaces, folders, links, and navigation tabs. This spec covers the complete implementation including all sub-components.

## Reference Screenshots
- `project_ops/HIFI_UI_DESIGN_SCREENS/App Side Bar with Spaces Screen Open.png`
- User-provided screenshots showing tabs, pinned grid, and context icons

---

## Component Architecture

```
Sidebar/
├── SidebarContainer (main wrapper, fixed/floating modes)
├── TopIcons (pin toggle)
├── NavigationTabs (Browser/Spaces/Workspace)
├── PinnedLinksGrid (Arc-style pinned items)
├── SpaceHeader (space name + context icons)
├── TreeView (folder/link hierarchy)
├── BottomBar (space navigation icons + profile)
└── State Management (Zustand stores)
```

---

## 1. Sidebar Container

### Layout
- **Width**: 320px (`SpayceSpacing.sidebarWidth`)
- **Background**: `#131020` (`SpayceColors.sidebarDark`)
- **Border radius**: 12px (floating mode only, top-right and bottom-right)
- **Height**: 100vh

### Sidebar Modes
1. **Fixed Mode**: Always visible, content pushed right
2. **Floating Mode**: Hidden by default, appears on hover at left edge

### Fixed Mode Styling
```css
.sidebarFixed {
  width: 320px;
  height: 100%;
  background-color: #131020;
}
```

### Floating Mode Styling
```css
.sidebarFloating {
  width: 320px;
  height: 100%;
  background-color: #131020;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
  border: 1.5px solid rgba(109, 90, 230, 0.3);
  box-shadow: 
    4px 0 30px 5px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(109, 90, 230, 0.1);
}
```

---

## 2. Top Icons

### Layout
- Position: Top right of sidebar
- Padding: `12px 12px 0 12px`

### Pin Toggle Button
- **Icon**: `Pin` (fixed) / `PinOff` (floating)
- **Size**: 16px
- **Color**: `#6B7280` (textMuted)
- **Action**: Toggle between fixed and floating modes

---

## 3. Navigation Tabs (Browser/Spaces/Workspace)

### Layout
- **Direction**: Vertical stack
- **Margin**: `0 12px`
- **Gap**: 4px between items

### Tab Item
```typescript
interface NavTabProps {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}
```

### Tab Styling
| State | Background | Text Color | Icon Color |
|-------|------------|------------|------------|
| Default | transparent | `#9CA3AF` | `#9CA3AF` |
| Hover | `rgba(45, 38, 69, 0.5)` | `#9CA3AF` | `#9CA3AF` |
| Active | `#2D2645` | `#FFFFFF` | `#FFFFFF` |

### Tab Dimensions
- **Height**: 40px
- **Padding**: `10px 12px`
- **Border radius**: 8px
- **Icon size**: 18px
- **Font size**: 14px
- **Font weight**: 500
- **Gap** (icon to text): 10px

### Tabs Definition
```typescript
const SIDEBAR_TABS = [
  { id: 'browser', label: 'Browser', icon: Globe },
  { id: 'spaces', label: 'Spaces', icon: LayoutGrid },
  { id: 'workspace', label: 'Workspace', icon: Laptop2 },
] as const;
```

---

## 4. Pinned Links Grid

### Layout
- **Position**: Below navigation tabs
- **Margin**: `8px`
- **Padding**: `6px`
- **Border radius**: 8px

### Grid Configuration
- **Card size**: 48px × 48px
- **Spacing**: 8px
- **Columns**: 5
- **Max pins**: 15 (5 × 3)

### Empty State
```css
.emptyPinsHint {
  padding: 8px;
  border: 1px dashed rgba(31, 41, 55, 0.3);
  border-radius: 8px;
  text-align: center;
  color: rgba(107, 114, 128, 0.5);
  font-size: 10px;
}
```

### Pinned Card Styling
| State | Background | Border |
|-------|------------|--------|
| Default | `#1F1932` | `1px solid #1F2937` |
| Hover | `rgba(45, 38, 69, 0.5)` | `1px solid #374151` |
| Active | `rgba(accent, 0.15)` | `2px solid accent` |

### Pinned Card Structure
- **Size**: 48px × 48px
- **Border radius**: 10px
- **Favicon size**: 24px (centered)

### Drag & Drop
- Accept only links (`SpaceItemType.link`)
- Show preview card at drop position
- Visual feedback with accent color border

---

## 5. Space Header

### Layout
- **Padding**: `12px 16px`
- **Border radius**: 6px (on hover)

### Structure (from left to right)
1. **Space Icon Container** (24px × 24px)
   - Background: `rgba(accentColor, 0.15)`
   - Border radius: 6px
   - Icon: 14px, accent color

2. **Space Name**
   - Text transform: UPPERCASE
   - Font size: 12px
   - Font weight: 700
   - Letter spacing: 1px
   - Color: accent color

3. **Edit Button** (on hover)
   - Icon: Pencil, 14px
   - Background: `#1F1932`
   - Border radius: 4px

4. **Spacer**

5. **Action Icons** (on hover, right side)
   - FolderPlus - "Add Folder"
   - Link - "Add Link"
   - StickyNote - "Add Note" (disabled)
   - Download - "Import" (disabled)

### Hover State
- Background: `rgba(45, 38, 69, 0.3)`
- Show edit button and action icons with opacity animation

---

## 6. Folder/Link Items with Context Icons

### Folder Header (when hovered)
Show action icons on the right:
- **Copy** (duplicate folder)
- **Link** (copy all links)
- **MoreVertical** (menu)

### Folder Item Structure
```
[Chevron] [FolderIcon] [Name]                    [ActionIcons]
```

### Link Item Structure  
```
         [Favicon/LinkIcon] [Name]               [ActionIcons]
```

### Folder Icon Colors
- **Closed folder**: `#9CA3AF` (textSecondary)
- **Open folder**: accent color
- **Local folder**: Use `FolderInput` icon

### Tree Indentation
- **Per level**: 16px (`SpayceSpacing.treeIndent`)
- **Base padding**: 16px

---

## 7. Space Theme Colors

The active space's accent color is used throughout:

1. **Space name text color**: accent color
2. **Space icon background**: `rgba(accentColor, 0.15)`
3. **Open folder icon**: accent color
4. **Pinned grid border on hover**: accent color
5. **Selection highlight**: `rgba(accentColor, 0.15)`
6. **Bottom bar active icon**: accent border

### Available Theme Colors
```typescript
const SpaceThemes = [
  '#6D5AE6', // Violet (primary)
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
];
```

---

## 8. Bottom Bar (F002)

### Layout
- **Position**: Bottom of sidebar
- **Padding**: `8px 12px`
- **Border top**: `1px solid #1F2937`

### Structure (top to bottom)
1. **Space Icons Row** (scrollable horizontal)
2. **Divider**
3. **Profile Button**

### Space Icon
- **Size**: 28px × 28px
- **Shape**: Circle
- **Background**: `rgba(accentColor, 0.15)`
- **Border** (active): `2px solid accentColor`
- **Icon size**: 14px

### Add Space Button
- **Size**: 18px × 18px
- **Border**: `1px solid #374151`
- **Border radius**: 4px
- **Icon**: Plus, 10px, `#6B7280`

### Profile Button
- **Avatar size**: 24px
- **Name font size**: 13px
- **Settings icon**: 14px, `#6B7280`

### Drag Reordering
- Horizontal drag to reorder spaces
- Animated drop gap indicator between items
- Gap width when active: 32px
- Gap indicator: 3px × 20px pill, primary color

---

## 9. Keyboard Navigation

### Within Space Tree
| Key | Action |
|-----|--------|
| ↑ | Select previous item |
| ↓ | Select next item |
| → | Expand folder / move to first child |
| ← | Collapse folder / move to parent |
| Enter | Open link in browser / toggle folder |
| Delete/Backspace | Delete selected item(s) |
| Escape | Clear selection / cancel edit |

### Space Navigation
| Key | Action |
|-----|--------|
| Tab / ] | Next space |
| Shift+Tab / [ | Previous space |

### Clipboard Operations
| Key | Action |
|-----|--------|
| Ctrl/Cmd+C | Copy selected item(s) |
| Ctrl/Cmd+V | Paste into selected folder or root |

### Multi-Selection
- **Ctrl+Click**: Toggle item in selection
- **Shift+Click**: Range selection from last selected

---

## 10. State Management (Zustand)

### Sidebar Store
```typescript
interface SidebarState {
  mode: 'fixed' | 'floating';
  isVisible: boolean;
  activeTab: 'browser' | 'spaces' | 'workspace';
  
  // Actions
  setMode: (mode: SidebarMode) => void;
  setVisible: (visible: boolean) => void;
  setActiveTab: (tab: SidebarTab) => void;
  toggleMode: () => void;
}
```

### Space Navigation Store
```typescript
interface SpaceNavState {
  activeSpaceIndex: number;
  expandedFolders: Set<string>;
  selectedItemId: string | null;
  multiSelection: {
    spaceId: string;
    selectedIds: Set<string>;
    lastSelectedId: string | null;
  } | null;
  
  // Actions
  setActiveSpace: (index: number) => void;
  toggleFolder: (folderId: string) => void;
  selectItem: (itemId: string) => void;
  addToSelection: (itemId: string) => void;
  clearSelection: () => void;
  navigateToNextSpace: () => void;
  navigateToPreviousSpace: () => void;
}
```

---

## 11. Animations

### Sidebar Toggle (floating mode)
- **Duration**: 200ms
- **Easing**: ease-out

### Folder Expand/Collapse
- **Duration**: 200ms
- **Easing**: ease-in-out
- **Chevron rotation**: 0° → 90°

### Hover Effects
- **Duration**: 150ms
- **Property**: opacity, background-color

### Drop Indicators
- **Gap open duration**: 200ms
- **Easing**: ease-out-cubic

---

## 12. Context Menus

### Space Header Context Menu
- New Folder
- Add Link
- ---
- Paste (if clipboard has items)

### Folder Context Menu
- New Nested Folder
- Add Link
- ---
- Import Local Folder
- Import Local File
- ---
- Rename
- Copy Folder
- Copy All Links
- Paste (if clipboard)
- ---
- Refresh (local folders only)
- Open in Workspace (if applicable)
- Delete (destructive)

### Link Context Menu
- Rename
- Copy Link
- ---
- Pin to Top / Unpin
- ---
- Remove (destructive)

### Pinned Item Context Menu
- Open in Browser
- Copy Link
- ---
- Unpin
- ---
- Delete (destructive)

---

## 13. Component Files

```
packages/shared/src/components/
├── Sidebar/
│   ├── Sidebar.tsx
│   ├── Sidebar.module.css
│   ├── SidebarTabs.tsx
│   ├── SidebarTabs.module.css
│   ├── PinnedLinksGrid.tsx
│   ├── PinnedLinksGrid.module.css
│   ├── SpaceHeader.tsx
│   ├── SpaceHeader.module.css
│   ├── BottomBar.tsx
│   ├── BottomBar.module.css
│   └── index.ts
├── TreeView/ (existing)
└── ContextMenu/ (existing)
```

---

## Acceptance Criteria

### Visual
- [ ] Matches hi-fi design screenshots
- [ ] Correct colors from design tokens
- [ ] Proper spacing and typography
- [ ] Smooth animations

### Functionality
- [ ] Fixed/floating mode toggle works
- [ ] All three tabs navigate correctly
- [ ] Pinned grid accepts link drops
- [ ] Space header shows context icons on hover
- [ ] Folder items show action icons on hover
- [ ] Bottom bar navigates between spaces
- [ ] Add space button works

### Keyboard
- [ ] Arrow keys navigate tree items
- [ ] Tab/Shift+Tab navigate spaces
- [ ] Enter opens links
- [ ] Delete removes items
- [ ] Copy/paste works

### Integration
- [ ] Works with existing TreeView
- [ ] Works with existing ContextMenu
- [ ] State persists correctly
