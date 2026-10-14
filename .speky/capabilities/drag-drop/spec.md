# drag-drop

Seeded from completed items 014, F011, F012, F013, F014, F015, F016, F020, F021, F025, F030, F032,
B006, B016 during the SPEKY v3 migration (2026-10-14). Describes the code as it is today.

## Purpose

Users reorganise their trees by dragging items: within a tree, into folders, between space cards, and
between the sidebar and the cards. `dragDropUiStore` tracks the drag, drop indicator, auto-expanded
folders and the post-drop flash. `App.handleItemDrop` turns a drop into `items:move` calls.

<!-- speky:next-id 7 -->
## Requirements

### drag-drop-R1: Drop positions and indicators
Each tree row has hit zones that resolve to `before`, `after` or (for folders) `inside`. A drop
indicator line or folder highlight shows the resolved position while dragging. `before` and `after`
place items next to the target under the same parent; `inside` makes them the folder's first
children.

#### Scenario: drop inside a folder
- WHEN the user drops link "A" on the middle zone of folder "Docs"
- THEN "A" becomes the first child of "Docs"

#### Scenario: reorder in the same parent
- WHEN the user drags item 0 to after item 2 under the same parent
- THEN the item ends up at index 2, adjusted for its own removal

### drag-drop-R2: Circular drops rejected
A folder cannot be dropped into itself or any of its descendants. The drop indicator is cleared and a
`circular_reference` validation error is set.

#### Scenario: into own child
- WHEN the user drags folder "Docs" onto its subfolder "Docs/Specs"
- THEN no drop indicator is shown and nothing moves

### drag-drop-R3: Auto-expand while hovering
Hovering a collapsed folder during a drag for 800 ms expands it. Folders expanded this way are
tracked and cleared when the drag ends.

#### Scenario: hover to open
- WHEN the user holds a dragged item over collapsed folder "Docs" for 800 ms
- THEN "Docs" expands so the user can drop into a child

### drag-drop-R4: Multi-item drag and preview
Dragging a selected item drags the whole selection, moved in order to consecutive positions. The drag
preview shows the item, with stacked cards and a count badge when more than one item is dragged.

#### Scenario: three items
- WHEN three selected items are dragged
- THEN the preview shows a stack with a count of 3, and all three move on drop

### drag-drop-R5: Cross-space moves
Items can be dropped onto another space card (moved to that space's root) or onto a row in another
space's tree, including between the sidebar and the Spaces screen. Folders move with their subtree
(space-tree-R6). Dropping an item that came from the pins grid unpins it first.

#### Scenario: card to card
- WHEN the user drags link "A" from card "Work" onto card "Home"
- THEN "A" is at the root of "Home" and no longer in "Work"

### drag-drop-R6: Flash after drop
After a successful drop, the first moved item briefly flashes so the user can see where it landed.

#### Scenario: flash
- WHEN a drop succeeds
- THEN the first dropped item shows the flash animation once
