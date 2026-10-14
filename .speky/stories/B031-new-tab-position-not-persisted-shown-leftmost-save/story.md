# New tab position not persisted: shown leftmost, saved rightmost

## Why
B019 made `tabStore.createTab` show new tabs at position 0 (leftmost, matching Flutter), but
`SqliteTabsRepository.create` still saves them at `MAX(position)+1`, and `getAll` orders by position.
After a restart, tabs opened in the last session move to the right end. Found while seeding living
specs during the SPEKY v3 migration; see browser-R3.

## Capabilities
- Tab order after a restart matches the order the user saw before quitting.

## Non-goals
- No change to drag reordering.

## Design
<!-- Which design this implements, so nobody guesses during implementation:
     - Screens: IDs from the screen catalogue (screen:<id>) or design files in the repo, per state
       (default, empty, error, loading).
     - Design system: `.speky/context/design_system.md`
     Look for an existing design first (`speky design status`, the screen catalogue). If there is none,
     write "To be designed" and `speky next` runs the design step. If nothing visual changes, write
     "No new design needed: <why>". -->
No new design needed: tab order after restart; tab bar as designed (`project_ops/HIFI_UI_DESIGN_SCREENS/Browser Tab Bar.png`).

## Requirements

### R1: Persist new tabs at position 0
Creating a tab SHALL store it at position 0 and shift existing tabs right by one, so the persisted
order matches the tab bar.

#### Scenario: restart keeps order
- GIVEN tabs A and B are open and the user opens tab C, which appears leftmost
- WHEN the app restarts
- THEN the tab bar shows C, A, B
