# spaces

Seeded from completed items 002, 003, 005, F036, B006 during the SPEKY v3 migration (2026-10-14).
Describes the code as it is today.

## Purpose

A space is a named, coloured, icon-tagged container for a tree of folders and links. Users create,
edit, reorder and switch between spaces from the sidebar and the Spaces screen. All spaces belong to
the single hard-coded profile `default-profile`.

<!-- speky:next-id 7 -->
## Requirements

### spaces-R1: Create a space
The Create Space view collects a name, an icon (searchable icon picker) and an accent colour, then
creates the space via `spaces:create`. The core validator rejects an empty or whitespace-only name and
a malformed colour (it must be `#RRGGBB`). It trims the name and defaults the icon to `folder` and the
colour to `#6D5AE6`.

#### Scenario: valid space
- WHEN the user submits name "Work", an icon and a valid hex colour
- THEN a space is persisted at the end of the list and the sidebar switches to it

#### Scenario: empty name
- WHEN the name is empty or only whitespace
- THEN creation fails with a ValidationError on `name` and nothing is persisted

### spaces-R2: Edit a space
An existing space's name, icon and accent colour can be changed through the same form (`spaces:update`).

#### Scenario: rename and recolour
- WHEN the user edits a space and saves a new name and colour
- THEN the space shows the new name and colour in the sidebar and on the Spaces screen

### spaces-R3: Switch the active space
The sidebar and the Spaces screen each keep their own active-space index. Both indices are persisted
and clamped to the valid range when spaces are removed.

#### Scenario: independent indices
- WHEN the user selects space 2 in the sidebar and space 3 on the Spaces screen
- THEN each view keeps its own selection, and both survive a page reload

#### Scenario: out-of-range index
- WHEN the persisted index is greater than or equal to the number of spaces
- THEN it is clamped to the last space

### spaces-R4: Reorder spaces by drag
Spaces can be reordered by drag in the sidebar's space switcher and on the Spaces screen
(`spaces:reorder` with the full ordered ID list). After a reorder, each view's active index is
remapped so it still points at the same space.

#### Scenario: active space follows the reorder
- WHEN the active space "Work" is dragged from position 0 to position 2
- THEN "Work" is persisted at position 2 and stays the active space

### spaces-R5: Spaces screen shows all spaces as cards
The Spaces tab renders one card per space with that space's tree (pinned items are filtered out of the
tree) and lets the user create folders and links inline on a card.

#### Scenario: card per space
- WHEN the user opens the Spaces tab with three spaces
- THEN three space cards are shown, each with its own tree

### spaces-R6: No space deletion in the UI
`useSpacesData.deleteSpace` and the `spaces:delete` IPC exist, but no UI element calls them today.

#### Scenario: no delete action
- WHEN the user opens any space menu
- THEN there is no option to delete the space
