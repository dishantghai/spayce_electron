# Spayce - Feature: Spaces (Content Organization)

> **Document Purpose**: Complete specification of the Spaces feature for pixel-perfect recreation.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [User Stories](#user-stories)
3. [Functional Requirements](#functional-requirements)
4. [UI Components](#ui-components)
5. [User Interactions](#user-interactions)
6. [State Management](#state-management)
7. [Visual Specifications](#visual-specifications)
8. [Screenshots](#screenshots)

---

## Feature Overview

### What is Spaces?

Spaces is the **primary content organization system** that replaces traditional browser bookmarks with a more powerful hierarchical structure. Each Space is a container that can hold:

- **Links** (URLs with auto-extracted metadata)
- **Folders** (nested containers with unlimited depth)
- **Files** (references to file paths)
- **Local Folders** (file system folders with watch capability)

### Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Hierarchy** | Unlimited nesting depth (folders within folders) |
| **Profile Isolation** | Each browser profile has separate Spaces |
| **Metadata Extraction** | Auto-fetch title, description, favicon from URLs |
| **Visit Tracking** | Track access count and last visited timestamp |
| **Persistence** | localStorage (web), JSON files (native) |
| **Accent Colors** | Each Space has a unique color from the palette |
| **Custom Icons** | 40+ Lucide icons available for Spaces |

---

## User Stories

### Primary Stories

1. **As a user**, I want to create organized Spaces for different topics so that I can group related content together.

2. **As a user**, I want to add links from my browser directly to a Space so that I can save content without leaving the page.

3. **As a user**, I want to create nested folders within Spaces so that I can build detailed organizational structures.

4. **As a user**, I want to quickly find content by searching across all my Spaces.

5. **As a user**, I want to see which links I visit frequently so that I can access them quickly.

### Acceptance Criteria

- Create Space: < 3 seconds to complete
- Add Link: Auto-extract metadata within 3 seconds
- Search: Results appear within 500ms
- Tree Navigation: Expand/collapse < 200ms

---

## Functional Requirements

### Space Management

| Action | Trigger | Result |
|--------|---------|--------|
| Create Space | Click "+" in bottom bar | Opens create dialog with name, icon, color picker |
| Rename Space | Double-click name, or context menu → Rename | Inline text field for editing |
| Delete Space | Context menu → Delete | Confirmation dialog, removes Space and all items |
| Reorder Spaces | Drag space icon in bottom bar | Updates `order` field, persists position |
| Change Icon | Context menu → Change Icon | Opens icon picker modal |
| Change Color | Context menu → Change Color | Opens color picker modal |

### Item Management

| Action | Trigger | Result |
|--------|---------|--------|
| Add Link | Double-click empty area, or "+" button | Creates inline input field |
| Add Folder | "+" button → New Folder | Creates folder with editable name |
| Paste URL | Paste in input field | Auto-detects URL, fetches metadata |
| Delete Item | Context menu → Delete | Removes item (and children if folder) |
| Rename Item | Double-click name | Inline editing mode |
| Open Link | Single-click on link | Opens in browser (increments visitCount) |

### Navigation

| Action | Trigger | Result |
|--------|---------|--------|
| Expand Folder | Click chevron, or click folder | Shows children items |
| Collapse Folder | Click chevron | Hides children items |
| Select Space | Click space icon in bottom bar | Loads Space content in sidebar tree |
| Search | Type in search field | Filters items across all Spaces |

---

## UI Components

### Space Card (Grid View)

The Spaces screen displays Spaces as cards in a responsive grid.

```
┌─────────────────────────────────────────────────── 288px ─────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  [📁 MACHINE LEARNING]              [Edit Name]  [•••]   │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ├─ 📁 AI Deep Dive (expanded)                                │
│ │   ├─ 🔗 Gemini 3.0 Tutorial                     [8 visits] │
│ │   ├─ 🔗 Claude API Docs                         [3 visits] │
│ │   └─ 📁 Papers (collapsed) [12]                            │
│ │                                                             │
│ ├─ 🔗 Hugging Face Model Hub                      [15 visits]│
│ │                                                             │
│ └─ 🔗 MIT Deep Learning Course                    [2 visits] │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  [+] Add Link  [+] Add Folder  [+] Import Folder        │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Component Properties

#### Space Card Container

| Property | Value |
|----------|-------|
| Width | 288px (fixed, `SpayceSpacing.cardWidth`) |
| Background | `surfaceDark` (#1A1628) |
| Border Radius | 12px (`SpayceRadius.card`) |
| Padding | 12px all sides |
| Shadow | `cardSubtle` on default, `cardHover` on hover |

#### Space Card Header

| Property | Value |
|----------|-------|
| Background | `accentDark` (#2D2645) |
| Padding | 8px vertical, 12px horizontal |
| Text Style | `sectionHeader` (12px, bold, uppercase, 0.5 letter-spacing) |
| Text Color | Space accent color |
| Icon Size | 16px |

### Sidebar Tree View

When a Space is selected, its items display in the sidebar tree:

```
┌────────────────────── 320px ──────────────────────┐
│                                                    │
│  MACHINE LEARNING  ▼                        [🔧]  │
│                                                    │
│  ├─ 📁 AI Deep Dive Series                        │
│  │   ├─ 🔗 Gemini 3.0 Tutorial                    │
│  │   ├─ 🔗 Claude API Docs                        │
│  │   └─ 📁 Papers ▶ [12]                          │
│  │                                                 │
│  ├─ 🔗 Hugging Face Hub                           │
│  │                                                 │
│  └─ 🔗 MIT DL Course                              │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │ 🔗 Enter URL or name...                    │   │
│  └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

#### Tree Item Component

| Property | Value |
|----------|-------|
| Left Indent | `depth * 16px` |
| Padding | 8px horizontal, 6px vertical |
| Background (default) | transparent |
| Background (hover) | `rgba(255,255,255,0.05)` |
| Background (selected) | `rgba(255,255,255,0.1)` |
| Border Radius | 8px |
| Icon Size | 18px |
| Text Style | `treeItem` (14px, medium) |
| Chevron Size | 16px |

#### Nested Items Border

```css
/* Left border for nested levels */
border-left: 1px solid rgba(55, 65, 81, 0.5);
padding-left: 8px;
```

---

## User Interactions

### Double-Click to Add

**Trigger**: Double-click on empty area in Space card or sidebar

**Behavior**:
1. Inline input field appears at double-click position
2. Field is focused for immediate typing
3. Clipboard is checked for URL
4. If URL found, auto-paste and begin metadata extraction
5. Press Enter to save, Escape to cancel

```
┌────────────────────────────────────┐
│  [🔗] https://example.com       ✓  │
│       Extracting metadata...       │
└────────────────────────────────────┘
```

### Context Menu (Right-Click)

**Trigger**: Right-click on item (desktop) or long-press (mobile)

#### Link Context Menu

```
┌─────────────────────────┐
│ 🌐 Open in Browser      │
│ 📋 Copy Link            │
│ ✏️  Rename               │
│ 📁 Move to...           │
│ 📌 Pin to Top           │
│ ─────────────────────   │
│ 🗑️  Delete               │
└─────────────────────────┘
```

#### Folder Context Menu

```
┌─────────────────────────┐
│ ➕ Add Link             │
│ 📁 Add Subfolder        │
│ ✏️  Rename               │
│ 📁 Move to...           │
│ ─────────────────────   │
│ 🗑️  Delete               │
└─────────────────────────┘
```

### Hover Effects

| Element | Default State | Hover State | Duration |
|---------|---------------|-------------|----------|
| Tree Item | transparent | `rgba(255,255,255,0.05)` | 150ms |
| Folder Actions | hidden (opacity 0) | visible (opacity 1) | 150ms |
| Space Card | `cardSubtle` shadow | `cardHover` shadow | 150ms |
| Space Icon | 20% opacity color | 30% opacity color | 150ms |

### Folder Actions (Hover Toolbar)

When hovering a folder, action buttons appear:

```
📁 AI Deep Dive Series     [+🔗] [+📁] [•••]
                            ↑     ↑     ↑
                          Add   Add   More
                          Link  Folder
```

| Button | Icon | Action |
|--------|------|--------|
| Add Link | `Plus` + `Link2` | Creates link as child of folder |
| Add Folder | `Plus` + `Folder` | Creates subfolder |
| More | `MoreVertical` | Opens context menu |

---

## State Management

### Riverpod Providers

```dart
// Main spaces list provider
@riverpod
class SpacesList extends _$SpacesList {
  @override
  Future<List<Space>> build() async {
    return _loadSpaces();
  }
}

// Active space index
@riverpod
class ActiveSpace extends _$ActiveSpace {
  @override
  int build() => 0;
}

// Expanded folders state
@riverpod
class ExpandedFolders extends _$ExpandedFolders {
  @override
  Set<String> build() => {};
}

// Search query
@riverpod
class SpaceSearchQuery extends _$SpaceSearchQuery {
  @override
  String build() => '';
}
```

### State Flow

```
User Action → Provider Method → Repository → Storage → Notify UI
     ↓
  Riverpod        ↓                ↓          ↓
  Provider    SpacesRepository   Drift/    UI Rebuilds
                                JSON File
```

---

## Visual Specifications

### Space Accent Colors

| Space | Color | Hex | Usage |
|-------|-------|-----|-------|
| Space 1 | Violet | `#8B5CF6` | Tech, AI, Learning |
| Space 2 | Amber | `#F59E0B` | Work, Professional |
| Space 3 | Emerald | `#10B981` | Research, Science |
| Space 4 | Pink | `#EC4899` | Personal, Creative |
| Space 5 | Blue | `#3B82F6` | (extended) |
| Space 6 | Red | `#EF4444` | (extended) |
| Space 7 | Teal | `#14B8A6` | (extended) |
| Space 8 | Orange | `#F97316` | (extended) |

### Item Type Icons

| Type | Icon | Color | Size |
|------|------|-------|------|
| Link | `FileText` or favicon | `linkBlue` or domain-based | 18px |
| Folder (closed) | `Folder` | Space accent | 18px |
| Folder (open) | `FolderOpen` | Space accent | 18px |
| Local Folder | `FolderSync` | Space accent | 18px |
| Local File | `File` | `textSecondary` | 18px |
| Video Link | `Play` | `linkRed` | 18px |

### Visit Count Badge

When `visitCount > 0`, show badge:

```
┌─────────────────────────────────────┐
│  🔗 Flutter Documentation  [15]     │
│                             ↑       │
│                       Visit count   │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Background | `rgba(255,255,255,0.1)` |
| Text Color | `textMuted` |
| Font Size | 11px |
| Padding | 2px 6px |
| Border Radius | 4px |

---

## Screenshots

The following screenshots illustrate the Spaces feature:

### Spaces Screen (Grid View)
![Spaces Screen](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Spaces%20Screen%20from%20Spaces%20Tab.png)

### Sidebar with Space Tree
![Sidebar with Spaces](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/App%20Side%20Bar%20with%20Spaces%20Screen%20Open.png)

### Create New Space
![Create Space](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Create%20New%20Space%20from%20Bottom%20Bar%20in%20App%20Sidebar.png)

### Choose Space Icon
![Space Icons](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Create%20New%20Space%20Choose%20Space%20Icon.png)

### Create New Folder in Space Card
![New Folder](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Spaces%20Card%20Create%20New%20Folder.png)

### Create New Link in Space Card
![New Link](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Spaces%20Card%20Create%20New%20Link.png)

### Folder Context Menu
![Folder Context Menu](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Spaces%20Card%20Folder%20Context%20Menu.png)

### Folder Icons (Open vs Closed)
![Folder Icons](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Spaces%20Card%20Folder%20Icons%20Open%20and%20Closed.png)

### Add Link to Folder (Sidebar)
![Add Link Sidebar](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Space%20Sidebar%20Add%20Link%20to%20Folder.png)

### Create Subfolder (Sidebar)
![Create Subfolder](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Space%20Sidebar%20Create%20SubFolder.png)

### Local Imported Folders (Sidebar)
![Local Folders Sidebar](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Sidebar%20with%20Local%20Imported%20Folders.png)

### Local Imported Folders (Card)
![Local Folders Card](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Spaced%20Card%20Local%20Imported%20Folders.png)

---

## Metadata Extraction

### JavaScript Extraction Template

When adding a URL, the following script extracts metadata:

```javascript
(function() {
  try {
    return {
      title: document.title || 
             document.querySelector('meta[property="og:title"]')?.content || 
             document.querySelector('meta[name="twitter:title"]')?.content || 
             window.location.hostname,
      description: document.querySelector('meta[name="description"]')?.content || 
                   document.querySelector('meta[property="og:description"]')?.content || 
                   document.querySelector('meta[name="twitter:description"]')?.content || 
                   '',
      favicon: (function() {
        const iconLink = document.querySelector('link[rel*="icon"]');
        if (iconLink) return iconLink.href;
        const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (appleTouchIcon) return appleTouchIcon.href;
        return window.location.origin + '/favicon.ico';
      })(),
      url: window.location.href,
      domain: window.location.hostname
    };
  } catch (error) {
    return {
      title: window.location.hostname,
      description: '',
      favicon: window.location.origin + '/favicon.ico',
      url: window.location.href,
      domain: window.location.hostname
    };
  }
})();
```

### Fallback Behavior

| Scenario | Fallback |
|----------|----------|
| Network error | Use URL as title |
| No title tag | Use hostname |
| No favicon | Use default icon |
| JavaScript error | Basic URL parsing |

---

## Persistence

### Web (localStorage)

```javascript
// Key
const key = 'spayce_spaces';

// Backup key (sessionStorage)
const backupKey = 'spayce_spaces_session';

// Save
localStorage.setItem(key, JSON.stringify(spaces));
sessionStorage.setItem(backupKey, JSON.stringify(spaces));

// Load (with recovery)
let data = localStorage.getItem(key);
if (!data) {
  data = sessionStorage.getItem(backupKey);
}
```

### Native (File-based)

```dart
// Get application documents directory
final directory = await getApplicationDocumentsDirectory();
final file = File('${directory.path}/spayce_spaces.json');

// Save
await file.writeAsString(jsonEncode(spaces));

// Load
final contents = await file.readAsString();
final spaces = jsonDecode(contents);
```

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Load time (100 items) | ≤ 2 seconds |
| Tree scroll | 60 FPS |
| Search response | ≤ 500ms |
| Add item | ≤ 200ms UI feedback |
| Metadata extraction | ≤ 3 seconds |
| Save operation | ≤ 1 second |
| Memory (100 items) | ≤ 200MB |

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
