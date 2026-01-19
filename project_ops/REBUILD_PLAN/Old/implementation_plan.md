# Spayce Electron Re-implementation Plan

> **Goal**: Complete re-implementation of Spayce using Electron + React Native Web + SurrealDB with 100% UI and feature fidelity to existing implementation.

---

## ⚠️ CRITICAL: Reference Old Implementation

> [!CAUTION]
> **MANDATORY FOR 100% COMPLETENESS**
> 
> The old Flutter implementation at `/Users/Shared/ALL WORKSPACE/projects/spayce` contains **1474+ tests** and intricate implementation details not fully captured in specification docs. During EACH phase, you MUST:
> 
> 1. **Read the tests** in `frontend/test/unit/` and `frontend/test/widget/`
> 2. **Study the source code** in `frontend/lib/features/`
> 3. **Cross-reference** the HiFi UI screens in `project_ops/HIFI_UI_DESIGN_SCREENS/`
> 
> **Key directories to reference per phase:**
> 
> | Phase | Test Directory | Source Directory |
> |-------|---------------|------------------|
> | Navigation | `test/widget/navigation/` | `lib/features/navigation/` |
> | Spaces | `test/unit/spaces/`, `test/widget/spaces/` | `lib/features/spaces/` |
> | Browser | `test/unit/browser/`, `test/widget/browser/` | `lib/features/browser/` |
> | Workspace | `test/unit/workspace/`, `test/widget/workspace/` | `lib/features/workspace/` |
> | Auth | `test/unit/auth/` | `lib/features/authentication/` |

---

## Executive Summary

This plan outlines the full rebuild of Spayce—a Personal Learning Management System with integrated browser—using a modern cross-platform stack that enables shared codebase across Desktop (Electron) and Mobile (React Native).

### Tech Stack Decision

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Desktop Framework** | Electron 30+ | `WebContentsView` API (Arc-style multi-tab), native OS integration |
| **UI Layer** | React Native Web | Shared components with future React Native mobile |
| **Mobile Framework** | React Native | Future iOS/Android apps share 80%+ codebase |
| **Browser Engine** | Chromium (via Electron) | Full browser capabilities, Chrome extension support |
| **Edge Database** | SurrealDB (embedded) | Multi-model DB, graph relations, real-time subscriptions |
| **Backend** | FastAPI | Complex AI/ML operations, external integrations |
| **Authentication** | Firebase Auth | Reuse existing `spayce-app` project for Google OAuth |
| **State Management** | Zustand + React Query | Lightweight, performant, works across platforms |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              SPAYCE ELECTRON                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                         ELECTRON MAIN PROCESS                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │  │
│  │  │   SurrealDB  │  │   Firebase   │  │     BrowserView Manager    │   │  │
│  │  │  (Embedded)  │  │   Auth SDK   │  │  (WebContentsView per tab) │   │  │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘   │  │
│  │                            │                                           │  │
│  │                   ┌────────┴────────┐                                 │  │
│  │                   │   IPC Bridge    │                                 │  │
│  │                   └────────┬────────┘                                 │  │
│  └────────────────────────────┼──────────────────────────────────────────┘  │
│                               │                                              │
│  ┌────────────────────────────┼──────────────────────────────────────────┐  │
│  │                  RENDERER PROCESS (React Native Web)                   │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         App UI Layer                              │ │  │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │ │  │
│  │  │  │  Navigation │ │   Spaces    │ │   Browser   │ │ Workspace  │  │ │  │
│  │  │  │   Shell     │ │   Module    │ │   Module    │ │  Module    │  │ │  │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │ │  │
│  │  └──────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
spayce_electron/
├── packages/
│   ├── shared/                      # Shared code (React Native Web)
│   │   ├── src/
│   │   │   ├── components/          # Shared UI components
│   │   │   │   ├── navigation/      # Sidebar, BottomBar, NavButton
│   │   │   │   ├── spaces/          # SpaceCard, TreeView, PinnedLinksGrid
│   │   │   │   ├── browser/         # TabBar, UrlBar, TabItem
│   │   │   │   ├── workspace/       # FileTree, EditorArea, ActivityBar
│   │   │   │   └── common/          # Button, Input, Modal, ContextMenu
│   │   │   ├── hooks/               # Shared React hooks
│   │   │   ├── stores/              # Zustand stores (spaces, browser, drag)
│   │   │   ├── theme/               # Design tokens
│   │   │   ├── types/               # TypeScript interfaces
│   │   │   └── utils/               # Utilities
│   │   └── package.json
│   │
│   └── desktop/                     # Electron app
│       ├── src/
│       │   ├── main/                # Electron main process
│       │   │   ├── index.ts         # Entry point
│       │   │   ├── window.ts        # BrowserWindow management
│       │   │   ├── tabs/            # WebContentsView tab manager
│       │   │   ├── database/        # SurrealDB embedded
│       │   │   ├── auth/            # Firebase Auth integration
│       │   │   └── ipc/             # IPC handlers
│       │   ├── renderer/            # React Native Web UI
│       │   └── preload/             # Preload scripts
│       └── package.json
│
├── project_ops/                     # Reference materials
│   ├── OLD_IMPLEMENTATION_SPECS/    # Specification documents
│   └── HIFI_UI_DESIGN_SCREENS/      # UI design screenshots
│
└── package.json                     # Root monorepo config
```

---

## Intricate Features Reference

> [!IMPORTANT]
> The following features were discovered by analyzing the old codebase tests. Each MUST be implemented with exact behavior matching.

### 1. Pinned Links Grid (`pinned_links_grid.dart`)
**Reference**: `frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart`

| Feature | Details |
|---------|---------|
| Grid Layout | 5 columns × 3 rows = **15 max pins** |
| Card Size | 48×48px with 8px spacing |
| Drop Indicator | Preview card at drop position |
| Context Menu | Open, Copy Link, Unpin, Delete |
| Drag Source | Both internal reorder and external (from sidebar) |
| Empty State | "Drop links here to pin" hint |
| Animation | 150ms AnimatedContainer transitions |

### 2. Space Creation (`space_creation_provider_extended_test.dart`)
**Reference**: `frontend/lib/features/spaces/providers/space_creation_provider.dart`

| Feature | Details |
|---------|---------|
| Theme Colors | **24 predefined colors** (violet, amber, emerald, pink, blue, etc.) |
| Icon Suggestions | Keyword-based: "work" → briefcase, "dev" → code, "personal" → user |
| Form Validation | Name required (whitespace-only rejected) |
| Sidebar Modes | normal, createSpace, editSpace |
| Random Color | Avoids recently used colors |
| Icon Count | Returns at most 5 suggested icons |

### 3. Keyboard Navigation
**Reference**: `frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart`

| Feature | Details |
|---------|---------|
| Focus Context | `KeyboardFocusContext` enum: sidebar, spacesScreen |
| Arrow Keys | Navigate between Space cards |
| Enter | Open selected Space |
| Escape | Return to sidebar context |
| Tab | Move between focusable elements |
| Provider | `keyboardFocusContextProvider`, `spacesScreenFocusNodeProvider` |

### 4. Drag & Drop System (`draggable_tree_item_test.dart`)
**Reference**: `frontend/lib/features/spaces/providers/drag_drop_provider.dart`

| Feature | Details |
|---------|---------|
| DragData | item, spaceId, parentId, sourceIndex, items[] |
| Multi-Select | `isMultiDrag` when items.length > 1 |
| DragSource | sidebar, spaceCard |
| DragOperation | items, sourceSpaceId, sourceParentId, source, startTime |
| Haptic Feedback | `HapticFeedback.mediumImpact()` on drag start/drop |

### 5. Animations (`SpayceAnimations`)
**Reference**: `frontend/lib/core/theme/spayce_animations.dart`

| Animation | Duration |
|-----------|----------|
| quick | 100ms |
| hover | 150ms |
| expand | 200ms |
| sidebarSlide | 250ms |
| pageTransition | 300ms |

| Animation Type | Usage |
|----------------|-------|
| Scale (0.9→1.0) | Link preview popup |
| Fade (0→1) | Modal overlays |
| SizeFactor | Folder expand/collapse |
| Color transition | Hover states |

### 6. Folder Tree Behavior
**Reference**: `frontend/lib/features/navigation/presentation/main_layout_final.dart`

| Feature | Details |
|---------|---------|
| Indent | 16px per level |
| Expand Animation | `AnimationController` + `CurvedAnimation` |
| Hover Actions | Add Link, Add Folder, More (context menu) |
| Selected State | Accent color background with border |
| Visit Count Badge | Shown for frequently visited links |

### 7. URL Bar Focus Behavior
**Reference**: `frontend/lib/features/browser/presentation/browser_screen.dart`

| Feature | Details |
|---------|---------|
| FocusNode | `_urlFocusNode` with listener |
| Auto-select | Select all text on focus |
| Unfocus | On navigation or Escape key |
| Monospace Font | JetBrains Mono |

### 8. Settings Screen
**Reference**: `frontend/lib/features/navigation/presentation/widgets/profile_settings_menu.dart`

| Feature | Details |
|---------|---------|
| Sections | Profile, Appearance (Light/Dark/System), General, About |
| Appearance Options | Light, Dark, System (with checkmark) |
| General Items | Profile Settings, Notifications, Keyboard Shortcuts |
| About Items | About Spayce, Help & Support |
| Keyboard Shortcuts | Opens dialog with shortcut list |

### 9. SpaceItem Local Types
**Reference**: `frontend/test/unit/spaces/space_item_local_types_test.dart`

| Type | localPath | securityBookmark |
|------|-----------|------------------|
| link | null | null |
| folder | null | null |
| localFolder | required | optional (macOS) |
| localFile | required | optional (macOS) |

### 10. Profile Menu Components
**Reference**: `frontend/test/widget/navigation/profile_settings_menu_test.dart`

| Component | Details |
|-----------|---------|
| Avatar | User photo or initials fallback |
| Name | User display name |
| Email | User email address |
| Plan Badge | Optional "Pro" badge |
| Settings Icon | Gear icon, opens settings screen |

---

## Proposed Changes by Phase

### Phase 1: Project Foundation (2-3 days)

#### [NEW] Monorepo Setup
- Initialize Yarn/npm workspaces
- Configure Vite for React Native Web
- Set up TypeScript paths for shared packages

#### [NEW] Design System (`packages/shared/src/theme/`)
```typescript
// colors.ts - Extract from 02_DESIGN_SYSTEM.md
export const colors = {
  primary: '#6D5AE6',
  backgroundDark: '#0F0B1A',
  surfaceDark: '#1A1628',
  sidebarDark: '#131020',
  accentDark: '#2D2645',
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  borderDark: '#3D3654',
  borderSubtle: '#2D2645',
};

// spaceThemes.ts - 24 predefined accent colors
export const spaceThemes = {
  violet: '#6D5AE6',
  amber: '#F59E0B',
  emerald: '#10B981',
  pink: '#EC4899',
  blue: '#3B82F6',
  // ... 19 more colors
};

// animations.ts
export const animations = {
  quick: 100,
  hover: 150,
  expand: 200,
  sidebarSlide: 250,
  pageTransition: 300,
};
```

#### [NEW] SurrealDB Setup (`packages/desktop/src/main/database/`)
```typescript
// surrealdb.ts
import { Surreal } from 'surrealdb.node';
import { app } from 'electron';
import path from 'path';

const dbPath = path.join(app.getPath('userData'), 'spayce.db');
const db = new Surreal();

export async function initDatabase() {
  await db.connect(`surrealkv://${dbPath}`);
  await db.use({ namespace: 'spayce', database: 'main' });
  await runMigrations(db);
  return db;
}
```

---

### Phase 2: Navigation Shell (3-4 days)

**Must implement from `main_layout_final.dart` (2700+ lines)**:

#### Sidebar Container (320px)
- Fixed width, border-radius 16px top-right/bottom-right
- Shadow: `0 0 40px rgba(0,0,0,0.5)`

#### Bottom Tab Bar (60px)
- Space icons: 32px circular with accent color
- Nav dots: 4px, scale 1.5× on hover with smooth animation
- Add button: 40px circular
- User profile: Avatar (32px) + name + email/plan

#### Keyboard Navigation
```typescript
// Focus context provider
type KeyboardFocusContext = 'sidebar' | 'spacesScreen';

// Arrow key navigation between spaces
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (focusContext === 'spacesScreen') {
      if (e.key === 'ArrowRight') selectNextSpace();
      if (e.key === 'ArrowLeft') selectPrevSpace();
      if (e.key === 'Enter') openSelectedSpace();
      if (e.key === 'Escape') setFocusContext('sidebar');
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [focusContext]);
```

---

### Phase 3: Spaces Feature (5-7 days)

#### SurrealDB Schema with Graph Relations
```sql
-- spaces.surql
DEFINE TABLE space SCHEMAFULL;
DEFINE FIELD name ON space TYPE string;
DEFINE FIELD profileId ON space TYPE string DEFAULT 'default';
DEFINE FIELD accentColor ON space TYPE string;
DEFINE FIELD iconName ON space TYPE string DEFAULT 'folder';
DEFINE FIELD order ON space TYPE int DEFAULT 0;
DEFINE FIELD isExpanded ON space TYPE bool DEFAULT true;
DEFINE FIELD createdAt ON space TYPE datetime DEFAULT time::now();

DEFINE TABLE space_item SCHEMAFULL;
DEFINE FIELD name ON space_item TYPE string;
DEFINE FIELD path ON space_item TYPE string;
DEFINE FIELD type ON space_item TYPE string; -- 'link' | 'folder' | 'localFolder' | 'localFile'
DEFINE FIELD isExpanded ON space_item TYPE bool DEFAULT false;
DEFINE FIELD isPinned ON space_item TYPE bool DEFAULT false;
DEFINE FIELD pinPosition ON space_item TYPE option<int>;
DEFINE FIELD visitCount ON space_item TYPE int DEFAULT 0;
DEFINE FIELD faviconUrl ON space_item TYPE option<string>;
DEFINE FIELD localPath ON space_item TYPE option<string>;
DEFINE FIELD securityBookmark ON space_item TYPE option<string>;
DEFINE FIELD lastVisited ON space_item TYPE option<datetime>;
DEFINE FIELD createdAt ON space_item TYPE datetime DEFAULT time::now();

-- Graph relations
DEFINE TABLE has_item TYPE RELATION FROM space TO space_item;
DEFINE TABLE contains TYPE RELATION FROM space_item TO space_item;

-- Indexes for performance
DEFINE INDEX idx_space_order ON space FIELDS order;
DEFINE INDEX idx_item_pinned ON space_item FIELDS isPinned, pinPosition;
DEFINE INDEX idx_item_type ON space_item FIELDS type;
```

#### Pinned Links Grid Component
```typescript
// PinnedLinksGrid.tsx
const CARD_SIZE = 48;
const SPACING = 8;
const COLUMNS = 5;
const MAX_PINS = 15;

interface PinnedLinksGridProps {
  spaceId: string;
  spaceColor: string;
}

export function PinnedLinksGrid({ spaceId, spaceColor }: PinnedLinksGridProps) {
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [isExternalDrag, setIsExternalDrag] = useState(false);
  
  // Handle both internal reorder and external drops
  const handleDrop = async (data: DragData, targetIndex: number) => {
    if (data.item.isPinned) {
      // Internal reorder
      await reorderPins(spaceId, data.item.id, targetIndex);
    } else {
      // External drop - pin the item
      await pinItem(spaceId, data.item.id);
      if (targetIndex < pinnedItems.length) {
        await reorderPins(spaceId, data.item.id, targetIndex);
      }
    }
  };
  
  // ... render 5×3 grid with drag preview
}
```

#### Space Creation Form
```typescript
// SpaceCreationForm.tsx
const ICON_KEYWORDS: Record<string, string[]> = {
  work: ['briefcase', 'building', 'laptop'],
  dev: ['code', 'terminal', 'git-branch'],
  personal: ['user', 'home', 'heart'],
  design: ['palette', 'pen-tool', 'layers'],
  learn: ['book', 'graduation-cap', 'lightbulb'],
  // ... more keywords
};

function getSuggestedIcons(name: string): string[] {
  const lower = name.toLowerCase();
  for (const [keyword, icons] of Object.entries(ICON_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return icons.slice(0, 5);
    }
  }
  return ['folder', 'star', 'bookmark', 'hash', 'flag'];
}

function getRandomColor(recentColors: string[]): string {
  const available = SPACE_THEMES.filter(c => !recentColors.includes(c));
  return available.length > 0 
    ? available[Math.floor(Math.random() * available.length)]
    : SPACE_THEMES[0];
}
```

#### Drag & Drop System
```typescript
// dragDropStore.ts (Zustand)
interface DragData {
  item: SpaceItem;
  items: SpaceItem[];  // For multi-select
  spaceId: string;
  parentId: string | null;
  sourceIndex: number;
}

interface DragOperation {
  items: SpaceItem[];
  sourceSpaceId: string;
  sourceParentId: string | null;
  source: 'sidebar' | 'spaceCard';
  startTime: Date;
}

interface DragDropState {
  currentDrag: DragOperation | null;
  dropTargetId: string | null;
  isMultiDrag: boolean;
  startDrag: (operation: DragOperation) => void;
  endDrag: () => void;
}
```

---

### Phase 4: Browser Feature (5-7 days)

#### WebContentsView Tab Manager
```typescript
// TabManager.ts (Electron main process)
import { WebContentsView, BrowserWindow } from 'electron';

class TabManager {
  private tabs: Map<string, WebContentsView> = new Map();
  private activeTabId: string | null = null;
  
  createTab(url: string, originSpaceId?: string): string {
    const tabId = crypto.randomUUID();
    const view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      }
    });
    
    view.webContents.loadURL(url);
    this.setupWebContentsListeners(view, tabId);
    this.tabs.set(tabId, view);
    
    return tabId;
  }
  
  private setupWebContentsListeners(view: WebContentsView, tabId: string) {
    view.webContents.on('did-start-loading', () => {
      this.emit('tab-loading', { tabId, isLoading: true });
    });
    
    view.webContents.on('did-stop-loading', () => {
      this.emit('tab-loading', { tabId, isLoading: false });
    });
    
    view.webContents.on('page-title-updated', (_, title) => {
      this.emit('tab-title', { tabId, title });
    });
    
    view.webContents.on('page-favicon-updated', (_, favicons) => {
      this.emit('tab-favicon', { tabId, favicon: favicons[0] });
    });
  }
}
```

#### URL Bar with Focus Behavior
```typescript
// UrlBar.tsx
function UrlBar({ value, onSubmit, focusNode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Auto-select all text on focus
    const handleFocus = () => {
      inputRef.current?.select();
    };
    inputRef.current?.addEventListener('focus', handleFocus);
    return () => inputRef.current?.removeEventListener('focus', handleFocus);
  }, []);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      onSubmit(validateUrl(value));
    }
  };
  
  return (
    <input
      ref={inputRef}
      value={value}
      onKeyDown={handleKeyDown}
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    />
  );
}
```

---

### Phase 5: Workspace Feature (4-5 days)

#### File Tree with Local File Types
```typescript
// FileTree.tsx
interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  contentType: FileContentType;
  children?: FileNode[];
  isExpanded: boolean;
  size?: number;
  modifiedAt?: Date;
}

type FileContentType = 
  | 'markdown' 
  | 'code' 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'pdf' 
  | 'url' 
  | 'unknown';

function detectContentType(filename: string): FileContentType {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.md') return 'markdown';
  if (['.ts', '.js', '.py', '.go', '.rs'].includes(ext)) return 'code';
  if (['.png', '.jpg', '.gif', '.svg'].includes(ext)) return 'image';
  // ... more types
}
```

#### Activity Bar with Icons
- Files explorer (folder icon)
- Search (search icon)  
- Git (git-branch icon)
- Extensions (puzzle icon)

---

### Phase 6: Authentication (2-3 days)

#### Firebase Integration for Electron
```typescript
// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { shell } from 'electron';

// Reuse existing spayce-app config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'spayce-app.firebaseapp.com',
  projectId: 'spayce-app',
  storageBucket: 'spayce-app.firebasestorage.app',
  messagingSenderId: '978525050204',
  appId: '1:978525050204:web:af2a2d005d5bfafb1c5d99',
};

// For Electron, use custom OAuth flow
async function signInWithGoogle() {
  const authUrl = getGoogleAuthUrl();
  shell.openExternal(authUrl);
  // Handle callback via deep link or localhost server
}
```

---

## Verification Plan

### Per-Phase Verification Checklist

#### Phase 2 - Navigation Shell
- [ ] Sidebar is exactly 320px wide
- [ ] Bottom bar is 60px tall
- [ ] Space icons are 32px with accent colors
- [ ] Nav dots scale 1.5× on hover (100ms animation)
- [ ] Keyboard: Arrow keys navigate spaces
- [ ] Keyboard: Enter opens selected space
- [ ] Keyboard: Escape returns focus to sidebar

#### Phase 3 - Spaces
- [ ] Pinned links grid: 5 columns × 3 rows max
- [ ] Pin card size: 48×48px with 8px spacing
- [ ] Drag preview shows at drop position
- [ ] Context menu: Open, Copy, Unpin, Delete
- [ ] Space creation: 24 theme colors available
- [ ] Icon suggestions match keywords
- [ ] Folder expand animation: 200ms eased
- [ ] Tree indent: 16px per level

#### Phase 4 - Browser
- [ ] Tab limit: 20 concurrent tabs
- [ ] Tab drag reorder works
- [ ] URL bar auto-selects on focus
- [ ] Cmd+Click opens new tab
- [ ] Tab persistence across restarts
- [ ] Favicon extracted from pages

#### Phase 5 - Workspace
- [ ] File tree shows folder hierarchy
- [ ] Markdown renders correctly
- [ ] Code has syntax highlighting
- [ ] Activity bar icons match VS Code
- [ ] Status bar shows line/column

#### Phase 6 - Auth
- [ ] Google OAuth popup works
- [ ] User profile shows in sidebar
- [ ] Data isolated per user in SurrealDB

### Test Coverage Requirements

| Module | Target Coverage |
|--------|----------------|
| Stores (Zustand) | 90% |
| Components | 70% |
| Utils | 85% |
| IPC Handlers | 80% |

---

## Implementation Timeline

| Phase | Duration | Priority | Complexity |
|-------|----------|----------|------------|
| 1. Foundation | 2-3 days | Critical | Medium |
| 2. Navigation | 3-4 days | Critical | High |
| 3. Spaces | 5-7 days | High | Very High |
| 4. Browser | 5-7 days | High | Very High |
| 5. Workspace | 4-5 days | Medium | High |
| 6. Auth | 2-3 days | Medium | Medium |
| **Total** | **21-29 days** | | |

---

## Key Reference Files

| Purpose | Path |
|---------|------|
| **Old Codebase** | `/Users/Shared/ALL WORKSPACE/projects/spayce` |
| **Flutter Tests (1474)** | `spayce/frontend/test/` |
| **Feature Source** | `spayce/frontend/lib/features/` |
| Product Overview | `OLD_IMPLEMENTATION_SPECS/01_PRODUCT_OVERVIEW.md` |
| Design System | `OLD_IMPLEMENTATION_SPECS/02_DESIGN_SYSTEM.md` |
| Data Models | `OLD_IMPLEMENTATION_SPECS/03_DATA_MODELS.md` |
| Browser Feature | `OLD_IMPLEMENTATION_SPECS/11_FEATURE_BROWSER.md` |
| Spaces Feature | `OLD_IMPLEMENTATION_SPECS/12_FEATURE_SPACES.md` |
| Navigation | `OLD_IMPLEMENTATION_SPECS/13_FEATURE_NAVIGATION.md` |
| Workspace | `OLD_IMPLEMENTATION_SPECS/14_FEATURE_WORKSPACE.md` |
| Firebase Keys | `/Users/Shared/ALL WORKSPACE/projects/spayce/.env` |
| UI Screens | `HIFI_UI_DESIGN_SCREENS/*.png` |

---

## AUGMENTED SECTION 11: Arc/Dia-Level Chromium Browser Integration

> [!IMPORTANT]
> This section details how to implement a **full-fledged browser experience** comparable to Arc Browser and Dia Browser using Electron's Chromium integration.

### 11.1 Architecture: Why WebContentsView (Not BrowserView)

Arc Browser uses Electron's `WebContentsView` (introduced in Electron 29+) which supersedes the deprecated `BrowserView`. Key differences:

| Feature | BrowserView (Old) | WebContentsView (Arc-style) |
|---------|------------------|----------------------------|
| **Lifecycle** | Attached to BrowserWindow | Independent, can be reparented |
| **Positioning** | Manual bounds management | Native CSS-like layout |
| **Stacking** | Z-index issues | Proper view hierarchy |
| **Performance** | Process per view | Optimized process sharing |
| **Future** | Deprecated | Active development |

### 11.2 Complete TabManager Implementation

```typescript
// packages/desktop/src/main/tabs/TabManager.ts
import { WebContentsView, BrowserWindow, session, app } from 'electron';
import { EventEmitter } from 'events';

interface TabState {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isAudible: boolean;
  isMuted: boolean;
  zoomLevel: number;
  originSpaceId: string | null;
  originSpaceItemId: string | null;
}

export class TabManager extends EventEmitter {
  private views: Map<string, WebContentsView> = new Map();
  private tabStates: Map<string, TabState> = new Map();
  private activeTabId: string | null = null;
  private mainWindow: BrowserWindow;
  private contentBounds: { x: number; y: number; width: number; height: number };

  constructor(mainWindow: BrowserWindow) {
    super();
    this.mainWindow = mainWindow;
    // Content area starts after sidebar (320px) and below tab bar (40px)
    this.contentBounds = { x: 320, y: 40, width: 0, height: 0 };
    this.updateContentBounds();
    
    mainWindow.on('resize', () => this.updateContentBounds());
  }

  private updateContentBounds() {
    const [width, height] = this.mainWindow.getContentSize();
    this.contentBounds = {
      x: 320,  // Sidebar width
      y: 88,   // Tab bar (40px) + URL bar (48px)
      width: width - 320,
      height: height - 88,
    };
    
    // Resize active view
    if (this.activeTabId) {
      const view = this.views.get(this.activeTabId);
      if (view) {
        view.setBounds(this.contentBounds);
      }
    }
  }

  createTab(url: string, options?: {
    originSpaceId?: string;
    originSpaceItemId?: string;
    background?: boolean;
  }): string {
    const tabId = crypto.randomUUID();
    
    // Create WebContentsView with Arc-style configuration
    const view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, '../preload/browser.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        // Arc-style: partition for session isolation (optional per-space)
        partition: options?.originSpaceId 
          ? `persist:space-${options.originSpaceId}`
          : 'persist:default',
      },
    });

    // Set bounds
    view.setBounds(this.contentBounds);
    
    // Initialize state
    this.tabStates.set(tabId, {
      id: tabId,
      url,
      title: 'New Tab',
      favicon: null,
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
      isAudible: false,
      isMuted: false,
      zoomLevel: 1,
      originSpaceId: options?.originSpaceId ?? null,
      originSpaceItemId: options?.originSpaceItemId ?? null,
    });

    // Setup all webContents listeners
    this.setupWebContentsListeners(view, tabId);
    
    // Load URL
    view.webContents.loadURL(url);
    
    // Store view
    this.views.set(tabId, view);
    
    // Activate if not background
    if (!options?.background) {
      this.activateTab(tabId);
    }

    this.emit('tab-created', { tabId, state: this.tabStates.get(tabId) });
    return tabId;
  }

  private setupWebContentsListeners(view: WebContentsView, tabId: string) {
    const wc = view.webContents;

    // Navigation events
    wc.on('did-start-loading', () => this.updateState(tabId, { isLoading: true }));
    wc.on('did-stop-loading', () => this.updateState(tabId, { isLoading: false }));
    wc.on('did-finish-load', () => {
      this.updateState(tabId, {
        canGoBack: wc.canGoBack(),
        canGoForward: wc.canGoForward(),
      });
    });

    // URL changes
    wc.on('did-navigate', (_, url) => this.updateState(tabId, { url }));
    wc.on('did-navigate-in-page', (_, url) => this.updateState(tabId, { url }));

    // Title & favicon
    wc.on('page-title-updated', (_, title) => this.updateState(tabId, { title }));
    wc.on('page-favicon-updated', (_, favicons) => {
      this.updateState(tabId, { favicon: favicons[0] || null });
    });

    // Audio
    wc.on('media-started-playing', () => this.updateState(tabId, { isAudible: true }));
    wc.on('media-paused', () => this.updateState(tabId, { isAudible: false }));

    // New window handling (Cmd+Click, target="_blank")
    wc.setWindowOpenHandler(({ url, disposition }) => {
      if (disposition === 'new-window' || disposition === 'foreground-tab') {
        this.createTab(url);
      } else if (disposition === 'background-tab') {
        this.createTab(url, { background: true });
      }
      return { action: 'deny' };
    });

    // Context menu
    wc.on('context-menu', (_, params) => {
      this.emit('context-menu', { tabId, params });
    });

    // Find in page
    wc.on('found-in-page', (_, result) => {
      this.emit('find-result', { tabId, result });
    });

    // Certificate errors (for dev)
    wc.on('certificate-error', (event, url, error, cert, callback) => {
      if (app.isPackaged) {
        callback(false);
      } else {
        callback(true); // Allow in dev
      }
    });
  }

  activateTab(tabId: string) {
    // Hide current active tab
    if (this.activeTabId && this.activeTabId !== tabId) {
      const oldView = this.views.get(this.activeTabId);
      if (oldView) {
        this.mainWindow.contentView.removeChildView(oldView);
      }
    }

    // Show new tab
    const view = this.views.get(tabId);
    if (view) {
      this.mainWindow.contentView.addChildView(view);
      view.setBounds(this.contentBounds);
      view.webContents.focus();
    }

    this.activeTabId = tabId;
    this.emit('tab-activated', { tabId });
  }

  closeTab(tabId: string) {
    const view = this.views.get(tabId);
    if (!view) return;

    // Remove from window
    this.mainWindow.contentView.removeChildView(view);
    
    // Cleanup
    view.webContents.close();
    this.views.delete(tabId);
    this.tabStates.delete(tabId);

    // Activate next tab if this was active
    if (this.activeTabId === tabId) {
      const remainingTabs = Array.from(this.views.keys());
      if (remainingTabs.length > 0) {
        this.activateTab(remainingTabs[remainingTabs.length - 1]);
      } else {
        this.activeTabId = null;
      }
    }

    this.emit('tab-closed', { tabId });
  }

  // Navigation methods
  goBack(tabId: string) {
    this.views.get(tabId)?.webContents.goBack();
  }

  goForward(tabId: string) {
    this.views.get(tabId)?.webContents.goForward();
  }

  reload(tabId: string, ignoreCache = false) {
    const wc = this.views.get(tabId)?.webContents;
    if (ignoreCache) {
      wc?.reloadIgnoringCache();
    } else {
      wc?.reload();
    }
  }

  stop(tabId: string) {
    this.views.get(tabId)?.webContents.stop();
  }

  navigate(tabId: string, url: string) {
    this.views.get(tabId)?.webContents.loadURL(url);
  }

  // Zoom
  setZoom(tabId: string, level: number) {
    const wc = this.views.get(tabId)?.webContents;
    if (wc) {
      wc.setZoomLevel(level);
      this.updateState(tabId, { zoomLevel: level });
    }
  }

  // Find in page
  findInPage(tabId: string, text: string, options?: Electron.FindInPageOptions) {
    this.views.get(tabId)?.webContents.findInPage(text, options);
  }

  stopFindInPage(tabId: string) {
    this.views.get(tabId)?.webContents.stopFindInPage('clearSelection');
  }

  // Mute
  setMuted(tabId: string, muted: boolean) {
    const wc = this.views.get(tabId)?.webContents;
    if (wc) {
      wc.setAudioMuted(muted);
      this.updateState(tabId, { isMuted: muted });
    }
  }

  // DevTools
  toggleDevTools(tabId: string) {
    this.views.get(tabId)?.webContents.toggleDevTools();
  }

  private updateState(tabId: string, partial: Partial<TabState>) {
    const current = this.tabStates.get(tabId);
    if (current) {
      const updated = { ...current, ...partial };
      this.tabStates.set(tabId, updated);
      this.emit('tab-updated', { tabId, state: updated });
    }
  }

  getState(tabId: string): TabState | undefined {
    return this.tabStates.get(tabId);
  }

  getAllStates(): TabState[] {
    return Array.from(this.tabStates.values());
  }
}
```

### 11.3 Arc-Style Features to Implement

| Feature | Implementation Approach |
|---------|------------------------|
| **Split View** | Multiple WebContentsView with flex layout |
| **Picture-in-Picture** | `view.webContents.requestPictureInPicture()` |
| **Tab Previews** | `view.webContents.capturePage()` for thumbnails |
| **Per-Space Sessions** | `partition: persist:space-${spaceId}` |
| **Link Preview on Hover** | Temporary WebContentsView with smaller bounds |
| **Reader Mode** | Custom preload script to extract article content |
| **Ad Blocking** | `session.defaultSession.webRequest.onBeforeRequest()` |
| **Password Manager** | `webContents.on('login', ...)` + secure storage |

### 11.4 Performance Optimizations (Dia-Style)

```typescript
// Tab suspension for inactive tabs (saves memory)
class TabSuspensionManager {
  private suspendTimeout = 5 * 60 * 1000; // 5 minutes
  private timers: Map<string, NodeJS.Timeout> = new Map();

  onTabDeactivated(tabId: string, view: WebContentsView) {
    const timer = setTimeout(() => {
      // Capture screenshot before suspending
      view.webContents.capturePage().then(image => {
        this.saveThumbnail(tabId, image);
      });
      
      // Suspend the tab (Chromium discards renderer)
      view.webContents.forcefullyCrashRenderer(); // Aggressive
      // OR use view.webContents.setBackgroundThrottling(true) for gentle
    }, this.suspendTimeout);
    
    this.timers.set(tabId, timer);
  }

  onTabActivated(tabId: string, view: WebContentsView, url: string) {
    // Cancel suspension timer
    const timer = this.timers.get(tabId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(tabId);
    }
    
    // Reload if was suspended
    if (view.webContents.isCrashed()) {
      view.webContents.loadURL(url);
    }
  }
}
```

### 11.5 Chrome Extension Support (Partial)

```typescript
// Electron doesn't fully support Chrome extensions, but you can:

// 1. Load unpacked extensions (limited API)
import { session } from 'electron';

async function loadExtension(extensionPath: string) {
  try {
    const ext = await session.defaultSession.loadExtension(extensionPath);
    console.log(`Loaded extension: ${ext.name}`);
  } catch (e) {
    console.error('Failed to load extension:', e);
  }
}

// 2. Supported APIs: storage, runtime, tabs (partial), webRequest
// 3. For ad-blocking: Use electron-ad-blocker or implement webRequest filtering

import { ElectronBlocker } from '@cliqz/adblocker-electron';

const blocker = await ElectronBlocker.fromPrebuiltFull(fetch);
blocker.enableBlockingInSession(session.defaultSession);
```

### 11.6 URL Bar with Smart Search

```typescript
// Smart URL bar like Arc/Chrome
interface UrlBarSuggestion {
  type: 'history' | 'bookmark' | 'space' | 'search' | 'url';
  title: string;
  url: string;
  icon?: string;
  spaceId?: string;
}

async function getSuggestions(query: string): Promise<UrlBarSuggestion[]> {
  const suggestions: UrlBarSuggestion[] = [];
  
  // 1. Check if it's a valid URL
  if (isValidUrl(query)) {
    suggestions.push({ type: 'url', title: query, url: query });
  }
  
  // 2. Search history (SurrealDB)
  const history = await db.query(`
    SELECT * FROM browser_history 
    WHERE title CONTAINS $query OR url CONTAINS $query
    ORDER BY visitCount DESC
    LIMIT 5
  `, { query });
  
  // 3. Search Spaces items
  const spaceItems = await db.query(`
    SELECT * FROM space_item 
    WHERE type = 'link' AND (name CONTAINS $query OR path CONTAINS $query)
    LIMIT 5
  `, { query });
  
  // 4. Add search engine fallback
  suggestions.push({
    type: 'search',
    title: `Search Google for "${query}"`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  });
  
  return suggestions;
}
```

### 11.7 Keyboard Shortcuts (Browser)

```typescript
const BROWSER_SHORTCUTS = {
  'Cmd+T': 'New tab',
  'Cmd+W': 'Close tab',
  'Cmd+Shift+T': 'Reopen closed tab',
  'Cmd+L': 'Focus URL bar',
  'Cmd+R': 'Reload',
  'Cmd+Shift+R': 'Hard reload',
  'Cmd+[': 'Go back',
  'Cmd+]': 'Go forward',
  'Cmd+1-9': 'Switch to tab N',
  'Cmd+Shift+]': 'Next tab',
  'Cmd+Shift+[': 'Previous tab',
  'Cmd+F': 'Find in page',
  'Cmd+Plus': 'Zoom in',
  'Cmd+Minus': 'Zoom out',
  'Cmd+0': 'Reset zoom',
  'Cmd+Shift+I': 'Open DevTools',
};
```

### 11.8 Process Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ELECTRON MAIN PROCESS                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ TabManager  │  │  SurrealDB  │  │   IPC Handlers      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ IPC
┌───────────────────────────┼─────────────────────────────────┐
│  RENDERER (React UI)      │                                  │
│  ┌─────────────────┐      │      ┌─────────────────────┐    │
│  │   Sidebar       │      │      │    Tab Bar          │    │
│  │   Navigation    │      │      │    URL Bar          │    │
│  └─────────────────┘      │      └─────────────────────┘    │
└───────────────────────────┼─────────────────────────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     │                      │                      │
┌────┴─────┐  ┌────────────┴───────────┐  ┌──────┴──────┐
│ Tab 1    │  │ Tab 2                  │  │ Tab N       │
│ (WCV)    │  │ (WebContentsView)      │  │ (WCV)       │
│ Renderer │  │ Renderer Process       │  │ Renderer    │
└──────────┘  └────────────────────────┘  └─────────────┘
```

Each WebContentsView runs in its own renderer process, providing:
- **Process Isolation**: Tab crash doesn't affect other tabs
- **Security**: Sandboxed with limited system access
- **Memory**: Can be individually suspended/resumed

---



> [!NOTE]
> The following sections AUGMENT the original plan with detailed implementation specifics discovered from deep codebase research. All original content above remains valid - these sections add missing implementation details about exact design system values, complete state management architecture, detailed data models, UI component specifications, keyboard navigation, and animation timings.

---

## AUGMENTED SECTION 1: Design System - Complete Implementation

### 1.1 Color System (from `spayce_colors.dart`)

```typescript
// EXACT values from Flutter implementation
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

// 24 Space Theme Colors (from space_creation_provider.dart)
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

### 1.2 Spacing System (from `spayce_spacing.dart`)

```typescript
export const SpayceSpacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  
  // CRITICAL Layout Constants
  sidebarWidth: 320,
  treeIndent: 16,
  cardWidth: 288,
  spaceIconSize: 32,
  navDotSize: 4,
  bottomTabBarHeight: 60,
  topBarHeight: 56,
};
```

### 1.3 Border Radius (from `spayce_radius.dart`)

```typescript
export const SpayceRadius = {
  xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 24, full: 999,
  button: 8, input: 8, card: 12, sidebar: 16, avatar: 999, tab: 8,
};
```

### 1.4 Animations (from `spayce_animations.dart`)

```typescript
export const SpayceAnimations = {
  quick: 100,        // Quick interactions
  hover: 150,        // Hover effects
  expand: 200,       // Expand/collapse
  sidebarSlide: 250, // Sidebar slide
  pageTransition: 300,
  fade: 200,
  
  // Curves
  standardCurve: 'easeInOut',
  decelerateCurve: 'decelerate',
  accelerateCurve: 'easeIn',
};
```

### 1.5 Shadows (from `spayce_shadows.dart`)

```typescript
export const SpayceShadows = {
  sidebarEmbossed: {
    color: 'rgba(0,0,0,0.5)',
    offset: { x: 10, y: 0 },
    blur: 30,
    spread: -5,
  },
  cardSubtle: { color: 'rgba(0,0,0,0.2)', offset: { x: 0, y: 2 }, blur: 8 },
  cardHover: { color: 'rgba(0,0,0,0.3)', offset: { x: 0, y: 4 }, blur: 16 },
  dropdown: { color: 'rgba(0,0,0,0.4)', offset: { x: 0, y: 4 }, blur: 12 },
};
```

---

## AUGMENTED SECTION 2: State Management Architecture

### 2.1 Main App State (from `main_layout_final.dart`)

```typescript
// Core enums
enum SidebarTab { browser, spaces, workspace, settings }
enum SidebarMode { floating, fixed }
enum KeyboardFocusContext { sidebar, spacesScreen }
enum SidebarViewMode { normal, createSpace, editSpace }
enum InlineInputType { folder, link }
enum ClipboardAction { copy, cut }

// State interfaces
interface AppState {
  sidebarTab: SidebarTab;
  sidebarMode: SidebarMode;
  sidebarVisible: boolean;
  activeSpaceIndex: number;
  spacesScreenActiveSpaceIndex: number;  // Decoupled from sidebar
  keyboardFocusContext: KeyboardFocusContext;
  expandedFolders: Set<string>;
  selectedLinkId: string | null;
  currentUrl: string | null;
}

interface InlineInputState {
  spaceId: string;
  parentId: string | null;
  type: InlineInputType;
}

interface MultiSelectionState {
  spaceId: string;
  selectedIds: Set<string>;
  lastSelectedId: string | null;
}

interface SpaceClipboardState {
  items: SpaceItem[];
  sourceSpaceId: string;
  action: ClipboardAction;
}
```

### 2.2 Drag & Drop State (from `drag_drop_provider.dart`)

```typescript
enum DragSource { sidebar, spaceCard }
enum DropPosition { before, after, inside }

interface DragOperation {
  items: SpaceItem[];
  sourceSpaceId: string;
  sourceParentId: string | null;
  source: DragSource;
  startTime: Date;
}

interface DropIndicatorState {
  targetId: string;
  position: DropPosition;
  spaceId: string;
  targetIndex: number;
  targetParentId: string | null;
  ancestorIds: string[];  // For nested folder support
}

interface DragData {
  item: SpaceItem;
  items: SpaceItem[];  // Multi-select
  spaceId: string;
  parentId: string | null;
  sourceIndex: number;
  isMultiDrag: boolean;  // items.length > 1
}

// Critical timings
const DRAG_TIMINGS = {
  autoExpandDelay: 500,    // Folder auto-expand on hover
  collapseDebounce: 150,   // Debounce collapse
  flashDuration: 700,      // Flash animation after move
  longPressDelay: 150,     // Mobile drag delay
};
```

---

## AUGMENTED SECTION 3: Complete Data Models

### 3.1 Space Models (from `space_models.dart`)

```typescript
enum SpaceItemType { link, file, folder, localFolder, localFile }

interface SpaceItem {
  id: string;
  name: string;
  path: string;
  type: SpaceItemType;
  isExpanded: boolean;
  children: SpaceItem[];
  
  // Link metadata
  faviconUrl: string | null;
  description: string | null;
  visitCount: number;
  lastVisited: Date | null;
  createdAt: Date;
  
  // Pin fields
  isPinned: boolean;
  pinPosition: number | null;
  
  // Local file system
  localPath: string | null;
  securityBookmark: string | null;  // macOS
  lastSyncedAt: Date | null;
  isWatching: boolean;
}

interface Space {
  id: string;
  profileId: string;
  userId: string;  // Firebase UID
  name: string;
  rootItems: SpaceItem[];
  createdAt: Date;
  isExpanded: boolean;
  accentColor: string;  // Hex color
  iconName: string;     // Lucide icon name
  order: number;        // Sequential ordering
}
```

### 3.2 Browser Tab Model (from `tab_model.dart`)

```typescript
enum TabType { web, note, localFile }

interface BrowserTab {
  id: string;
  tabType: TabType;
  url: string;
  title: string;
  faviconUrl: string | null;
  
  // Origin tracking (Spec 007)
  originSpaceId: string | null;
  originSpaceItemId: string | null;
  isTracked: boolean;
  
  // State
  isActive: boolean;
  isLoading: boolean;
  loadingProgress: number;
  canGoBack: boolean;
  canGoForward: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date | null;
}

const TAB_LIMITS = {
  maxWebTabs: 20,
  inactiveTimeout: 30 * 24 * 60 * 60 * 1000,  // 30 days
};
```

---

## AUGMENTED SECTION 4: UI Component Specifications

### 4.1 Pinned Links Grid

```typescript
const PINNED_GRID = {
  cardSize: 48,
  spacing: 8,
  columns: 5,
  maxPins: 15,  // 5×3
};

// States: normal, hovered, active, dragging, dropPreview
// Context menu: Open, Copy Link, Unpin, Delete
// Empty state: "Drop links here to pin"
```

### 4.2 Draggable Tree Item

```typescript
const DROP_ZONES = {
  edgeZoneRatio: 0.20,  // 20% top/bottom
  // Folder: 20% before, 60% inside, 20% after
  // Link: 50/50 before/after
};

// Desktop: Immediate drag (Draggable)
// Mobile: Long press drag (150ms delay)
// Multi-select support with DragData.items
```

### 4.3 Link Preview Popup

```typescript
const PREVIEW_CONFIG = {
  width: '85%',   // of screen
  height: '90%',  // of screen
  animation: {
    duration: 200,
    scale: { from: 0.9, to: 1.0 },
    fade: { from: 0, to: 1 },
    curve: 'easeOutCubic',
  },
  backdropOpacity: 0.6,
};
```

### 4.4 Workspace Theme (Separate from Main)

```typescript
const WorkspaceTheme = {
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

---

## AUGMENTED SECTION 5: Keyboard Navigation

### 5.1 Sidebar Shortcuts

```typescript
const SIDEBAR_SHORTCUTS = {
  ArrowUp: 'Select previous item',
  ArrowDown: 'Select next item',
  ArrowRight: 'Expand folder or move to first child',
  ArrowLeft: 'Collapse folder or move to parent',
  Enter: 'Open link OR toggle folder',
  Delete: 'Delete selected items',
  Backspace: 'Delete selected items',
  'Ctrl+C': 'Copy selected items',
  'Ctrl+V': 'Paste items',
  Escape: 'Clear selection',
  Tab: 'Next space',
  'Shift+Tab': 'Previous space',
  ']': 'Next space',
  '[': 'Previous space',
};
```

### 5.2 Spaces Screen Shortcuts (F025)

```typescript
const SPACES_SCREEN_SHORTCUTS = {
  ArrowRight: 'Select next Space card',
  ArrowLeft: 'Select previous Space card',
  Enter: 'Open selected Space',
  Escape: 'Return to sidebar context',
};
```

---

## AUGMENTED SECTION 6: Icon Mapping

### 6.1 Space Icon Suggestions

```typescript
const ICON_KEYWORDS = {
  work: ['briefcase', 'building', 'laptop', 'clipboard'],
  personal: ['user', 'heart', 'home', 'smile'],
  dev: ['code', 'terminal', 'database', 'cpu', 'git-branch'],
  design: ['palette', 'image', 'camera', 'lightbulb'],
  learn: ['book', 'graduation-cap', 'brain', 'lightbulb'],
  shop: ['shopping-cart', 'credit-card', 'dollar-sign'],
  finance: ['dollar-sign', 'credit-card', 'briefcase'],
  social: ['users', 'message-circle', 'heart', 'smile'],
  project: ['layers', 'folder', 'target', 'rocket'],
  music: ['music', 'video', 'camera'],
  travel: ['plane', 'map', 'compass', 'camera'],
  health: ['activity', 'dumbbell', 'heart'],
};

const DEFAULT_ICONS = ['layers', 'folder', 'star', 'bookmark', 'rocket'];
```

### 6.2 Complete Icon Map (45 icons)

```typescript
const ICON_MAP = {
  // Work & Productivity
  briefcase, building, laptop, calendar, clipboard,
  // Personal & Life
  home, heart, user, users, smile,
  // Development & Tech
  code, terminal, database, cpu, 'git-branch',
  // Creative & Media
  palette, image, music, video, camera,
  // Organization
  folder, layers, archive, bookmark, star,
  // Learning
  book, 'graduation-cap', lightbulb, brain,
  // Shopping & Finance
  'shopping-cart', 'dollar-sign', 'credit-card',
  // Communication
  mail, 'message-circle', phone,
  // Travel
  plane, map, compass,
  // Health
  activity, dumbbell,
  // Misc
  rocket, trophy, target, zap, flame,
};
```

---

## AUGMENTED SECTION 7: Authentication Details

### 7.1 Firebase Configuration

```typescript
const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'spayce-app.firebaseapp.com',
  projectId: 'spayce-app',
  storageBucket: 'spayce-app.firebasestorage.app',
  messagingSenderId: '978525050204',
  appId: '1:978525050204:web:af2a2d005d5bfafb1c5d99',
};

const GOOGLE_CLIENT_IDS = {
  web: '978525050204-c2ru6kh7pcskqhubl8n685b9fbrt8ple.apps.googleusercontent.com',
  macOS: '978525050204-s47bgell0u25tsbpri73h5jc0p1k9q2q.apps.googleusercontent.com',
};
```

### 7.2 Auth Flow

```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Features:
// - Google OAuth with platform-specific handling
// - Silent sign-in for session restoration
// - Secure credential storage
// - Token refresh (5 min buffer before expiry)
// - 60 second sign-in popup timeout
// - MockUser fallback for macOS keychain issues
```

---

## AUGMENTED SECTION 8: Critical Implementation Notes

### 8.1 Pinned Links Behavior
- Grid shows in sidebar above tree view
- Max 15 pins (5×3)
- Cards are 48×48px with 8px spacing
- Drop preview shows exact position
- Internal reorder + external drop from sidebar
- Context menu on right-click

### 8.2 Drag & Drop State Machine
```
1. Drag hovers over folder for 500ms → expand (dragExpandedFolderId)
2. Drag leaves folder → collapse after 150ms debounce
3. Drop inside folder → persist expansion
4. Drop elsewhere → collapse dragExpandedFolder
5. Flash moved item for 700ms
```

### 8.3 Tab Duplicate Prevention
```typescript
// Primary: Check by Space item ID (most reliable)
existingTab = findTabBySpaceItem(spaceItemId);

// Secondary: Check by URL (catches other sources)  
existingTab = findTabByUrl(url);

// URL normalization: lowercase, no trailing slash, no fragment, no www
```

### 8.4 Floating Sidebar Behavior
- Shows on hover (cursor < 10px from left edge)
- Also opens when dragging near left edge (12px zone)
- Stays open when context menu is open
- Stays open when pins grid is being targeted
- Border-radius 12px on right side
- Primary color border (30% opacity)

---

## AUGMENTED SECTION 9: File Structure Reference

```
frontend/lib/
├── core/
│   ├── services/           # Firebase, storage, native storage
│   ├── theme/              # Design system files
│   │   ├── spayce_animations.dart
│   │   ├── spayce_colors.dart
│   │   ├── spayce_icons.dart
│   │   ├── spayce_radius.dart
│   │   ├── spayce_shadows.dart
│   │   ├── spayce_spacing.dart
│   │   ├── spayce_theme.dart
│   │   └── spayce_typography.dart
│   └── utils/
├── features/
│   ├── authentication/
│   │   ├── data/auth_notifier.dart     # Auth state management
│   │   ├── domain/auth_state.dart
│   │   └── presentation/login_screen.dart
│   ├── browser/
│   │   ├── data/tab_manager.dart       # Tab state management
│   │   ├── domain/tab_model.dart       # Tab data model
│   │   └── presentation/
│   │       ├── tabbed_browser_screen.dart
│   │       └── widgets/
│   │           └── link_preview_popup.dart
│   ├── navigation/
│   │   └── presentation/
│   │       ├── main_layout_final.dart  # 3758 lines - MAIN LAYOUT
│   │       ├── screens/settings_screen_v2.dart
│   │       └── widgets/
│   ├── spaces/
│   │   ├── models/space_models.dart    # Space & SpaceItem models
│   │   ├── providers/
│   │   │   ├── drag_drop_provider.dart
│   │   │   ├── space_creation_provider.dart
│   │   │   └── spaces_provider.dart
│   │   └── presentation/widgets/
│   │       ├── pinned_links_grid.dart
│   │       ├── drag_drop/draggable_tree_item.dart
│   │       └── space_form_view.dart
│   └── workspace/
│       ├── data/workspace_manager.dart
│       └── presentation/
│           ├── workspace_screen.dart
│           ├── workspace_theme.dart    # Separate theme
│           └── widgets/
└── main.dart
```

---

## AUGMENTED SECTION 10: Test Coverage Reference

```
frontend/test/
├── unit/
│   ├── spaces/          # Space model & provider tests
│   ├── browser/         # Tab manager tests
│   └── auth/            # Auth tests
└── widget/
    ├── navigation/      # 5 test files
    ├── spaces/          # 8 test files
    ├── browser/         # 4 test files
    └── workspace/       # 6 test files
```

**Total: 1474+ tests** - Each must be referenced during implementation.

---

*Plan Version: 2.1 (Augmented)*  
*Original Plan: implementation_plan.md*  
*Created: January 17, 2026*  
*Augmented with deep codebase research findings*
