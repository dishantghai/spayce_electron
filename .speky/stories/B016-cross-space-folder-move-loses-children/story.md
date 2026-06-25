# B016: Cross-Space Folder Drag-Drop Loses Children

## Description
When dragging and dropping a folder from the Sidebar to a SpaceCard (moving it to a different space), only the outer folder moves to the target space. The inner items (children) remain in the source space and are promoted to root level, appearing orphaned.

## Root Cause Analysis

### Evidence Chain

1. **Drop handler** (`App.tsx:1453-1477` `handleCrossCardMove`):
   - Calls `itemsApi.move(item.id, targetSpaceId, undefined, undefined)` for each dropped item
   - Only moves the top-level dropped items, relies on repository to handle children

2. **IPC handler** (`handlers.ts:115-123`):
   - Passes through to `MoveItemUseCase` with targetSpaceId, null parentId, position 0

3. **Use case** (`MoveItemUseCase.ts:20-71`):
   - Delegates to `repository.moveItem()` — no child handling logic

4. **Repository** (`SqliteSpaceItemsRepository.ts:250-317` `moveItem()`) **ROOT CAUSE**:
   - The SQL update at lines 291-294 only updates items in `newOrderedIds` (the moved item + its new siblings):
     ```sql
     UPDATE space_items SET space_id = ?, parent_id = ?, sort_order = ? WHERE id = ?
     ```
   - Children of the moved folder are NOT updated — their `space_id` remains the source space
   - Children keep `parent_id` pointing to the moved folder, but since they're in a different `space_id`, queries like `getItemsBySpaceId` show them as orphaned root items in the source space

5. **Contrast with `deleteItem()`** (lines 230-248):
   - Uses a recursive CTE to find and delete ALL descendants
   - `moveItem()` is missing this recursive pattern for cross-space moves

### The Fix
Add a recursive CTE after the main move to update all descendants' `space_id` to match the new space:
```sql
WITH RECURSIVE item_tree AS (
    SELECT id FROM space_items WHERE parent_id = ?
    UNION ALL
    SELECT si.id FROM space_items si
    INNER JOIN item_tree it ON si.parent_id = it.id
)
UPDATE space_items SET space_id = ?
WHERE id IN (SELECT id FROM item_tree)
```

This runs inside the existing transaction, only when `!isSameParent` (cross-space or cross-parent move).

## Acceptance Criteria
- [ ] When a folder is moved cross-space, ALL descendants (children, grandchildren, etc.) move with it
- [ ] Descendants' `space_id` is updated to the target space
- [ ] Descendants' `parent_id` relationships are preserved (tree structure intact)
- [ ] Same-space moves (reorder within same parent) are unaffected
- [ ] Same-space parent changes work correctly
- [ ] Deeply nested folders (3+ levels) move correctly
- [ ] The fix runs inside the existing transaction (atomic)

## Context
- **Related Spec**: None (bug fix)
- **Affected Files**: `packages/infrastructure/src/persistence/sqlite/SqliteSpaceItemsRepository.ts`
- **Test File**: `packages/infrastructure/__tests__/B016-cross-space-folder-move.test.ts`

## Tasks
1. Write TDD tests encoding all acceptance criteria (RED phase)
2. Add recursive CTE to `moveItem()` for cross-space descendant updates (GREEN phase)
3. Verify all existing tests still pass (VERIFY phase)

## Notes
- The recursive CTE pattern already exists in `deleteItem()` — reuse the same approach
- Only need to update `space_id` on descendants, NOT `parent_id` or `sort_order` (tree structure is preserved)
- The fix should be inside the existing `this.db.transaction()` block for atomicity
