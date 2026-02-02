# B006: Spaces Reordering Broken in Hybrid Sidebar

## Description

The spaces reordering feature (drag-and-drop of space circles in the sidebar BottomBar) that was working in commit `2a0a3ef99e35e79b15f8efdf11a61544855adec0` no longer works after the hybrid implementation of React Sidebar (Floating/Fixed for Spaces and Workspace Screens) combined with Sidebar Overlay for Floating/Fixed Sidebar in Browser mode.

The feature should allow users to drag space circles in the bottom bar to reorder them, with Arc Browser-style gap animation feedback.

**Impact:** Users cannot reorder their spaces using drag-and-drop, forcing them to use less intuitive methods or live with an unwanted order.

## Root Cause Analysis

The hybrid sidebar implementation introduces complexity around `pointer-events` and visibility states:

1. **React Sidebar Wrapper** (App.tsx lines 2229-2246):
   - `pointerEvents: (useOverlayMode || !reactSidebarVisible) ? 'none' : 'auto'`
   - If `reactSidebarVisible` is `false` when it should be `true`, drag events are blocked

2. **Potential Issues:**
   - State synchronization between `sidebarVisible` and `reactSidebarVisible`
   - Timing issues during tab switching (browser -> spaces)
   - Mode transition states (`isModeSwitch`) affecting events
   - `visibility: 'hidden'` during overlay mode affecting drag events

## Acceptance Criteria

- [ ] Drag-and-drop reordering works in the Sidebar BottomBar (space circles) for Spaces tab
- [ ] Drag-and-drop reordering works in the Sidebar BottomBar for Workspace tab
- [ ] Drag-and-drop reordering works in SpacesScreen bottom bar (SpacesBottomBar)
- [ ] Gap animation shows correctly during drag
- [ ] Reorder persists to database after drop
- [ ] Active space selection is preserved after reorder
- [ ] Works in both Fixed and Floating sidebar modes (when not in browser tab)
- [ ] No regression in browser tab overlay mode

## Context

- **Related Stories**: F036-reorder-spaces-drag (original implementation)
- **Last Working Commit**: `2a0a3ef99e35e79b15f8efdf11a61544855adec0`
- **Hybrid Implementation**: spec-020 (Sidebar Overlay WebContentsView)

## Affected Files

- `packages/desktop/src/renderer/App.tsx` - Wrapper styles and state management
- `packages/react-ui/src/components/BottomBar.tsx` - Sidebar bottom bar drag-drop
- `packages/react-ui/src/components/spaces/SpacesBottomBar.tsx` - SpacesScreen bottom bar
- `packages/react-ui/src/components/Sidebar.tsx` - Passes onReorderSpaces prop

## Tasks

1. [ ] Write failing tests for drag-and-drop reordering (TDD RED phase)
2. [ ] Investigate `reactSidebarVisible` state synchronization
3. [ ] Check `pointer-events` CSS during spaces/workspace tabs
4. [ ] Fix state management to ensure drag events are not blocked
5. [ ] Verify gap animation and persistence work correctly
6. [ ] Test in all sidebar modes (fixed/floating) and tabs (spaces/workspace)

## Notes

### Implementation Approach
- Focus on Pure React Sidebar first (Spaces and Workspace tabs)
- Browser overlay sidebar can be addressed separately if needed
- Use extensive console logging to trace drag event flow

### Test Strategy
- Unit tests for BottomBar drag-drop handlers
- Integration tests for full reorder flow
- Visual regression tests for gap animation (optional)

### Debug Points
1. Check if `handleDragStart` fires (console log present)
2. Check if `handleDragOver` fires
3. Check if `handleDrop` fires
4. Check if `onReorderSpaces` callback is called
5. Check if API call succeeds

### Console Logs Already Present
The F036 implementation includes detailed console logs:
- `[F036] handleDragStart - index:`
- `[F036] handleDragOver - index:`
- `[F036] handleDrop ENTERED - index:`
- `[F036-App] handleReorderSpaces called:`
