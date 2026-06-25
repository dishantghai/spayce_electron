# B013: IPC Handler Double-Registration Crash After macOS Hibernation + CMD+R

## Description

After macOS hibernation (sleep for several hours), waking the Mac and pressing CMD+R to reload
the renderer causes an uncaught exception that crashes the app with a blank screen:

```
Uncaught Exception:
Error: Attempted to register a second handler for 'browser:createView'
  at IpcMainImpl.handle (node:electron/js2c/browser_init:2:100491)
  at registerBrowserHandlers (/...packages/desktop/dist/main.cjs:3409:28)
  at App.<anonymous> (/...packages/desktop/dist/main.cjs:3672:5)
  at App.emit (node:events:519:28)
```

## Root Cause Analysis

### Evidence Chain

1. **Two registration sites exist** (`index.ts`):
   - `app.whenReady()` -> `initialize()` -> `registerBrowserHandlers(mainWindow)` (line 59)
   - `app.on('activate')` -> `registerBrowserHandlers(mainWindow)` (line 116)

2. **No cleanup before re-registration**: The `app.on('activate')` handler calls
   `registerBrowserHandlers(mainWindow)` and `registerSidebarOverlayHandlers(mainWindow)`
   without first unregistering existing handlers.

3. **Unregister functions exist but are never called in production**:
   - `unregisterBrowserHandlers()` exists at `browserHandlers.ts:141-163`
   - `unregisterSidebarOverlayHandlers()` exists at `sidebarOverlayHandlers.ts:182-204`
   - Both are only used in test cleanup (afterEach hooks)

4. **macOS hibernation scenario**: During prolonged sleep, macOS may destroy the
   BrowserWindow while keeping the main process alive. When the user returns:
   - `app.on('activate')` fires
   - `BrowserWindow.getAllWindows().length === 0` evaluates to true (window was destroyed)
   - A new window is created
   - `registerBrowserHandlers(mainWindow)` is called
   - But handlers from `initialize()` are still registered on the `ipcMain` singleton
   - Electron throws: "Attempted to register a second handler for 'browser:createView'"

5. **Stack trace confirms**: `App.<anonymous>` at line 3672 in compiled output corresponds
   to the `app.on('activate')` handler in `index.ts:113`.

### Affected Handlers

**browserHandlers.ts** (13 `ipcMain.handle` channels):
- `browser:createView`, `browser:destroyView`, `browser:setActiveView`,
  `browser:getActiveViewId`, `browser:setBounds`, `browser:loadURL`,
  `browser:goBack`, `browser:goForward`, `browser:reload`, `browser:stop`,
  `browser:getViewState`, `browser:setVisibility`, `browser:getViewCount`

**sidebarOverlayHandlers.ts** (6 `ipcMain.handle` + 3 `ipcMain.on` channels):
- Handles: `sidebar-overlay:show`, `sidebar-overlay:hide`, `sidebar-overlay:toggle`,
  `sidebar-overlay:getVisibility`, `sidebar-overlay:showInstant`, `sidebar-overlay:hideInstant`
- Listeners: `sidebar-overlay:sync-state`, `sidebar-overlay:action`, `sidebar-overlay:set-mode`

### Why `handlers.ts` Is Not Affected

The general IPC handlers (`registerIpcHandlers()`) are only called in `initialize()` and
NOT in `app.on('activate')`. They don't reference `mainWindow` in closures, so they work
with any window. No double-registration risk.

## Acceptance Criteria

- [ ] `registerBrowserHandlers()` is safe to call multiple times (idempotent)
- [ ] `registerSidebarOverlayHandlers()` is safe to call multiple times (idempotent)
- [ ] Old handlers are removed before new ones are registered
- [ ] `ipcMain.on` listeners for sidebar-overlay are cleaned up before re-adding
- [ ] No crash on `app.on('activate')` after hibernation when handlers already exist
- [ ] Existing tests continue to pass (no regressions)

## Context

- **Related Specs**: spec-020 (sidebar overlay), spec-019 (browser integration)
- **Affected Files**:
  - `packages/desktop/src/main/ipc/browserHandlers.ts`
  - `packages/desktop/src/main/ipc/sidebarOverlayHandlers.ts`

## Tasks

1. Write failing tests (TDD RED) that verify idempotent registration
2. Make `registerBrowserHandlers()` call `unregisterBrowserHandlers()` first
3. Make `registerSidebarOverlayHandlers()` remove existing handlers/listeners first
4. Verify all tests pass (TDD GREEN)

## Notes

- `unregisterBrowserHandlers()` is safe to call even if no handlers are registered
  (`ipcMain.removeHandler` is a no-op for non-existent handlers)
- `unregisterSidebarOverlayHandlers()` calls `service.destroy()` which we do NOT want
  during re-registration. The sidebar handler cleanup must be inlined to avoid destroying
  the service before re-initializing it.
- The `ipcMain.on` listeners in sidebarOverlayHandlers would accumulate duplicates
  (unlike `ipcMain.handle` which throws), causing double-handling of events.
