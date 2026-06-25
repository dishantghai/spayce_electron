# B007: Pinned Links Grid Reorder Flash on Drop (Browser Floating Sidebar)

## Description
When reordering pinned links in the PinnedLinksGrid in Browser Sidebar **Floating mode**, the dropped item briefly flashes back to its old position before settling at the new position. This creates a noticeable visual glitch at the end of every drag-drop reorder.

**Reproduction Steps:**
1. Open browser with sidebar in Floating mode
2. Have 3+ pinned links in the grid
3. Drag a pinned link to a new position
4. Observe: on drop, the item flickers/jumps back to old position then moves to new position

**NOT affected:**
- Fixed Sidebar for Browser
- Floating/Fixed Sidebar for Spaces/Workspace
- BottomBar space reordering (fixed in B006)

## Root Cause Analysis

### Primary Cause: No Local Optimistic State
`PinnedLinksGrid.tsx` relies entirely on parent props for the items array. On drop:
1. `handleDragEnd()` calls `onReorderPins(oldIndex, newIndex)`
2. @dnd-kit resets its internal transforms (items animate back to original positions)
3. Parent's state update propagates asynchronously
4. Items re-render in new positions

Between steps 2 and 4, items are briefly at their OLD positions — this is the flash.

### Secondary Cause: CSS Transitions on Cards
`PinnedLinksGrid.module.css` has `transition: transform 150ms ease` on `.card`, and @dnd-kit applies its own `transition` via inline styles from `useSortable()`. When @dnd-kit clears the transform on drag end, the CSS transition animates the reset, making the flash visible.

### Why Only Floating Mode
The floating sidebar has its own `transition: transform 250ms` on the container. This creates a timing window where:
- @dnd-kit's animation (150ms) resolves
- Parent state update hasn't propagated yet
- The floating sidebar's own transitions may delay React reconciliation

### Evidence: B006 Fix Pattern Works
The identical issue was fixed in `BottomBar.tsx` (B006) using local optimistic state:
- `optimisticSpaces` state holds the reordered array immediately
- `displayedSpaces = optimisticSpaces ?? spaces` renders the local version
- `useEffect` clears optimistic state when parent props update

## Acceptance Criteria
- [x] Pinned link reorder in Browser Floating Sidebar drops without flash/flicker
- [x] @dnd-kit sort animation remains smooth during drag
- [x] Active/dragged item appears at correct new position immediately on drop
- [x] Parent callback `onReorderPins` is still called for persistence
- [x] No regressions in Fixed sidebar, Spaces screen, or external drop-to-pin
- [x] All existing F023 tests continue to pass

## Context
- **Related Spec**: 020 (Browser Integration)
- **Related Stories**: F023 (reorder pins in grid), B006 (spaces reorder fix)
- **Dependencies**: None
- **Affected Files**:
  - `packages/react-ui/src/components/PinnedLinksGrid.tsx`
  - `packages/react-ui/src/components/PinnedLinksGrid.module.css`

## Tasks
1. Add TDD tests for optimistic reorder behavior in PinnedLinksGrid
2. Add local optimistic state (`optimisticItems`) to PinnedLinksGrid
3. Use `arrayMove` from @dnd-kit to reorder locally in `handleDragEnd` before calling parent
4. Sync optimistic state back to props via `useEffect` (same as B006 pattern)
5. Verify all existing tests pass

## Notes
- Use `arrayMove` from `@dnd-kit/sortable` — already imported in the file
- Pattern matches B006 fix exactly: local optimistic state + useEffect sync
- The `.card` CSS transition on `transform` is managed by @dnd-kit inline styles, so no CSS changes needed (unlike B006 where we controlled translateX directly)
