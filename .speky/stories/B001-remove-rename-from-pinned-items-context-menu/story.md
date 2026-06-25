# [BUG] Remove 'Rename' from Pinned Items Context Menu

## Description
The context menu for pinned items in the sidebar incorrectly shows a "Rename" option. Pinned items are references to existing spaces/files and should not be renameable from the pinned context - renaming should only be available from the original item's context menu. This creates confusion and potential data inconsistency.

## Acceptance Criteria
- [ ] "Rename" option is removed from pinned items context menu
- [ ] Other context menu options (unpin, open, etc.) remain functional
- [ ] Renaming is still available from the original item's context menu in spaces/files list
- [ ] No visual artifacts or layout issues in the updated context menu
- [ ] Context menu behavior is consistent across all pinned item types

## Context
- Pinned items are stored references, not the actual items themselves
- The sidebar uses independent focus management from the main spaces screen
- Context menus are likely implemented in `packages/react-ui/` or `packages/shared/`
- May involve updating context menu component props or conditional rendering logic

## Tasks
- [ ] Locate pinned items context menu component
- [ ] Remove "Rename" option from pinned items context menu
- [ ] Verify other context menu options still work correctly
- [ ] Test with different pinned item types (spaces, files, etc.)
- [ ] Update any related tests

## Notes
- Ensure the change only affects pinned items context menu, not the original items' context menus
- Consider if this change requires updating any user documentation or tooltips
- Verify the fix works consistently across different sidebar modes (fixed/floating)