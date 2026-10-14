# platform-persistence

Seeded from completed items 001, 007, 008, 009, 010, 011, B003, B013 during the SPEKY v3 migration
(2026-10-14). Describes the code as it is today.

## Purpose

The layered foundation: `@spayce/core` (entities, validators, events, use cases, facades returning
`Result`), `@spayce/infrastructure` (SQLite repositories, `ServiceBootstrap`, `ServiceRegistry`, event
bus, logger), `@spayce/desktop` (Electron main, IPC, preload bridge) and `@spayce/react-ui`.
Data lives in SQLite; UI state lives in localStorage.

<!-- speky:next-id 7 -->
## Requirements

### platform-persistence-R1: Bootstrap and storage location
On `app.whenReady`, `ServiceBootstrap.initialize` opens SQLite at `resources/db/spaces.sqlite` in
development, or `<userData>/spayce.db` when packaged, then registers the IPC handlers. The window loads
the renderer only after every handler is registered. If initialisation fails, the app quits.

#### Scenario: packaged app
- WHEN the packaged app starts
- THEN data is read from and written to `<userData>/spayce.db`

### platform-persistence-R2: Schema and timestamps
The schema has `spaces`, `space_items` (including pin, visit, favicon and local-path columns),
`browser_tabs` and a migrations table. All timestamps are INTEGER epoch milliseconds, not ISO strings.

#### Scenario: created_at
- WHEN a space is created
- THEN `created_at` holds the epoch-millisecond creation time

### platform-persistence-R3: Facade results over IPC
Every data IPC handler calls a facade from `ServiceRegistry` and returns its `Result`
(`{ success, data | error }`). Validation failures come back as errors, not exceptions.

#### Scenario: invalid input
- WHEN the renderer creates a space with an empty name
- THEN the IPC call resolves with `success: false` and a validation error

### platform-persistence-R4: Narrow preload bridge
The renderer reaches the main process only through `window.electronAPI`, which exposes spaces, items,
search, clipboard, metadata, fs, tabs, browser, sidebarOverlay and app methods, with context isolation
on. There is no `items.refreshLocalFolder` or `items.pasteItem` channel; those handlers are commented
out.

#### Scenario: no node access
- WHEN renderer code runs
- THEN it can reach main-process features only through `electronAPI`

### platform-persistence-R5: Idempotent handler registration
Browser, tab and sidebar-overlay handlers remove any existing handlers before registering, so
re-creating the window on macOS `activate` does not crash with a duplicate-handler error.

#### Scenario: window re-created
- WHEN the window is closed and the dock icon is clicked
- THEN a new window opens without an IPC registration error

### platform-persistence-R6: UI state survives reload
Active space indices (sidebar and Spaces screen), sidebar mode, sidebar visibility, active tab, focus
context and per-space expanded IDs are persisted in localStorage under `spayce:ui:*` keys and restored
on reload.

#### Scenario: reload
- WHEN the user reloads with the Spaces screen on space 2 and the sidebar in floating mode
- THEN both are restored after reload
