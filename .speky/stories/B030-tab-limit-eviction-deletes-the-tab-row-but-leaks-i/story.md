# Tab-limit eviction deletes the tab row but leaks its WebContentsView

## Why
When 20 or more tabs exist, `TabsFacade.createTab` calls `deleteOldestInactive()`, which deletes the
database row only. `tabs:create` in `main/ipc/tabHandlers.ts` never destroys the evicted tab's
WebContentsView, and the renderer's `tabStore` still lists the evicted tab. The page keeps running in
memory, and clicking the stale tab fails. Found while seeding living specs from F037 during the SPEKY
v3 migration; see browser-R4.

## Capabilities
- Evicting a tab removes its row, its view and its entry in the tab bar together.

## Non-goals
- No change to the 20-tab limit or to which tab is chosen for eviction.

## Design
<!-- Which design this implements, so nobody guesses during implementation:
     - Screens: IDs from the screen catalogue (screen:<id>) or design files in the repo, per state
       (default, empty, error, loading).
     - Design system: `.speky/design/system.md`
     Look for an existing design first (`speky design status`, the screen catalogue). If there is none,
     write "To be designed" and `speky next` runs the design step. If nothing visual changes, write
     "No new design needed: <why>". -->
No new design needed: behaviour fix; the tab bar stays as designed (screen:browser-tab-bar).

## Requirements

### R1: Evicted tab is fully closed
When creating a tab evicts another one, the main process SHALL destroy the evicted tab's
WebContentsView, and the renderer SHALL drop that tab from `tabStore`.

#### Scenario: 21st tab
- GIVEN 20 tabs are open and tab T is the least recently accessed inactive tab
- WHEN the user opens a new tab
- THEN T's view is destroyed, T disappears from the tab bar, and 20 tabs remain
