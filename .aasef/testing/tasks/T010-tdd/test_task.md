# TDD Test Task: Spec 010 - 010

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# Spec 010: React UI Integration

## Overview

Implement the Presentation layer React integration including custom data hooks, error boundaries, data invalidation system, and Zustand UI stores. This layer connects React components to the Application layer facades from Spec 009.

## Dependencies & Scope Coordination

**Dependencies:**
- **Spec 001**: Project foundation (React setup, design system tokens)
- **Spec 002**: Sidebar navigation (uses hooks for space data)
- **Spec 003**: Spaces module (uses hooks for space items)
- **Spec 007** (Core Domain Layer): Entity types for props
- **Spec 008**: Infrastructure Layer (service registry, ServiceBootstrap)
- **Spec 009**: Application Layer - **ALL FACADES MUST BE COMPLETE**:
  - SpacesFacade (registered in ServiceBootstrap)
  - SpaceItemsFacade (registered in ServiceBootstrap)
  - SearchFacade (registered in ServiceBootstrap)
  - All 15 use cases implemented

> [!IMPORTANT]
> Spec 009 must have all 3 facades implemented and registered before starting Spec 010.
> Hooks depend on facades being available via `serviceRegistry.get()`.

**Integration Points:**
- Consumes facades from Spec 009 via service registry
- Uses entity types from Spec 007 for component props
- Integrates with existing UI components from Specs 002, 003
- Uses design system tokens from Spec 001 for error UI
- Updates Electron main process to initialize services
- Updates App.tsx to use hooks instead of mock data

**This Spec Covers:**
- React hooks for data fetching (useSpaces, useSpaceItems, etc.)
- React hooks for mutations (useCreateSpace, useDeleteItem, etc.)
- Custom data invalidation system
- Error boundary components
- Form validation hooks
- Zustand UI stores (drag state, navigation state)
- Loading and error state patterns
- **Electron main process initialization (ServiceBootstrap)**
- **App.tsx integration with hooks (replacing mock data)**

## User Stories

### US-010-001: Data Fetching Hooks
- **As a developer**, I want simple hooks to fetch space data so that components remain clean
- **Acceptance Criteria:**
  - Given I call `useSpaces(profileId)`
  - Then I receive `{ data, loading, error, refetch }`
  - And loading is true while fetching
  - And errors are properly typed

### US-010-002: Mutation Hooks
- **As a developer**, I want mutation hooks so that I can create/update/delete with proper feedback
- **Acceptance Criteria:**
  - Given I call `useCreateSpace().mutate(input)`
  - Then the space is created
  - And relevant queries are invalidated
  - And loading state reflects operation status

### US-010-003: Error Boundaries
- **As a user**, I want the app to gracefully handle errors without crashing
- **Acceptance Criteria:**
  - Given a component throws an error
  - Then an error boundary catches it
  - And I see a friendly error message with retry option
  - And the rest of the app continues to work

### US-010-004: Form Validation
- **As a user**, I want immediate feedback when entering invalid data
- **Acceptance Criteria:**
  - Given I enter an empty space name
  - When I blur the input
  - Then I see a validation error message
  - And the submit button is disabled

## MVP Scope

### Included:
- Data fetching hooks (useSpaces, useSpaceItems, usePinnedItems, useRecentItems)
- Mutation hooks (useCreateSpace, useDeleteSpace, useCreateItem, etc.)
- Data invalidation system
- DomainErrorBoundary and GlobalErrorBoundary
- ErrorFallback component
- useFormValidation hook
- Zustand stores (dragDropStore, navigationStore)
- Loading skeleton patterns

### Excluded:
- Complex caching strategies
- Optimistic updates (future enhancement)
- Real-time subscriptions

## Out of Scope

- Server-side rendering
- Complex state synchronization
- External query libraries (react-query)

## Tech Decisions Update Required

After completing this spec, update `.aasef/context/tech_decisions.md` to add:

```markdown
## Clean Architecture - Presentation Layer

| Decision | Value | Rationale |
|----------|-------|-----------|
| Package Location | `packages/react-ui/` | UI-specific code |
| Data Fetching | Custom hooks with useState/useEffect | No external dependencies |
| State Management | Zustand (UI state only) | Consistent with existing |
| Error Boundaries | Class component pattern | React requirement |
| Form Validation | Custom useFormValidation hook | No form library needed |
| Invalidation | Custom invalidation context | Simple, predictable |
```

---

## Requirements

### R0: Spec 009 Facade Verification (PREREQUISITE)

Before starting Spec 010 implementation, verify these Spec 009 deliverables are complete:

#### 0.1 Facade Checklist

```bash
# Run this verification before starting Spec 010
pnpm test --filter @spayce/core -- application/facades

# All facades must be implemented and registered:
# - SpacesFacade: getSpaces, createSpace, deleteSpace, renameSpace, updateSpace, reorderSpaces
# - SpaceItemsFacade: getItems, createItem, deleteItem, moveItem, renameItem, reorderItems, pin/unpin
# - SearchFacade: searchItems, getRecentItems, getMostVisitedItems
```

#### 0.2 Service Registration Verification

```typescript
// Verify in ServiceBootstrap that facades are registered:
// packages/infrastructure/src/bootstrap/ServiceBootstrap.ts

export class ServiceBootstrap {
  static initialize(config: { databasePath: string }) {
    // ... database setup ...
    
    // These MUST exist:
    serviceRegistry.register(SERVICE_KEYS.SPACES_FACADE, new SpacesFacade(...));
    serviceRegistry.register(SERVICE_KEYS.SPACE_ITEMS_FACADE, new SpaceItemsFacade(...));
    serviceRegistry.register(SERVICE_KEYS.SEARCH_FACADE, new SearchFacade(...));
  }
}
```

> [!CAUTION]
> If facades are not complete, **STOP** and complete Spec 009 first.
> Hooks will crash with "Cannot read property of undefined" if facades are missing.

---

### R-MAIN: Electron Main Process Initialization

#### MAIN.1 Update Main Process Entry Point

Replace the existing SurrealDB initialization with ServiceBootstrap:

```typescript
// packages/desktop/src/main/index.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { ServiceBootstrap } from '@spayce/infrastructure';
import { createMainWindow } from './window';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

async function initialize() {
  try {
    // Get Electron userData directory for database
    const userDataPath = app.getPath('userData');
    const databasePath = path.join(userDataPath, 'spayce.sqlite');
    
    console.log('Initializing services with database:', databasePath);
    
    // Initialize Clean Architecture services
    await ServiceBootstrap.initialize({ databasePath });
    console.log('Service registry initialized');

    // Register IPC handlers for renderer communication
    registerIpcHandlers();

    // Create main window
    mainWindow = createMainWindow();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
}

app.whenReady().then(initialize);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});

export { mainWindow };
```

#### MAIN.2 First Launch Database Copy

On first launch, if Flutter database exists, copy it:

```typescript
// packages/desktop/src/main/database/firstLaunch.ts
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export async function copyFlutterDbIfNeeded(): Promise<string> {
  const userDataPath = app.getPath('userData');
  const electronDbPath = path.join(userDataPath, 'spayce.sqlite');
  
  // If Electron DB already exists, use it
  if (fs.existsSync(electronDbPath)) {
    return electronDbPath;
  }
  
  // Look for Flutter database
  const flutterPaths = [
    path.join(app.getPath('documents'), 'spaces.sqlite'),
    // macOS sandboxed location
    path.join(app.getPath('home'), 'Library/Containers/com.spayce.frontend/Data/Documents/spaces.sqlite'),
  ];
  
  for (const flutterPath of flutterPaths) {
    if (fs.existsSync(flutterPath)) {
      console.log('Copying Flutter database from:', flutterPath);
      fs.copyFileSync(flutterPath, electronDbPath);
      return electronDbPath;
    }
  }
  
  // No existing database - ServiceBootstrap will create one
  console.log('No existing database found, will create new one');
  return electronDbPath;
}
```

#### MAIN.3 Remove Legacy SurrealDB Code

```bash
# Files to DELETE:
rm -f packages/desktop/src/main/database/surrealdb.ts

# Update imports in any files that referenced surrealdb.ts
```

---

### R-APP: App.tsx Integration

#### APP.1 Remove Mock Data

Delete the DEMO_SPACES constant (~380 lines) from App.tsx:

```typescript
// DELETE ALL OF THIS (lines 14-387 in current App.tsx):
// const DEMO_SPACES: Space[] = [ ... ];
```

#### APP.2 Wrap App with InvalidationProvider

```typescript
// packages/desktop/src/renderer/App.tsx
import React from 'react';
import { InvalidationProvider } from '@spayce/react-ui';
import { AppContent } from './AppContent';

export function App(): React.ReactElement {
  return (
    <InvalidationProvider>
      <AppContent />
    </InvalidationProvider>
  );
}
```

#### APP.3 Create AppContent with Hook Integration

```typescript
// packages/desktop/src/renderer/AppContent.tsx
import React, { useState } from 'react';
import { useSpaces } from '@spayce/react-ui/hooks';
import { useCreateSpace, useDeleteSpace, useUpdateSpace, useReorderSpaces } from '@spayce/react-ui/hooks/mutations';
import { Sidebar, SpacesScreen, ContextMenu } from '@spayce/shared';
import type { Space, SpaceItem, SidebarMode, SidebarTabId } from '@spayce/shared';

const DEFAULT_PROFILE_ID = 'default-profile';
const DEFAULT_USER_ID = 'default-user';

export function AppContent(): React.ReactElement {
  // Fetch real data from database via hooks
  const { data: spaces, loading, error, refetch } = useSpaces(DEFAULT_PROFILE_ID);
  
  // Mutation hooks
  const { mutate: createSpace, loading: createLoading } = useCreateSpace();
  const { mutate: deleteSpace } = useDeleteSpace();
  const { mutate: updateSpace } = useUpdateSpace();
  const { mutate: reorderSpaces } = useReorderSpaces();
  
  // UI state
  const [sidebarActiveSpaceIndex, setSidebarActiveSpaceIndex] = useState(0);
  const [spacesScreenActiveSpaceIndex, setSpacesScreenActiveSpaceIndex] = useState(0);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('fixed');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTabId>('spaces');
  const [focusContext, setFocusContext] = useState<'sidebar' | 'spacesScreen'>('sidebar');
  const [contextMenu, setContextMenu] = useState<{
    item: SpaceItem;
    spaceId: string;
    position: { x: number; y: number };
  } | null>(null);

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0D0D0D' }}>
        <div>Loading spaces...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0D0D0D' }}>
        <div>
          <h2>Error loading spaces</h2>
          <p>{error.message}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      </div>
    );
  }

  const spaceData = spaces || [];

  // Handler implementations using mutation hooks
  const handleCreateSpace = async (spaceData: {
    name: string;
    iconName: string;
    accentColor: string;
  }) => {
    await createSpace({
      profileId: DEFAULT_PROFILE_ID,
      userId: DEFAULT_USER_ID,
      name: spaceData.name,
      iconName: spaceData.iconName,
      accentColor: spaceData.accentColor,
    });
    // Invalidation happens automatically in the hook
  };

  const handleUpdateSpace = async (space: Space, updates: {
    name: string;
    iconName: string;
    accentColor: string;
  }) => {
    await updateSpace({
      spaceId: space.id,
      profileId: DEFAULT_PROFILE_ID,
      ...updates,
    });
  };

  const handleReorderSpaces = async (oldIndex: number, newIndex: number) => {
    const newOrder = [...spaceData];
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);
    
    await reorderSpaces({
      profileId: DEFAULT_PROFILE_ID,
      spaceIds: newOrder.map(s => s.id),
    });
  };

  // ... rest of handlers follow same pattern ...

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#0D0D0D' }}>
      <Sidebar
        spaces={spaceData}
        activeSpaceIndex={sidebarActiveSpaceIndex}
        mode={sidebarMode}
        activeTab={activeTab}
        isVisible={sidebarVisible}
        hasFocus={focusContext === 'sidebar'}
        onSpaceSelect={setSidebarActiveSpaceIndex}
        onTabChange={setActiveTab}
        onCreateSpace={handleCreateSpace}
        onEditSpace={handleUpdateSpace}
        // ... other props ...
      />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'spaces' ? (
          <SpacesScreen
            spaces={spaceData}
            activeSpaceIndex={spacesScreenActiveSpaceIndex}
            hasFocus={focusContext === 'spacesScreen'}
            onSpaceSelect={setSpacesScreenActiveSpaceIndex}
            onReorderSpaces={handleReorderSpaces}
            // ... other props ...
          />
        ) : (
          <div>{/* Other tabs */}</div>
        )}
      </main>
    </div>
  );
}
```

#### APP.4 Wire All Mutation Handlers

All handlers must be updated to use mutation hooks:

| Handler | Hook | Invalidation Keys |
|---------|------|-------------------|
| `handleCreateSpace` | `useCreateSpace` | 'spaces' |
| `handleDeleteSpace` | `useDeleteSpace` | 'spaces', 'space-items:{spaceId}' |
| `handleUpdateSpace` | `useUpdateSpace` | 'spaces' |
| `handleReorderSpaces` | `useReorderSpaces` | 'spaces' |
| `handleCreateItem` | `useCreateItem` | 'space-items', 'space-items:{spaceId}' |
| `handleDeleteItem` | `useDeleteItem` | 'space-items', 'pins' |
| `handleMoveItem` | `useMoveItem` | 'space-items' |
| `handlePinItem` | `usePinItem` | 'pins' |
| `handleUnpinItem` | `useUnpinItem` | 'pins' |

---

### R1: Data Fetching Hooks

#### 1.1 Core Hook Pattern

```typescript
// packages/react-ui/src/hooks/common/useAsync.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseAsyncResult<T> extends AsyncState<T> {
  refetch: () => Promise<void>;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = []
): UseAsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null
  });
  
  const mountedRef = useRef(true);
  
  const execute = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await asyncFn();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState({ 
          data: null, 
          loading: false, 
          error: error instanceof Error ? error : new Error('Unknown error') 
        });
      }
    }
  }, dependencies);
  
  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => { mountedRef.current = false; };
  }, [execute]);
  
  return {
    ...state,
    refetch: execute
  };
}
```

#### 1.2 useSpaces Hook

```typescript
// packages/react-ui/src/hooks/useSpaces.ts
import { useState, useEffect, useCallback } from 'react';
import { SpaceEntity } from '@spayce/core/domain';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import { SpacesFacade } from '@spayce/core/application';
import { useInvalidation } from './common/useInvalidation';

export interface UseSpacesResult {
  data: SpaceEntity[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSpaces(profileId: string): UseSpacesResult {
  const [data, setData] = useState<SpaceEntity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { subscribe } = useInvalidation();
  
  const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
  
  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await facade.getSpaces(profileId);
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(new Error(result.error.message));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch spaces'));
    } finally {
      setLoading(false);
    }
  }, [profileId, facade]);
  
  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);
  
  // Subscribe to invalidation events
  useEffect(() => {
    const unsubscribe = subscribe('spaces', fetchSpaces);
    return unsubscribe;
  }, [subscribe, fetchSpaces]);
  
  return { data, loading, error, refetch: fetchSpaces };
}
```

#### 1.3 useSpaceItems Hook

```typescript
// packages/react-ui/src/hooks/useSpaceItems.ts
import { useState, useEffect, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import { SpaceItemsFacade, SpaceItemWithChildren } from '@spayce/core/application';
import { useInvalidation } from './common/useInvalidation';

export interface UseSpaceItemsResult {
  data: SpaceItemWithChildren[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSpaceItems(spaceId: string): UseSpaceItemsResult {
  const [data, setData] = useState<SpaceItemWithChildren[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { subscribe } = useInvalidation();
  
  const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
  
  const fetchItems = useCallback(async () => {
    if (!spaceId) {
      setData([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await facade.getItems(spaceId);
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(new Error(result.error.message));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch items'));
    } finally {
      setLoading(false);
    }
  }, [spaceId, facade]);
  
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  
  useEffect(() => {
    const unsubscribeSpace = subscribe(`space-items:${spaceId}`, fetchItems);
    const unsubscribeGlobal = subscribe('space-items', fetchItems);
    return () => {
      unsubscribeSpace();
      unsubscribeGlobal();
    };
  }, [subscribe, fetchItems, spaceId]);
  
  return { data, loading, error, refetch: fetchItems };
}
```

#### 1.4 usePinnedItems Hook

```typescript
// packages/react-ui/src/hooks/usePinnedItems.ts
import { useState, useEffect, useCallback } from 'react';
import { SpaceItemEntity } from '@spayce/core/domain';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import { ISpaceItemsRepository } from '@spayce/core/domain';
import { useInvalidation } from './common/useInvalidation';

export function usePinnedItems(spaceId: string) {
  const [data, setData] = useState<SpaceItemEntity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { subscribe } = useInvalidation();
  
  const repo = serviceRegistry.get<ISpaceItemsRepository>(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY);
  
  const fetchPinnedItems = useCallback(async () => {
    try {
      setLoading(true);
      const items = await repo.getPinnedItems(spaceId);
      setData(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pinned items'));
    } finally {
      setLoading(false);
    }
  }, [spaceId, repo]);
  
  useEffect(() => {
    fetchPinnedItems();
  }, [fetchPinnedItems]);
  
  useEffect(() => {
    return subscribe('pins', fetchPinnedItems);
  }, [subscribe, fetchPinnedItems]);
  
  return { data, loading, error, refetch: fetchPinnedItems };
}
```

---

### R2: Mutation Hooks

#### 2.1 useCreateSpace Hook

```typescript
// packages/react-ui/src/hooks/mutations/useCreateSpace.ts
import { useState, useCallback } from 'react';
import { SpaceEntity } from '@spayce/core/domain';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import { SpacesFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/useInvalidation';

export interface CreateSpaceInput {
  profileId: string;
  userId: string;
  name: string;
  iconName?: string;
  accentColor?: string;
}

export interface UseCreateSpaceResult {
  mutate: (input: CreateSpaceInput) => Promise<SpaceEntity | null>;
  loading: boolean;
  error: AppError | null;
  reset: () => void;
}

export function useCreateSpace(): UseCreateSpaceResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  
  const { invalidate } = useInvalidation();
  const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
  
  const mutate = useCallback(async (input: CreateSpaceInput): Promise<SpaceEntity | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await facade.createSpace(input);
      
      if (result.success) {
        invalidate('spaces');
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      const systemError: AppError = {
        type: 'system',
        message: err instanceof Error ? err.message : 'Failed to create space'
      };
      setError(systemError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [facade, invalidate]);
  
  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);
  
  return { mutate, loading, error, reset };
}
```

#### 2.2 useDeleteSpace Hook

```typescript
// packages/react-ui/src/hooks/mutations/useDeleteSpace.ts
import { useState, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import { SpacesFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/useInvalidation';

export function useDeleteSpace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  
  const { invalidate } = useInvalidation();
  const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
  
  const mutate = useCallback(async (spaceId: string, profileId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await facade.deleteSpace(spaceId, profileId);
      
      if (result.success) {
        invalidate('spaces');
        invalidate(`space-items:${spaceId}`);
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError({
        type: 'system',
        message: err instanceof Error ? err.message : 'Failed to delete space'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [facade, invalidate]);
  
  return { mutate, loading, error };
}
```

#### 2.3 useCreateItem Hook

```typescript
// packages/react-ui/src/hooks/mutations/useCreateItem.ts
import { useState, useCallback } from 'react';
import { SpaceItemEntity, SpaceItemType } from '@spayce/core/domain';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import { SpaceItemsFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/useInvalidation';

export interface CreateItemInput {
  spaceId: string;
  parentId?: string | null;
  name: string;
  path: string;
  type: SpaceItemType;
  faviconUrl?: string | null;
  description?: string | null;
}

export function useCreateItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  
  const { invalidate } = useInvalidation();
  const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
  
  const mutate = useCallback(async (input: CreateItemInput): Promise<SpaceItemEntity | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await facade.createItem(input);
      
      if (result.success) {
        invalidate(`space-items:${input.spaceId}`);
        invalidate('space-items');
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError({
        type: 'system',
        message: err instanceof Error ? err.message : 'Failed to create item'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [facade, invalidate]);
  
  return { mutate, loading, error };
}
```

---

### R3: Data Invalidation System

#### 3.1 Invalidation Context

```typescript
// packages/react-ui/src/hooks/common/InvalidationContext.tsx
import React, { createContext, useContext, useCallback, useRef } from 'react';

type InvalidationCallback = () => void | Promise<void>;

interface InvalidationContextValue {
  subscribe: (key: string, callback: InvalidationCallback) => () => void;
  invalidate: (key: string) => void;
}

const InvalidationContext = createContext<InvalidationContextValue | null>(null);

export function InvalidationProvider({ children }: { children: React.ReactNode }) {
  const subscribersRef = useRef<Map<string, Set<InvalidationCallback>>>(new Map());
  
  const subscribe = useCallback((key: string, callback: InvalidationCallback) => {
    if (!subscribersRef.current.has(key)) {
      subscribersRef.current.set(key, new Set());
    }
    subscribersRef.current.get(key)!.add(callback);
    
    return () => {
      subscribersRef.current.get(key)?.delete(callback);
    };
  }, []);
  
  const invalidate = useCallback((key: string) => {
    const callbacks = subscribersRef.current.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Invalidation callback error for key '${key}':`, error);
        }
      });
    }
  }, []);
  
  return (
    <InvalidationContext.Provider value={{ subscribe, invalidate }}>
      {children}
    </InvalidationContext.Provider>
  );
}

export function useInvalidation(): InvalidationContextValue {
  const context = useContext(InvalidationContext);
  if (!context) {
    throw new Error('useInvalidation must be used within InvalidationProvider');
  }
  return context;
}
```

---

### R4: Error Boundaries

#### 4.1 DomainErrorBoundary

```typescript
// packages/react-ui/src/components/error/DomainErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

export interface ErrorFallbackProps {
  error: Error | null;
  errorId: string | null;
  onRetry: () => void;
  onReload: () => void;
}

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class DomainErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}
```

#### 4.2 ErrorFallback Component

```typescript
// packages/react-ui/src/components/error/ErrorFallback.tsx
import React from 'react';
import { ErrorFallbackProps } from './DomainErrorBoundary';
import styles from './ErrorFallback.module.css';

export function ErrorFallback({ 
  error, 
  errorId, 
  onRetry, 
  onReload 
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h2 className={styles.title}>Something went wrong</h2>
        
        <p className={styles.message}>
          An unexpected error occurred. You can try to recover or reload the application.
        </p>

        {isDevelopment && error && (
          <div className={styles.errorDetails}>
            <p className={styles.errorMessage}>{error.message}</p>
            {errorId && (
              <p className={styles.errorId}>Error ID: {errorId}</p>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.buttonSecondary} onClick={onRetry}>
            Try Again
          </button>
          <button className={styles.buttonPrimary} onClick={onReload}>
            Reload App
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 4.3 ErrorFallback Styles

```css
/* packages/react-ui/src/components/error/ErrorFallback.module.css */
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--spacing-4);
}

.card {
  max-width: 28rem;
  width: 100%;
  padding: var(--spacing-6);
  text-align: center;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.iconContainer {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-4);
}

.icon {
  height: 3rem;
  width: 3rem;
  color: var(--color-destructive);
}

.title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-2);
  color: var(--color-text);
}

.message {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-6);
}

.errorDetails {
  margin-bottom: var(--spacing-6);
  padding: var(--spacing-3);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  text-align: left;
}

.errorMessage {
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  color: var(--color-destructive);
}

.errorId {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--spacing-1);
}

.actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: center;
}

.buttonPrimary,
.buttonSecondary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.15s ease;
}

.buttonPrimary {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border: none;
}

.buttonPrimary:hover {
  background: var(--color-primary-hover);
}

.buttonSecondary {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.buttonSecondary:hover {
  background: var(--color-surface-hover);
}
```

#### 4.4 GlobalErrorBoundary

```typescript
// packages/react-ui/src/components/error/GlobalErrorBoundary.tsx
import React from 'react';
import { DomainErrorBoundary } from './DomainErrorBoundary';

interface Props {
  children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: Props) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Global error:', error, errorInfo);
      // TODO: Send to error tracking service
    }
  };

  return (
    <DomainErrorBoundary onError={handleError}>
      {children}
    </DomainErrorBoundary>
  );
}
```

---

### R5: Form Validation Hook

#### 5.1 useFormValidation

```typescript
// packages/react-ui/src/hooks/useFormValidation.ts
import { useState, useCallback, useMemo } from 'react';
import { ValidationSchema, ValidationResult } from '@spayce/core/domain';

export interface FormValidationResult<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  setValue: (field: keyof T, value: unknown) => void;
  setFieldTouched: (field: keyof T) => void;
  validateField: (field: keyof T, value: unknown) => boolean;
  validateAll: () => boolean;
  reset: () => void;
}

export function useFormValidation<T>(
  validator: ValidationSchema<T>,
  initialValues: Partial<T> = {}
): FormValidationResult<T> {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const validateField = useCallback((field: keyof T, value: unknown): boolean => {
    const partialResult = validator.validatePartial({ [field]: value });
    const fieldErrors = partialResult.errors.filter(e => e.field === field);
    
    setErrors(prev => ({
      ...prev,
      [field as string]: fieldErrors.length > 0 ? fieldErrors[0].message : ''
    }));
    
    return fieldErrors.length === 0;
  }, [validator]);
  
  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (touched[field as string]) {
      validateField(field, value);
    }
  }, [validateField, touched]);
  
  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }));
    validateField(field, values[field]);
  }, [validateField, values]);
  
  const validateAll = useCallback((): boolean => {
    const result = validator.validate(values);
    
    if (!result.success) {
      const errorMap: Record<string, string> = {};
      result.errors.forEach(error => {
        if (error.field) {
          errorMap[error.field] = error.message;
        }
      });
      setErrors(errorMap);
      return false;
    }
    
    setErrors({});
    return true;
  }, [validator, values]);
  
  const isValid = useMemo(() => {
    const hasErrors = Object.values(errors).some(e => e !== '');
    const hasValues = Object.keys(values).length > 0;
    return hasValues && !hasErrors;
  }, [errors, values]);
  
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);
  
  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
    reset
  };
}
```

---

### R6: Zustand UI Stores

#### 6.1 Navigation UI Store

```typescript
// packages/react-ui/src/stores/navigationUiStore.ts
import { create } from 'zustand';

interface NavigationUiState {
  activeSpaceId: string | null;
  sidebarTab: 'spaces' | 'history' | 'search';
  sidebarMode: 'fixed' | 'floating';
  isSidebarOpen: boolean;
  
  setActiveSpace: (spaceId: string | null) => void;
  setSidebarTab: (tab: 'spaces' | 'history' | 'search') => void;
  setSidebarMode: (mode: 'fixed' | 'floating') => void;
  toggleSidebar: () => void;
}

export const useNavigationUiStore = create<NavigationUiState>((set) => ({
  activeSpaceId: null,
  sidebarTab: 'spaces',
  sidebarMode: 'fixed',
  isSidebarOpen: true,
  
  setActiveSpace: (spaceId) => set({ activeSpaceId: spaceId }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSidebarMode: (mode) => set({ sidebarMode: mode }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
```

#### 6.2 Drag Drop UI Store

```typescript
// packages/react-ui/src/stores/dragDropUiStore.ts
import { create } from 'zustand';

export type DropPosition = 'before' | 'after' | 'inside';

export interface DragData {
  type: 'space' | 'item';
  id: string;
  sourceSpaceId?: string;
  sourceParentId?: string | null;
}

interface DragDropUiState {
  isDragging: boolean;
  dragData: DragData | null;
  dropTargetId: string | null;
  dropPosition: DropPosition | null;
  expandedFolderId: string | null;
  flashItemId: string | null;
  
  startDrag: (data: DragData) => void;
  setDropTarget: (targetId: string | null, position: DropPosition | null) => void;
  endDrag: () => void;
  setExpandedFolder: (folderId: string | null) => void;
  setFlashItem: (itemId: string | null) => void;
}

export const useDragDropUiStore = create<DragDropUiState>((set) => ({
  isDragging: false,
  dragData: null,
  dropTargetId: null,
  dropPosition: null,
  expandedFolderId: null,
  flashItemId: null,
  
  startDrag: (data) => set({ 
    isDragging: true, 
    dragData: data,
    dropTargetId: null,
    dropPosition: null
  }),
  
  setDropTarget: (targetId, position) => set({ 
    dropTargetId: targetId, 
    dropPosition: position 
  }),
  
  endDrag: () => set({ 
    isDragging: false, 
    dragData: null,
    dropTargetId: null,
    dropPosition: null,
    expandedFolderId: null
  }),
  
  setExpandedFolder: (folderId) => set({ expandedFolderId: folderId }),
  
  setFlashItem: (itemId) => set({ flashItemId: itemId }),
}));
```

---

### R7: Loading States

#### 7.1 Loading Skeleton

```typescript
// packages/react-ui/src/components/common/Skeleton.tsx
import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = 'var(--radius-sm)',
  className 
}: SkeletonProps) {
  return (
    <div 
      className={`${styles.skeleton} ${className || ''}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
      }}
    />
  );
}
```

#### 7.2 Space List Skeleton

```typescript
// packages/react-ui/src/components/spaces/SpaceListSkeleton.tsx
import React from 'react';
import { Skeleton } from '../common/Skeleton';
import styles from './SpaceListSkeleton.module.css';

interface Props {
  count?: number;
}

export function SpaceListSkeleton({ count = 3 }: Props) {
  return (
    <div className={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.spaceItem}>
          <Skeleton width={20} height={20} borderRadius="var(--radius-sm)" />
          <Skeleton width="70%" height={16} />
        </div>
      ))}
    </div>
  );
}
```

---

### R8: Package Structure

```
packages/react-ui/
├── src/
│   ├── hooks/
│   │   ├── common/
│   │   │   ├── useAsync.ts
│   │   │   ├── useInvalidation.ts
│   │   │   ├── InvalidationContext.tsx
│   │   │   └── index.ts
│   │   ├── mutations/
│   │   │   ├── useCreateSpace.ts
│   │   │   ├── useDeleteSpace.ts
│   │   │   ├── useRenameSpace.ts
│   │   │   ├── useCreateItem.ts
│   │   │   ├── useDeleteItem.ts
│   │   │   ├── useMoveItem.ts
│   │   │   ├── usePinItem.ts
│   │   │   └── index.ts
│   │   ├── useSpaces.ts
│   │   ├── useSpaceItems.ts
│   │   ├── usePinnedItems.ts
│   │   ├── useRecentItems.ts
│   │   ├── useSearch.ts
│   │   ├── useFormValidation.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Skeleton.module.css
│   │   │   └── index.ts
│   │   ├── error/
│   │   │   ├── DomainErrorBoundary.tsx
│   │   │   ├── GlobalErrorBoundary.tsx
│   │   │   ├── ErrorFallback.tsx
│   │   │   ├── ErrorFallback.module.css
│   │   │   └── index.ts
│   │   ├── spaces/
│   │   │   ├── SpaceListSkeleton.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── stores/
│   │   ├── navigationUiStore.ts
│   │   ├── dragDropUiStore.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## Acceptance Criteria

### Spec 009 Prerequisite (BLOCKING)
- [ ] SpacesFacade is implemented and registered in ServiceBootstrap
- [ ] SpaceItemsFacade is implemented and registered in ServiceBootstrap
- [ ] SearchFacade is implemented and registered in ServiceBootstrap
- [ ] All 15 use cases are implemented (5 space, 7 item, 3 pin)
- [ ] Facade tests pass: `pnpm test --filter @spayce/core -- application/facades`

### Main Process Initialization
- [ ] `packages/desktop/src/main/index.ts` imports ServiceBootstrap
- [ ] ServiceBootstrap.initialize() called with correct database path
- [ ] Database path uses `app.getPath('userData')` for Electron
- [ ] SurrealDB code completely removed from main process
- [ ] First launch copies Flutter database if it exists
- [ ] Main process logs show "Service registry initialized"

### App.tsx Integration
- [ ] DEMO_SPACES constant removed from App.tsx (0 lines of mock data)
- [ ] App is wrapped with `<InvalidationProvider>`
- [ ] AppContent uses `useSpaces()` hook for data fetching
- [ ] Loading state shown while spaces are loading
- [ ] Error state shown if spaces fail to load
- [ ] All mutation handlers use mutation hooks (see table)
- [ ] No useState with mock data arrays remains

### Data Fetching Hooks
- [ ] `useSpaces(profileId)` returns `{ data, loading, error, refetch }`
- [ ] `useSpaceItems(spaceId)` returns tree-structured items
- [ ] `usePinnedItems(spaceId)` returns pinned items ordered by position
- [ ] Hooks automatically refetch when invalidation events fire
- [ ] Loading state is true during fetch
- [ ] Error state captures and surfaces API errors

### Mutation Hooks
- [ ] `useCreateSpace()` returns `{ mutate, loading, error, reset }`
- [ ] `useDeleteSpace()` invalidates space and item queries
- [ ] `useCreateItem()` invalidates relevant space item queries
- [ ] All mutations properly handle loading state
- [ ] All mutations capture and return typed errors
- [ ] Mutations trigger appropriate invalidation events

### Data Invalidation
- [ ] `InvalidationProvider` wraps App component
- [ ] `useInvalidation().subscribe()` returns unsubscribe function
- [ ] `useInvalidation().invalidate()` calls all subscribers for key
- [ ] Specific invalidation keys work (e.g., `space-items:spaceId`)
- [ ] Global invalidation keys work (e.g., `spaces`)

### Error Boundaries
- [ ] `DomainErrorBoundary` catches component errors
- [ ] Error state includes error, errorId, retry, reload
- [ ] `ErrorFallback` displays user-friendly message
- [ ] Development mode shows error details
- [ ] Production mode hides error details
- [ ] Retry button resets error state
- [ ] Reload button refreshes page
- [ ] `GlobalErrorBoundary` wraps entire app

### Form Validation
- [ ] `useFormValidation()` accepts validator and initial values
- [ ] `setValue()` updates values and validates if touched
- [ ] `setFieldTouched()` marks field touched and validates
- [ ] `validateAll()` validates entire form
- [ ] `isValid` computed correctly from errors and values
- [ ] `reset()` restores initial state

### UI Stores
- [ ] `useNavigationUiStore` manages activeSpaceId, sidebar state
- [ ] `useDragDropUiStore` manages drag state, drop target, flash
- [ ] Both stores are Zustand-based with proper actions
- [ ] Stores contain only UI state, not business data

### Loading States
- [ ] `Skeleton` component renders animated placeholder
- [ ] `SpaceListSkeleton` shows appropriate loading UI
- [ ] Skeletons use design system tokens

### End-to-End Integration
- [ ] Package builds successfully
- [ ] All hooks work when mounted in React app
- [ ] Error boundaries work in component tree
- [ ] Invalidation system triggers refetches
- [ ] App launches and displays real data from database
- [ ] Create space works and persists to database
- [ ] Delete space works and removes from database
- [ ] Reorder spaces works via drag and drop

## Dependencies

- 001 (project-foundation)
- 007-core-domain-layer
- 008 (infrastructure-layer)
- 009 (application-layer) - **ALL FACADES MUST BE COMPLETE**

## Estimated Duration
4-5 days (expanded to include main process and App.tsx integration)

## Related Specs
- **Spec 009**: Provides facades consumed by hooks - **MUST BE FULLY COMPLETE**
- **Spec 002**: Sidebar uses these hooks for data
- **Spec 003**: Spaces module uses these hooks
- **Spec 011**: Verification of end-to-end integration



## Acceptance Criteria to Cover

1. [ ] Given I call `useSpaces(profileId)`
2. [ ] Then I receive `{ data, loading, error, refetch }`
3. [ ] And loading is true while fetching
4. [ ] And errors are properly typed

## Tech Stack

```json
Not specified
```

## Required Test Files

- Create in appropriate test directory

## Test Requirements

### For Each Acceptance Criterion

Create tests that:
1. **Test the happy path** - Normal expected behavior
2. **Test edge cases** - Boundary conditions, empty inputs
3. **Test error handling** - Invalid inputs, network failures
4. **Use appropriate mocking** - Don't hit real APIs/databases

### Test Structure

```
describe('Feature: 010')
  describe('AC1: [Acceptance Criterion 1]')
    test('should [expected behavior]')
    test('should handle [edge case]')
    test('should throw error when [error condition]')
  
  describe('AC2: [Acceptance Criterion 2]')
    ...
```

## Guidelines

1. **Tests MUST FAIL initially** - We haven't implemented yet!
2. Follow existing test patterns in the codebase
3. Use the project's testing frameworks
4. Ensure tests are deterministic (no flaky tests)
5. Add appropriate setup/teardown
6. Use descriptive test names
7. Group related tests logically

## After Creating Tests

1. **Link tests to spec**: `aasef test link <test-file> --spec 010`
2. **Run RED phase**: `aasef test tdd-red 010`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
