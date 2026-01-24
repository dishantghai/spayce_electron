# Current State Analysis

## Electron Project Structure

```
spayce_electron/
├── packages/
│   ├── core/               # Domain & Application layers ✅ IMPLEMENTED
│   │   ├── domain/         # Entities, repositories, validators
│   │   └── application/    # Use cases, queries, facades
│   │
│   ├── infrastructure/     # Database, services ✅ IMPLEMENTED
│   │   ├── persistence/    # SQLite repositories
│   │   ├── di/             # Service registry
│   │   └── services/       # Event bus, logger, metadata, file system
│   │
│   ├── react-ui/           # Presentation layer ⚠️ PARTIAL
│   │   ├── components/     # UI components (basic tree, sidebar, context menu)
│   │   ├── hooks/          # Data hooks
│   │   ├── stores/         # Zustand UI stores
│   │   └── theme/          # Design tokens
│   │
│   └── desktop/            # Electron app shell ✅ IMPLEMENTED
│       ├── main/           # Main process, IPC handlers
│       ├── renderer/       # React app entry
│       └── preload/        # Context bridge
```

---

## Completed Specs (001-011)

| Spec ID | Name | Status | Key Files |
|---------|------|--------|-----------|
| 001 | Project Foundation | ✅ Complete | Monorepo, build system |
| 002 | Sidebar Navigation | ✅ Complete | Sidebar.tsx, TreeView.tsx, TreeItem.tsx |
| 003 | Spaces Module | ✅ Complete | SpacesScreen.tsx, SpaceCard.tsx |
| 004 | Context Menu | ✅ Complete | ContextMenu.tsx |
| 005 | Create Space Flow | ✅ Complete | CreateSpaceView.tsx |
| 006 | Keyboard Navigation | ✅ Complete | Arrow keys in Sidebar.tsx |
| 007 | Core Domain Layer | ✅ Complete | domain/entities/, domain/repositories/ |
| 008 | Infrastructure Layer | ✅ Complete | persistence/sqlite/, services/ |
| 009 | Application Layer | ✅ Complete | use-cases/, facades/, queries/ |
| 010 | React UI Integration | ✅ Complete | hooks/, InvalidationContext |
| 011 | Migration Feature Parity | ✅ Complete | IPC handlers, tests |

---

## Gap Analysis - Missing Features

### P0 - Critical (Required for Basic Functionality)

| Feature | Flutter Status | Electron Status | Gap |
|---------|---------------|-----------------|-----|
| Inline Folder Creation | ✅ Implemented | ❌ Missing | Need InlineInput component |
| Inline Link Creation | ✅ Implemented | ❌ Missing | Need InlineInput component |
| Inline Rename | ✅ Implemented | ❌ Missing | Need InlineRenameInput component |
| Folder Hover Actions | ✅ Implemented | ⚠️ Stub | TreeItem has TODO stubs |
| Enhanced Context Menu (Folder) | ✅ Implemented | ⚠️ Partial | Missing most actions |
| Enhanced Context Menu (Link) | ✅ Implemented | ⚠️ Partial | Missing pin/copy |
| Copy/Paste (Internal) | ✅ Implemented | ❌ Missing | Need ClipboardStore |
| Drag-Drop (Reorder) | ✅ Implemented | ❌ Missing | No drag implementation |
| Drop Indicators | ✅ Implemented | ❌ Missing | No drop indicator |
| Hit Zone Logic | ✅ Implemented | ❌ Missing | No hit zone calculation |

### P1 - High Priority

| Feature | Flutter Status | Electron Status | Gap |
|---------|---------------|-----------------|-----|
| Multi-Selection | ✅ Implemented | ❌ Missing | Need SelectionStore |
| Copy/Paste (System Clipboard) | ✅ Implemented | ❌ Missing | Need IPC for clipboard |
| Drag-Drop (Cross-Space) | ✅ Implemented | ❌ Missing | Need bottom bar drop targets |
| Drag-Drop (To Pins Grid) | ✅ Implemented | ❌ Missing | Need PinnedLinksGrid drop |
| Auto-Expand on Drag | ✅ Implemented | ❌ Missing | Need timer logic |

### P2 - Medium Priority

| Feature | Flutter Status | Electron Status | Gap |
|---------|---------------|-----------------|-----|
| Flash Animation on Drop | ✅ Implemented | ❌ Missing | Need flashItemId state |
| Smart Drag Preview | ✅ Implemented | ❌ Missing | Square preview for pins |
| Space Card Drag-Drop | ✅ Implemented | ❌ Missing | SpaceCard not interactive |

---

## Existing Electron Files (Reference)

### packages/react-ui/src/components/

| File | Size | Features |
|------|------|----------|
| Sidebar.tsx | 19KB | Basic sidebar, keyboard nav, space switching |
| TreeView.tsx | 3.7KB | Basic tree rendering |
| TreeItem.tsx | 7KB | Item display, hover (TODO stubs) |
| ContextMenu.tsx | 5.3KB | Basic context menu |
| PinnedLinksGrid.tsx | 2.5KB | Basic pins grid (no drag) |
| SpaceHeader.tsx | 5KB | Space title, actions |
| BottomBar.tsx | 5.3KB | Space icons |
| CreateSpaceView.tsx | 24KB | Space creation form |

### packages/react-ui/src/stores/

| File | Features |
|------|----------|
| dragDropUiStore.ts | Basic drag state (needs enhancement) |
| navigationUiStore.ts | Sidebar visibility, active tab |

### packages/core/src/application/use-cases/

| Directory | Use Cases |
|-----------|-----------|
| spaces/ | Create, Delete, Rename, Update, Reorder |
| items/ | Create, Delete, Rename, Move, Reorder, UpdateMetadata, IncrementVisit |
| pins/ | Pin, Unpin, ReorderPins |

---

## Architecture Reference

### Data Flow

```
User Action (Click, Drag, etc.)
    │
    ▼
React Component (TreeItem, Sidebar, etc.)
    │
    ▼
Zustand Store (dragDropUiStore, clipboardStore, etc.)
    │
    ▼
IPC Call (window.spacesApi.*, window.itemsApi.*)
    │
    ▼
IPC Handler (packages/desktop/src/main/ipc/handlers.ts)
    │
    ▼
Facade (SpacesFacade, SpaceItemsFacade)
    │
    ▼
Use Case (CreateItemUseCase, MoveItemUseCase, etc.)
    │
    ▼
Repository (SqliteSpaceItemsRepository)
    │
    ▼
SQLite Database
```

### Key Design Patterns

1. **Clean Architecture**: Domain → Application → Infrastructure → Presentation
2. **Result Type**: `Result<T, E>` for error handling
3. **Invalidation Pattern**: Mutations trigger cache invalidation
4. **Event Bus**: Domain events for loose coupling
5. **Service Registry**: DI without external framework

---

## Key Differences from Flutter

| Aspect | Flutter | Electron |
|--------|---------|----------|
| State Management | Riverpod | Zustand |
| UI Framework | Flutter Widgets | React + CSS Modules |
| Database | Drift (SQLite) | better-sqlite3 |
| IPC | N/A (single process) | Electron IPC |
| Drag-Drop API | Flutter Draggable | HTML5 Drag API / react-dnd |
| Clipboard | Flutter Clipboard | Electron clipboard module |

---

## Technical Notes

### Drag-Drop Implementation Options

**Option A: HTML5 Drag API (Recommended)**
- Native browser support
- No additional dependencies
- Requires manual hit zone calculation
- Works with existing React components

**Option B: react-dnd Library**
- Higher-level abstractions
- Additional bundle size
- Well-tested patterns
- May need customization for hit zones

### Recommendation

Use **HTML5 Drag API** to minimize dependencies and maintain full control over hit zone logic (matching Flutter's 20%/60%/20% split).

### Clipboard Implementation

Use Electron's `clipboard` module via IPC:
- Main process: `import { clipboard } from 'electron'`
- Renderer: Call via IPC (`window.electronApi.clipboard.readText()`)
