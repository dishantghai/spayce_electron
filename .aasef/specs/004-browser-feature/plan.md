# Implementation Plan: 004-browser-feature

## Step 1: TabManager in Main Process
1. Create `src/main/tabs/TabManager.ts` class
2. Implement WebContentsView creation with proper webPreferences
3. Set up all webContents event listeners
4. Implement tab state management
5. Handle window resize for content bounds

## Step 2: IPC Handlers for Tabs
1. Create `src/main/ipc/tabHandlers.ts`
2. Implement createTab, closeTab, activateTab handlers
3. Implement navigation handlers (back, forward, reload, stop)
4. Set up tab state sync to renderer

## Step 3: Tab Bar Component
1. Create `TabBar.tsx` container
2. Create `TabItem.tsx` with favicon, title, close
3. Add loading spinner and audio indicator
4. Implement drag reorder

## Step 4: URL Bar Component
1. Create `UrlBar.tsx` with auto-select behavior
2. Create `UrlBarSuggestions.tsx` dropdown
3. Implement suggestion fetching (history, spaces, search)
4. Add URL validation and normalization

## Step 5: Navigation Controls
1. Create `NavigationControls.tsx`
2. Create `BackButton.tsx`, `ForwardButton.tsx`
3. Create `ReloadButton.tsx` with stop state
4. Create `ZoomControls.tsx`

## Step 6: Keyboard Shortcuts
1. Create `useBrowserShortcuts.ts` hook
2. Register all Cmd+key shortcuts
3. Handle tab switching (Cmd+1-9)
4. Implement find in page

## Step 7: Tab Duplicate Prevention
1. Create `useTabDuplicateCheck.ts` hook
2. Implement SpaceItem ID check
3. Implement URL normalization and comparison
4. Focus existing tab if duplicate found

## TDD Approach
- Test TabManager state transitions
- Test URL normalization function
- Test keyboard shortcut handlers
- Test duplicate detection logic
