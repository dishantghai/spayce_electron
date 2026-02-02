# [BUG] State Persistence on Page Refresh

## Description
When the page refreshes (either manually or due to hot-reload during development), the UI state is lost and the application returns to its default state. This creates an inconsistent user experience where users lose their navigation context, expanded folders, sidebar mode preference, active tab, and other UI state.

## Root Cause Analysis
The application uses multiple state management approaches:
1. **React useState in App.tsx** - Local component state that resets on remount
2. **Zustand stores** - Global stores without persistence middleware configured
3. **No localStorage/sessionStorage integration** - State is purely in-memory

## States Requiring Persistence

### **MUST Persist (Critical UX)**
| State | Location | Current Type | Persistence Strategy |
|-------|----------|--------------|---------------------|
| `sidebarActiveSpaceIndex` | App.tsx | useState(0) | localStorage |
| `spacesScreenActiveSpaceIndex` | App.tsx | useState(0) | localStorage |
| `sidebarMode` | App.tsx | useState('fixed') | localStorage |
| `sidebarVisible` | App.tsx | useState(true) | localStorage |
| `activeTab` | App.tsx | useState('spaces') | localStorage |
| `sidebarExpandedIdsMap` | App.tsx | useState(Map) | localStorage (serialize) |
| `focusContext` | App.tsx | useState('sidebar') | localStorage |

### **SHOULD Persist (Enhanced UX)**
| State | Location | Current Type | Persistence Strategy |
|-------|----------|--------------|---------------------|
| `navigationUiStore.activeSpaceId` | navigationUiStore.ts | Zustand | zustand/persist |
| `navigationUiStore.sidebarTab` | navigationUiStore.ts | Zustand | zustand/persist |
| `navigationUiStore.sidebarMode` | navigationUiStore.ts | Zustand | zustand/persist |
| `navigationUiStore.isSidebarOpen` | navigationUiStore.ts | Zustand | zustand/persist |

### **Browser State (Complex - Phase 2)**
| State | Location | Notes |
|-------|----------|-------|
| `browserUiStore.activeViewId` | browserUiStore.ts | Requires main process coordination |
| `browserUiStore.views` | browserUiStore.ts | URLs, titles - persist in main process |
| Browser history per tab | Main process | Chromium session restore |

### **DO NOT Persist (Transient State)**
| State | Location | Reason |
|-------|----------|--------|
| `dragDropUiStore.*` | dragDropUiStore.ts | Active drag session - transient |
| `selectionStore.*` | selectionStore.ts | Selection clears naturally |
| `clipboardStore.*` | clipboardStore.ts | Clipboard is session-scoped |
| `inlineInputStore.*` | inlineInputStore.ts | Active input - should not restore |
| `contextMenu` | App.tsx | Menu position - transient |
| `rootContextMenu` | App.tsx | Menu position - transient |
| Overlay transition states | App.tsx | Animation state - transient |

## Acceptance Criteria

### Phase 1: Core UI State Persistence
- [ ] Sidebar mode (fixed/floating) persists across refresh
- [ ] Sidebar visibility state persists across refresh
- [ ] Active tab (spaces/browser) persists across refresh
- [ ] Active space index persists across refresh (both sidebar and spaces screen)
- [ ] Expanded folder IDs per space persist across refresh
- [ ] Focus context (sidebar/spacesScreen) persists across refresh

### Phase 2: Navigation Store Persistence
- [ ] navigationUiStore uses zustand/persist middleware
- [ ] State syncs between App.tsx local state and store (single source of truth)

### Phase 3: Browser State Persistence (Future)
- [ ] Browser tabs persist across refresh
- [ ] Active browser tab URL persists
- [ ] Browser navigation history persists (requires main process changes)

### Non-Functional Requirements
- [ ] No existing functionality breaks
- [ ] State restoration is fast (<50ms)
- [ ] Invalid/corrupted localStorage is handled gracefully (fallback to defaults)
- [ ] State versioning for future migrations

## Technical Design

### Approach 1: Custom Hook with localStorage (Recommended for Phase 1)
```typescript
// packages/react-ui/src/hooks/usePersistedState.ts
function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T) => void]
```

### Approach 2: Zustand Persist Middleware (Phase 2)
```typescript
// packages/react-ui/src/stores/navigationUiStore.ts
import { persist } from 'zustand/middleware';

export const useNavigationUiStore = create(
  persist(
    (set) => ({ ... }),
    { name: 'spayce-navigation-ui' }
  )
);
```

### Storage Keys
| Key | Data |
|-----|------|
| `spayce:ui:sidebarMode` | 'fixed' \| 'floating' |
| `spayce:ui:sidebarVisible` | boolean |
| `spayce:ui:activeTab` | 'spaces' \| 'browser' \| ... |
| `spayce:ui:sidebarActiveSpaceIndex` | number |
| `spayce:ui:spacesScreenActiveSpaceIndex` | number |
| `spayce:ui:sidebarExpandedIds` | Record<spaceId, string[]> |
| `spayce:ui:focusContext` | 'sidebar' \| 'spacesScreen' |

### Serialization for Complex Types
- `sidebarExpandedIdsMap` (Map<string, Set<string>>) → JSON object with arrays
- Validate on load, fallback to empty Map on corruption

## Tasks

### TDD Implementation Order
1. [ ] Write tests for `usePersistedState` hook
2. [ ] Implement `usePersistedState` hook
3. [ ] Write tests for state restoration in App.tsx
4. [ ] Replace useState with usePersistedState for critical states
5. [ ] Write tests for edge cases (corrupted data, missing keys)
6. [ ] Implement graceful fallback handling
7. [ ] Write integration tests for full refresh cycle
8. [ ] Verify no regressions in existing functionality

## Files to Modify
- `packages/react-ui/src/hooks/usePersistedState.ts` (NEW)
- `packages/react-ui/src/hooks/index.ts` (export)
- `packages/desktop/src/renderer/App.tsx` (use persisted state)
- `packages/react-ui/src/stores/navigationUiStore.ts` (Phase 2)
- `packages/react-ui/__tests__/hooks/usePersistedState.test.ts` (NEW)

## Notes
- Use `localStorage` for renderer process (persists across sessions)
- Consider `sessionStorage` for states that should only persist within session
- Browser state persistence requires main process changes (Spec 019 extension)
- Ensure state versioning from day 1 for future migrations
