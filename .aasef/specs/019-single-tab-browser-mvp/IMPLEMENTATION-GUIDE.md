# Implementation Guide: Spec 019 - Single Tab Browser MVP

## How to Use This Guide

This guide provides step-by-step instructions for implementing the single-tab browser MVP.
Read this file first, then follow the phases in order.

---

## Quick Reference

| Document | Consult When... |
|----------|----------------|
| spec.md | Always - primary requirements |
| plan.md | Starting each phase |
| accessibility-review.md | Building UI components (BrowserLoadingBar, BrowserErrorOverlay) |
| status.json | Checking dependencies |
| HiFi Design | Styling the browser area |

### External References
- **HiFi Design**: `project_ops/HIFI_UI_DESIGN_SCREENS/Browser View.png`
- **Flutter Reference**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/browser_screen.dart`

---

## Phase 1: Preload API Extension (Day 1 Morning)

### Read First
1. `spec.md` - Section R1 (Preload API)
2. Existing file: `packages/desktop/src/preload/index.ts`

### Implement

```typescript
// packages/desktop/src/preload/index.ts

// From spec.md R1.1: Add browser API to existing preload
const browserAPI = {
  // Navigation (from spec.md R1.1)
  loadURL: (id: string, url: string) => 
    ipcRenderer.invoke('browser:loadURL', id, url),
  goBack: (id: string) => 
    ipcRenderer.invoke('browser:goBack', id),
  goForward: (id: string) => 
    ipcRenderer.invoke('browser:goForward', id),
  reload: (id: string) => 
    ipcRenderer.invoke('browser:reload', id),
  stop: (id: string) => 
    ipcRenderer.invoke('browser:stop', id),
  
  // View management (from spec.md R1.2)
  createView: (id: string, url?: string) => 
    ipcRenderer.invoke('browser:createView', id, url),
  destroyView: (id: string) => 
    ipcRenderer.invoke('browser:destroyView', id),
  setActiveView: (id: string) => 
    ipcRenderer.invoke('browser:setActiveView', id),
  setBounds: (bounds: { x: number; y: number; width: number; height: number }) => 
    ipcRenderer.invoke('browser:setBounds', bounds),
  
  // Event subscriptions (from spec.md R1.3)
  onStateChange: (callback: (state: BrowserViewState) => void) => {
    const handler = (_: IpcRendererEvent, state: BrowserViewState) => callback(state);
    ipcRenderer.on('browser:state-changed', handler);
    return () => ipcRenderer.removeListener('browser:state-changed', handler);
  },
  onError: (callback: (error: BrowserError) => void) => {
    const handler = (_: IpcRendererEvent, error: BrowserError) => callback(error);
    ipcRenderer.on('browser:error', handler);
    return () => ipcRenderer.removeListener('browser:error', handler);
  },
};

// Add to contextBridge exposure
contextBridge.exposeInMainWorld('electronAPI', {
  ...existingAPI,
  browser: browserAPI,
});
```

### Type Definitions

```typescript
// packages/desktop/src/preload/types.ts

// From spec.md R1.4: Type definitions
export interface BrowserViewState {
  viewId: string;
  url: string;
  title: string;
  isLoading: boolean;
  loadingProgress: number;
  canGoBack: boolean;
  canGoForward: boolean;
  isSecure: boolean;
  faviconUrl: string | null;
}

export interface BrowserError {
  viewId: string;
  errorCode: number;
  errorDescription: string;
  validatedURL: string;
}

// Extend ElectronAPI interface
declare global {
  interface Window {
    electronAPI: {
      // ... existing
      browser: typeof browserAPI;
    };
  }
}
```

### Verify
- [ ] `pnpm build` succeeds in desktop package
- [ ] TypeScript recognizes `window.electronAPI.browser`
- [ ] All methods from spec.md R1 exposed

---

## Phase 2: Browser UI Store (Day 1 Afternoon)

### Read First
1. `spec.md` - Section R2 (Browser UI Store)
2. Existing store pattern: `packages/react-ui/src/stores/`

### Implement

```typescript
// packages/react-ui/src/stores/browserUiStore.ts

import { create } from 'zustand';

// From spec.md R2.1: State interface
interface BrowserUiState {
  // Current view state
  activeViewId: string | null;
  viewStates: Map<string, BrowserViewState>;
  
  // Loading state
  isLoading: boolean;
  loadingProgress: number;
  
  // Error state
  currentError: BrowserError | null;
  
  // Navigation state (synced from main process)
  canGoBack: boolean;
  canGoForward: boolean;
}

// From spec.md R2.2: Actions
interface BrowserUiActions {
  // State updates (from IPC events)
  updateViewState: (state: BrowserViewState) => void;
  setError: (error: BrowserError | null) => void;
  clearError: () => void;
  
  // View management
  setActiveView: (viewId: string) => void;
  
  // IPC subscriptions
  subscribeToEvents: () => () => void;
}

// From spec.md R2.3: Store implementation
export const useBrowserUiStore = create<BrowserUiState & BrowserUiActions>((set, get) => ({
  // Initial state
  activeViewId: null,
  viewStates: new Map(),
  isLoading: false,
  loadingProgress: 0,
  currentError: null,
  canGoBack: false,
  canGoForward: false,

  // Actions
  updateViewState: (state) => {
    set((prev) => {
      const newStates = new Map(prev.viewStates);
      newStates.set(state.viewId, state);
      
      // Update derived state if this is the active view
      if (state.viewId === prev.activeViewId) {
        return {
          viewStates: newStates,
          isLoading: state.isLoading,
          loadingProgress: state.loadingProgress,
          canGoBack: state.canGoBack,
          canGoForward: state.canGoForward,
        };
      }
      
      return { viewStates: newStates };
    });
  },

  setError: (error) => set({ currentError: error }),
  clearError: () => set({ currentError: null }),
  setActiveView: (viewId) => set({ activeViewId: viewId }),

  // From spec.md R2.4: IPC subscription
  subscribeToEvents: () => {
    const unsubState = window.electronAPI.browser.onStateChange((state) => {
      get().updateViewState(state);
    });
    
    const unsubError = window.electronAPI.browser.onError((error) => {
      get().setError(error);
    });
    
    return () => {
      unsubState();
      unsubError();
    };
  },
}));
```

### Verify
- [ ] Store follows existing Zustand patterns
- [ ] IPC subscriptions clean up properly
- [ ] State updates are immutable
- [ ] TypeScript types are complete

---

## Phase 3: BrowserLoadingBar Component (Day 2 Morning)

### Read First
1. `spec.md` - Section R3 (BrowserLoadingBar)
2. `accessibility-review.md` - BrowserLoadingBar section
3. HiFi Design for visual reference

### Implement

```tsx
// packages/react-ui/src/components/browser/BrowserLoadingBar.tsx

import styles from './BrowserLoadingBar.module.css';

// From spec.md R3.1: Props interface
interface BrowserLoadingBarProps {
  progress: number;  // 0-1
  isVisible?: boolean;
}

// From spec.md R3.2: Component implementation
export function BrowserLoadingBar({ progress, isVisible = true }: BrowserLoadingBarProps) {
  if (!isVisible || progress >= 1) {
    return null;
  }

  const percentage = Math.round(progress * 100);
  const isIndeterminate = progress === 0;

  return (
    <div
      className={styles.container}
      // From accessibility-review.md: ARIA attributes
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading progress"
      aria-busy={progress < 1}
    >
      <div
        className={`${styles.progress} ${isIndeterminate ? styles.indeterminate : ''}`}
        style={isIndeterminate ? undefined : { width: `${percentage}%` }}
      />
    </div>
  );
}
```

```css
/* packages/react-ui/src/components/browser/BrowserLoadingBar.module.css */

/* From spec.md R3.3: Styling */
.container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  z-index: 100;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: var(--color-primary, #6D5AE6);
  transition: width 150ms ease-out;
}

/* From accessibility-review.md: Indeterminate animation */
.indeterminate {
  width: 30%;
  animation: indeterminate 1.5s ease-in-out infinite;
}

@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

/* From accessibility-review.md: Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .progress {
    transition: none;
  }
  .indeterminate {
    animation: none;
    width: 100%;
    opacity: 0.5;
  }
}
```

### Verify
- [ ] Progress bar animates smoothly
- [ ] Indeterminate state works when progress is 0
- [ ] Bar disappears when progress >= 1
- [ ] ARIA attributes from accessibility-review.md applied
- [ ] Reduced motion support works

---

## Phase 4: BrowserErrorOverlay Component (Day 2 Afternoon)

### Read First
1. `spec.md` - Section R4 (BrowserErrorOverlay)
2. `accessibility-review.md` - BrowserErrorOverlay section
3. Flutter reference: `browser_screen.dart` error handling

### Implement

```tsx
// packages/react-ui/src/components/browser/BrowserErrorOverlay.tsx

import styles from './BrowserErrorOverlay.module.css';
import { AlertCircle } from 'lucide-react';

// From spec.md R4.1: Props interface
interface BrowserErrorOverlayProps {
  errorCode: number;
  errorDescription: string;
  url: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

// From spec.md R4.2: Error message mapping
function getErrorMessage(errorCode: number, errorDescription: string): {
  title: string;
  message: string;
  canRetry: boolean;
} {
  // From Flutter reference: Error handling patterns
  switch (errorCode) {
    case -105: // ERR_NAME_NOT_RESOLVED
      return {
        title: "Can't reach this page",
        message: "The server couldn't be found. Check your internet connection.",
        canRetry: true,
      };
    case -106: // ERR_INTERNET_DISCONNECTED
      return {
        title: 'No internet connection',
        message: 'Check your network settings and try again.',
        canRetry: true,
      };
    case -118: // ERR_CONNECTION_TIMED_OUT
      return {
        title: 'Connection timed out',
        message: 'The page took too long to respond.',
        canRetry: true,
      };
    case -501: // ERR_INSECURE_RESPONSE
      return {
        title: 'Connection not secure',
        message: 'This site may be unsafe.',
        canRetry: false,
      };
    default:
      return {
        title: 'Something went wrong',
        message: errorDescription || 'An unexpected error occurred.',
        canRetry: true,
      };
  }
}

// From spec.md R4.3: Component implementation
export function BrowserErrorOverlay({
  errorCode,
  errorDescription,
  url,
  onRetry,
  onGoHome,
}: BrowserErrorOverlayProps) {
  const { title, message, canRetry } = getErrorMessage(errorCode, errorDescription);

  return (
    <div
      className={styles.overlay}
      // From accessibility-review.md: ARIA attributes
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className={styles.content}>
        <AlertCircle className={styles.icon} size={48} />
        <h2 id="error-title" className={styles.title}>{title}</h2>
        <p className={styles.message} aria-describedby="error-title">{message}</p>
        <p className={styles.url}>{url}</p>
        
        <div className={styles.actions}>
          {canRetry && onRetry && (
            <button
              className={styles.primaryButton}
              onClick={onRetry}
              aria-label="Retry loading the page"
            >
              Try again
            </button>
          )}
          {onGoHome && (
            <button
              className={styles.secondaryButton}
              onClick={onGoHome}
              aria-label="Navigate to Google homepage"
            >
              Go to Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

```css
/* packages/react-ui/src/components/browser/BrowserErrorOverlay.module.css */

/* From spec.md R4.4 + HiFi design: Styling */
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background, #0F0B1A);
  z-index: 50;
}

.content {
  text-align: center;
  max-width: 400px;
  padding: var(--spacing-xl, 32px);
}

.icon {
  color: var(--color-text-secondary, #9CA3AF);
  margin-bottom: var(--spacing-md, 16px);
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: var(--spacing-sm, 8px);
}

.message {
  color: var(--color-text-secondary, #9CA3AF);
  margin-bottom: var(--spacing-sm, 8px);
}

.url {
  font-size: 0.875rem;
  color: var(--color-text-tertiary, #6B7280);
  word-break: break-all;
  margin-bottom: var(--spacing-lg, 24px);
}

.actions {
  display: flex;
  gap: var(--spacing-sm, 8px);
  justify-content: center;
}

.primaryButton {
  background: var(--color-primary, #6D5AE6);
  color: white;
  padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
  border-radius: var(--radius-md, 8px);
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.primaryButton:hover {
  background: var(--color-primary-hover, #5B4ACF);
}

.secondaryButton {
  background: var(--color-surface, #1A1425);
  color: var(--color-text-secondary, #9CA3AF);
  padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--color-border, #2D2640);
  cursor: pointer;
}

.secondaryButton:hover {
  background: var(--color-surface-hover, #252033);
}

/* From accessibility-review.md: High contrast mode */
@media (forced-colors: active) {
  .primaryButton,
  .secondaryButton {
    border: 2px solid ButtonText;
  }
}
```

### Verify
- [ ] Error codes map to user-friendly messages
- [ ] ARIA attributes from accessibility-review.md applied
- [ ] Buttons have proper aria-labels
- [ ] High contrast mode support works
- [ ] Styling matches HiFi design

---

## Phase 5: BrowserArea Component (Day 3 Morning)

### Read First
1. `spec.md` - Section R5 (BrowserArea)
2. Layout integration requirements

### Implement

```tsx
// packages/react-ui/src/components/browser/BrowserArea.tsx

import { useEffect, useRef, useCallback } from 'react';
import { useBrowserUiStore } from '../../stores/browserUiStore';
import { BrowserLoadingBar } from './BrowserLoadingBar';
import { BrowserErrorOverlay } from './BrowserErrorOverlay';
import styles from './BrowserArea.module.css';

// From spec.md R5.1: Props interface
interface BrowserAreaProps {
  sidebarWidth: number;
}

// From spec.md R5.2: Component implementation
export function BrowserArea({ sidebarWidth }: BrowserAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    activeViewId,
    isLoading,
    loadingProgress,
    currentError,
    clearError,
    subscribeToEvents,
  } = useBrowserUiStore();

  // From spec.md R5.3: Initialize browser view on mount
  useEffect(() => {
    const initBrowser = async () => {
      // Create default view
      const viewId = 'main-view';
      await window.electronAPI.browser.createView(viewId, 'https://www.google.com');
      await window.electronAPI.browser.setActiveView(viewId);
      useBrowserUiStore.getState().setActiveView(viewId);
    };

    initBrowser();

    // Subscribe to IPC events
    const unsubscribe = subscribeToEvents();

    return () => {
      unsubscribe();
      if (activeViewId) {
        window.electronAPI.browser.destroyView(activeViewId);
      }
    };
  }, []);

  // From spec.md R5.4: Update bounds on resize
  useEffect(() => {
    const updateBounds = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      window.electronAPI.browser.setBounds({
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    // Initial bounds
    updateBounds();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateBounds);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [sidebarWidth]);

  // From spec.md R5.5: Error handling callbacks
  const handleRetry = useCallback(() => {
    if (activeViewId) {
      clearError();
      window.electronAPI.browser.reload(activeViewId);
    }
  }, [activeViewId, clearError]);

  const handleGoHome = useCallback(() => {
    if (activeViewId) {
      clearError();
      window.electronAPI.browser.loadURL(activeViewId, 'https://www.google.com');
    }
  }, [activeViewId, clearError]);

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Loading indicator */}
      <BrowserLoadingBar
        progress={loadingProgress}
        isVisible={isLoading}
      />

      {/* Error overlay */}
      {currentError && (
        <BrowserErrorOverlay
          errorCode={currentError.errorCode}
          errorDescription={currentError.errorDescription}
          url={currentError.validatedURL}
          onRetry={handleRetry}
          onGoHome={handleGoHome}
        />
      )}

      {/* WebContentsView renders here via Electron - this is just the container */}
    </div>
  );
}
```

```css
/* packages/react-ui/src/components/browser/BrowserArea.module.css */

.container {
  position: relative;
  flex: 1;
  background: var(--color-background, #0F0B1A);
  overflow: hidden;
}
```

### Verify
- [ ] Browser view initializes on mount
- [ ] Bounds update on resize (uses ResizeObserver)
- [ ] Loading bar shows during page load
- [ ] Error overlay shows on error
- [ ] Cleanup happens on unmount

---

## Phase 6: Barrel Exports & Layout Integration (Day 3 Afternoon)

### Read First
1. `spec.md` - File Structure section
2. Existing layout: `packages/react-ui/src/App.tsx`

### Implement

```typescript
// packages/react-ui/src/components/browser/index.ts

export { BrowserArea } from './BrowserArea';
export { BrowserLoadingBar } from './BrowserLoadingBar';
export { BrowserErrorOverlay } from './BrowserErrorOverlay';

// Re-export types if needed
export type { BrowserViewState, BrowserError } from './types';
```

```tsx
// Integration in layout (example - actual file may differ)
// packages/react-ui/src/App.tsx

import { BrowserArea } from './components/browser';
import { useSidebarStore } from './stores/sidebarStore';

function App() {
  const { width: sidebarWidth } = useSidebarStore();

  return (
    <div className="app-container">
      <Sidebar />
      <BrowserArea sidebarWidth={sidebarWidth} />
    </div>
  );
}
```

### Verify
- [ ] All components exported from barrel
- [ ] Layout integration works
- [ ] Sidebar and browser area coexist
- [ ] No layout conflicts

---

## Checklist Before Completion

### From spec.md Acceptance Criteria

**Preload API**
- [ ] All browser methods exposed via contextBridge
- [ ] Event subscriptions return cleanup functions
- [ ] Types are properly exported

**Browser UI Store**
- [ ] State updates from IPC events
- [ ] Error handling works
- [ ] Cleanup on unsubscribe

**BrowserLoadingBar**
- [ ] Progress animation smooth
- [ ] Indeterminate state works
- [ ] Hides when complete

**BrowserErrorOverlay**
- [ ] Error codes map to messages
- [ ] Retry button works
- [ ] Go home button works

**BrowserArea**
- [ ] View initializes on mount
- [ ] Bounds update on resize
- [ ] Components integrate correctly

### From accessibility-review.md

- [ ] BrowserLoadingBar has ARIA progressbar role
- [ ] BrowserErrorOverlay has ARIA alert role
- [ ] All buttons have aria-labels
- [ ] Reduced motion support
- [ ] High contrast mode support

---

## Common Patterns

### Pattern 1: IPC Event Subscription with Cleanup

```typescript
// Always return cleanup function
useEffect(() => {
  const unsubscribe = window.electronAPI.browser.onStateChange((state) => {
    // Handle state
  });
  
  return () => unsubscribe(); // Cleanup on unmount
}, []);
```

### Pattern 2: Bounds Update Throttling

```typescript
// Use ResizeObserver for efficient bounds updates
const resizeObserver = new ResizeObserver((entries) => {
  // ResizeObserver already debounces
  const rect = entries[0].contentRect;
  window.electronAPI.browser.setBounds({
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  });
});
```

### Pattern 3: Error Recovery

```typescript
const handleRetry = useCallback(() => {
  clearError(); // Clear error first
  window.electronAPI.browser.reload(activeViewId); // Then retry
}, [activeViewId, clearError]);
```
