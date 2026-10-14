# pinned-links

Seeded from completed items F022, F023, F024, B001, B007 during the SPEKY v3 migration (2026-10-14).
Describes the code as it is today.

## Purpose

Each space has a grid of pinned links above its tree for quick access. Pinned items are links flagged
`isPinned` with a `pinPosition`, found at any depth of the tree, and they are hidden from the tree
view.

<!-- speky:next-id 6 -->
## Requirements

### pinned-links-R1: Grid layout and limit
The grid shows the space's pinned links ordered by `pinPosition`, five columns wide, up to 15 pins.

#### Scenario: order
- WHEN a space has pins at positions 0, 1 and 2
- THEN they appear left to right in that order

### pinned-links-R2: Pin by menu or drag
"Pin to Top" in a link's menu pins it. Dragging a link from the same space's tree onto the grid pins it
at the drop cell. Folders, links from another space, and new pins beyond 15 are refused.

#### Scenario: drag to pin
- WHEN the user drags link "A" from the tree onto the grid's second cell
- THEN "A" is pinned at position 1 and leaves the tree view

#### Scenario: grid full
- WHEN the grid already has 15 pins and the user drags an unpinned link onto it
- THEN the drop is refused

### pinned-links-R3: Reorder pins
Pins are reordered by drag inside the grid. The new order shows immediately (optimistic) and is
persisted with `items:reorderPins`. On failure the data is re-fetched.

#### Scenario: no flash on drop
- WHEN the user moves the first pin to the third cell
- THEN the grid shows the new order immediately, with no snap-back

### pinned-links-R4: Unpin
"Unpin" in the menu, or dragging a pin into the tree, unpins the link and returns it to the tree.

#### Scenario: drag out
- WHEN the user drags a pin onto a tree row
- THEN the link is unpinned and placed at that row's position

### pinned-links-R5: Pinned-link menu
The pins-grid menu omits Rename (context-menus-R2).

#### Scenario: no rename
- WHEN the user right-clicks a pin
- THEN no Rename entry appears
