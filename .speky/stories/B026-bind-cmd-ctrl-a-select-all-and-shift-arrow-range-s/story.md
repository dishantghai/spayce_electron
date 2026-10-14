# Bind Cmd/Ctrl+A select-all and Shift+Arrow range selection

## Why
Spec 013 was completed with Ctrl+A (select all) and Shift+Arrow (extend selection) as acceptance
criteria, but neither key is handled: `selectionStore.selectAll` exists and nothing calls it.
Keyboard users can only build a multi-selection with the mouse. Found during the SPEKY v3 migration;
see selection-R4 and keyboard-navigation-R5.

## Capabilities
- Cmd/Ctrl+A selects every visible item in the focused view's active space.
- Shift+ArrowUp/Down extends the multi-selection from the anchor.

## Non-goals
- No change to mouse selection (Cmd-click, Shift-click).
- No select-all across spaces.

## Design
<!-- Which design this implements, so nobody guesses during implementation:
     - Screens: IDs from the screen catalogue (screen:<id>) or design files in the repo, per state
       (default, empty, error, loading).
     - Design system: `.speky/context/design_system.md`
     Look for an existing design first (`speky design status`, the screen catalogue). If there is none,
     write "To be designed" and `speky next` runs the design step. If nothing visual changes, write
     "No new design needed: <why>". -->
No new design needed: keyboard behaviour only. Selected items use the existing selection highlight from the design system; sidebar and Spaces screen as in `project_ops/HIFI_UI_DESIGN_SCREENS/App Side Bar with Spaces Screen Open.png`.

## Requirements

### R1: Select all with Cmd/Ctrl+A
The focused view (sidebar or Spaces screen) SHALL call `selectAll` with its active space's visible
item IDs when Cmd (macOS) or Ctrl (elsewhere) + A is pressed outside an input.

#### Scenario: select all in the sidebar
- GIVEN the sidebar has focus and its active space shows 5 visible items
- WHEN the user presses Cmd+A
- THEN all 5 items are selected and highlighted

#### Scenario: inside an input
- GIVEN an inline rename input has focus
- WHEN the user presses Cmd+A
- THEN the input's text is selected and the tree selection doesn't change

### R2: Extend selection with Shift+Arrow
Shift+ArrowDown and Shift+ArrowUp SHALL move keyboard focus by one visible item and select the range
from the anchor to the new focus (`selectRange`).

#### Scenario: extend down
- GIVEN item 2 is focused and selected
- WHEN the user presses Shift+ArrowDown twice
- THEN items 2, 3 and 4 are selected
