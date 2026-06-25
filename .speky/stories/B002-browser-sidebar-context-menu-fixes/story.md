# Fix Context Menu, Stale State, and Drag/Drop in Browser Sidebar Overlay

## Description

When using the browser sidebar in floating/overlay mode (Spec 020), there are critical issues with context menus, inline input state management, and drag/drop functionality that make the sidebar unreliable and confusing for users.

**Related Spec**: Spec 020 - Sidebar Overlay WebContentsView

## Acceptance Criteria

### Context Menu Functionality
- [ ] Context menus appear ON TOP of browser content (not below)
- [ ] Browser content stays visible when context menu opens (not blank)
- [ ] All context menu actions execute correctly (rename, delete, copy, paste, pin, new folder, new link)
- [ ] Context menu renders inside overlay WebContentsView at correct z-index

### Stale Inline Input State Management
- [ ] Clicking rename on item A, then clicking item B does NOT show rename input for item A
- [ ] Clicking rename on item A, then right-clicking item B does NOT jump focus to item A
- [ ] Clicking "New Folder" from context menu after previous rename does NOT show old rename input
- [ ] Hover action icons (+ folder, + link) work without stale state interference
- [ ] Rename same item twice works correctly (first rename, cancel, rename again shows input)

### Drag and Drop
- [ ] Can drag items within sidebar overlay
- [ ] Can drop items into folders
- [ ] Can reorder items by dragging between them
- [ ] Multi-select drag works
- [ ] Drag preview displays correctly
- [ ] Drop persists to database and UI updates

### Auto-Show State Sync
- [ ] When overlay auto-shows via mouse tracking (hover left edge), state syncs correctly
- [ ] expandedIdsMap is populated (folders don't collapse when clicking items after auto-show)
- [ ] All previous state is available in overlay before user interacts

## Context

### Technical Constraints

**Electron WebContentsView Architecture:**
- Browser WebContentsView at z-index 0
- Sidebar Overlay WebContentsView at z-index 1
- WebContentsView ALWAYS renders above HTML content
- Each WebContentsView has separate JavaScript context and Zustand store instances

**State Management Challenges:**
- Main renderer and overlay have separate Zustand store instances
- State must sync via IPC between processes
- Inline input state (sidebarRenameItemId, sidebarInput) must be managed carefully
- Drag/drop state (dragDropStore) is per-process

### Root Causes Identified

1. **Context Menu Z-Index**: HTML context menus render below WebContentsView overlay
2. **Stale Inline Input State**: State not cleared when opening new context menu or clicking items
3. **Inline Input Store Not Synced**: Main and overlay have separate store instances
4. **Action ID Mismatch**: Overlay used hyphens, main used underscores
5. **Auto-Show Without State Sync**: Mouse tracking showed overlay without notifying renderer
6. **Drag/Drop Store Isolation**: Overlay's drag data not available to main renderer
7. **State Sync Timing**: Reading from store instead of hook values caused mismatches

## Tasks

### Phase 1: Context Menu Architecture (z-index fix)
1. Move context menu rendering into sidebar overlay WebContentsView
2. Add context menu state management to overlay (sidebar.tsx)
3. Add helper functions (getContextMenuItems, getRootContextMenuItems, hasLinksRecursive)
4. Wire up context menu event handlers in overlay
5. Add action forwarding from overlay to main (CONTEXT_MENU_ACTION, ROOT_CONTEXT_MENU_ACTION)
6. Update IPC types (preload/types.ts)

### Phase 2: Inline Input State Management
1. Clear inline input state when opening context menus (all handlers)
2. Clear inline input state when clicking items (ITEM_CLICK handler)
3. Clear inline input state when executing non-matching actions (selective cleanup)
4. Force state toggle for rename actions (null → id via setTimeout)
5. Implement cleanup in hover action handlers (Sidebar.tsx, SpaceCard.tsx)
6. Remove inline input state sync from main to overlay (overlay manages independently)

### Phase 3: Auto-Show State Sync
1. Send auto-show notification from SidebarOverlayService before showing
2. Add onAutoShowTriggered listener to preload API
3. Handle auto-show notification in App.tsx (set sidebarVisible = true)
4. Ensure state sync effect runs with correct expandedIdsMap

### Phase 4: Drag and Drop
1. Option A: Enable Arborist tree for overlay (USE_ARBORIST_TREE = true)
2. Option B: Forward drag data with ITEM_DROP action from overlay to main
3. Update main renderer to accept drag data from action payload
4. Test single item drag, multi-select drag, folder drag, reordering

### Phase 5: Testing
1. Test all context menu actions (11 action types)
2. Test all stale state scenarios (rename → click, rename → right-click, etc.)
3. Test hover actions with prior state
4. Test drag/drop within sidebar
5. Test auto-show followed by interactions

## Notes

### Implementation Hints

**Context Menu Actions - Handle Locally in Overlay:**
- Rename, New Folder, New Link → Handle in overlay, don't send to main until submit
- Delete, Copy, Paste, Pin, etc. → Forward to main for database operations

**Cleanup Points (14 total):**
- Overlay: handleItemContextMenu, handlePinnedItemContextMenu, handleRootContextMenu, handleItemClick
- Main: CLEAR_INLINE_STATE handler, ITEM_CLICK handler, context menu handlers
- Hover: Sidebar.handleAddSubfolder, handleAddLinkToFolder, SpaceCard.handleAddSubfolder, handleAddLink

**State Sync Strategy:**
- Sync core data: spaces, selection, expandedIds
- DON'T sync UI state: inline inputs managed locally in overlay
- Only sync on data changes, not on every UI interaction

### Edge Cases

- Rapid context menu interactions
- Same item rename twice
- Rename → cancel → different action
- Context menu during inline input
- Drag during context menu
- Auto-show during user interaction

### Testing Strategy

- Unit tests for each cleanup point
- Integration tests for complete flows
- Regression tests for all bugs
- Test matrix for all interaction combinations

## Affected Files

**Core Implementation:**
- packages/desktop/src/renderer/App.tsx (MAJOR - needs careful re-implementation)
- packages/desktop/src/renderer/sidebar.tsx (context menus, local state)
- packages/desktop/src/main/services/SidebarOverlayService.ts (auto-show notification)
- packages/desktop/src/main/ipc/sidebarOverlayHandlers.ts (handler updates)
- packages/desktop/src/preload/index.ts (auto-show listener)
- packages/desktop/src/preload/types.ts (type definitions)
- packages/react-ui/src/components/Sidebar.tsx (hover action cleanup)
- packages/react-ui/src/components/spaces/SpaceCard.tsx (hover action cleanup)

**Test Files (28 files created - preserve these):**
- All files in packages/desktop/__tests__/spec-020/REGRESSION_*.test.tsx
- All documentation files created

## Success Metrics

- ✅ All context menu actions work without errors
- ✅ No stale state or focus jumping in any scenario
- ✅ Drag/drop works for all item types
- ✅ All 800+ regression tests pass
- ✅ Clean console logs (no errors)
- ✅ Smooth user experience across all interactions
