# selection

Seeded from completed items 013, F017, F018, F019 during the SPEKY v3 migration (2026-10-14).
Describes the code as it is today.

## Purpose

Users select tree items one at a time or several at once, so that copy and drag can act on a group.
Multi-selection lives in `selectionStore` (Zustand). Single selection and keyboard focus are tracked
per view (sidebar vs card) in `App.tsx`, `Sidebar` and `SpacesScreen`.

<!-- speky:next-id 6 -->
## Requirements

### selection-R1: Single selection
A plain click clears any multi-selection, selects the item, gives keyboard focus to that view, and
also toggles the item's expansion if it is a folder.

#### Scenario: plain click
- WHEN three items are multi-selected and the user plain-clicks a fourth
- THEN only the fourth item is selected

### selection-R2: Toggle with Cmd/Ctrl-click
Cmd-click on macOS (Ctrl-click elsewhere) adds an item to the multi-selection, or removes it if it is
already selected, without expanding folders. Selection is scoped to one space and one context; the
pins grid shares the space-card context.

#### Scenario: toggle
- WHEN the user Cmd-clicks items A and B, then Cmd-clicks A again
- THEN only B is selected

### selection-R3: Range with Shift-click
Shift-click selects every visible item between the anchor (the last single or toggled item) and the
clicked item, in visible tree order.

#### Scenario: range
- WHEN the user clicks item 2 and then Shift-clicks item 5
- THEN items 2, 3, 4 and 5 are selected

### selection-R4: Visual feedback and Escape
Selected items are highlighted. Escape clears the multi-selection and the keyboard focus in the view
that has focus. Ctrl/Cmd+A and Shift+Arrow are not bound: `selectAll` exists in the store but no key
handler calls it.

#### Scenario: escape clears
- WHEN three items are selected and the user presses Escape
- THEN no items are selected

### selection-R5: Selection feeds drag and copy
Dragging a selected item drags the whole selection (`getDragPayload`), and the selection is cleared
after a drop. Cmd/Ctrl+C copies the multi-selection when there is one, otherwise the focused item.

#### Scenario: drag the group
- WHEN items A, B and C are selected and the user drags B into folder "Docs"
- THEN A, B and C move into "Docs" in order, and the selection is cleared
