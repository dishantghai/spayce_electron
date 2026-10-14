# browser

Seeded from completed items 017, 018, 019, F037, F038, F039, B018, B019, B020, B021, B022, B023
during the SPEKY v3 migration (2026-10-14). Describes the code as it is today.

## Purpose

The Browser tab is an embedded multi-tab web browser. Each tab is a persisted `browser_tabs` row
(`TabsFacade`, `SqliteTabsRepository`) with a matching Electron WebContentsView (`BrowserService`).
The renderer side is `tabStore`, `browserUiStore`, `BrowserArea`, `BrowserTabBar` and `BrowserToolbar`.

<!-- speky:next-id 8 -->
## Requirements

### browser-R1: Always at least one tab
On first open, tabs load from the database; if there are none, a "New Tab" on
`https://www.google.com` is created. Closing the last tab creates a new default tab. Concurrent
initialisation calls share one load.

#### Scenario: empty database
- WHEN the Browser tab is opened with no saved tabs
- THEN exactly one Google "New Tab" exists

### browser-R2: Create, switch, close
"+" creates a tab and its view and activates it. Clicking a tab activates it and shows its view.
Closing a tab destroys its view and deletes its row. If the closed tab was active, the adjacent tab
(same index, or the last one) becomes active. Switch and close update the UI optimistically and roll
back if the IPC call fails.

#### Scenario: close active middle tab
- WHEN tabs A, B, C exist, B is active and the user closes B
- THEN C becomes active

### browser-R3: Tab ordering
New tabs are shown at the left of the tab bar in the current session but persisted at the right
(`MAX(position)+1`), so after a restart they are at the right. Tabs can be reordered by drag in the tab
bar (`tabs:reorder`).

#### Scenario: drag reorder
- WHEN the user drags tab C before tab A
- THEN the bar shows C, A, B and the order is persisted

### browser-R4: Tab limit and duplicates
If 20 or more tabs exist when a tab is created, the least-recently-accessed inactive tab's row is
deleted first (its view is not destroyed). A create request carrying an origin space or space item
activates an existing tab for the same item or URL instead of creating a new one. Plain "new tab"
requests always create a tab.

#### Scenario: two plain new tabs
- WHEN the user clicks "+" twice
- THEN two separate Google tabs exist

### browser-R5: Toolbar and navigation
The toolbar has back and forward (disabled when unavailable), reload/stop, an address bar and a
new-tab button. On Enter, input with a scheme is loaded as-is, input that looks like a domain gets
`https://`, and anything else becomes a Google search. Escape reverts the address bar.

#### Scenario: search text
- WHEN the user types `best pizza` and presses Enter
- THEN `https://www.google.com/search?q=best%20pizza` is loaded

### browser-R6: Live tab state
Loading, progress, navigation, title, favicon and error events from each view update that tab's entry
(loading bar, title, favicon, URL). On load errors an error overlay with a retry button appears. Store
access uses selectors, so browser events don't re-render the whole app.

#### Scenario: title update
- WHEN a page finishes loading with title "Example"
- THEN its tab shows "Example"

### browser-R7: View bounds and visibility
`BrowserArea` measures its content box below the 36 px tab bar and 40 px toolbar (ResizeObserver) and
sends bounds only when they change. The active view is hidden whenever the Browser tab is not active.
Views missing after a restart are recreated for persisted tabs.

#### Scenario: resize window
- WHEN the window is resized
- THEN the active page resizes to fill the content area
