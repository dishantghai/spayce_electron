# Implementation Plan: Single Tab Browser - MVP Prototype (019)

## Phase 1: Preload API Extension (Day 1)

### 1.1 Type Definitions
- [ ] Create `packages/desktop/src/preload/types.ts`
- [ ] Define BrowserAPI interface with all methods
- [ ] Define event payload interfaces (BrowserLoadingEvent, etc.)
- [ ] Define ElectronAPI interface extension
- [ ] Add global Window interface augmentation

### 1.2 Preload Implementation
- [ ] Update `packages/desktop/src/preload/index.ts`
- [ ] Implement browserAPI object with all methods:
  - [ ] createView, destroyView, setActiveView, getActiveViewId
  - [ ] setBounds
  - [ ] loadURL, goBack, goForward, reload, stop
  - [ ] getViewState, setVisibility, getViewCount
- [ ] Implement event listener methods with unsubscribe:
  - [ ] onLoading, onNavigated, onTitle
  - [ ] onFavicon, onProgress, onError
- [ ] Expose via contextBridge.exposeInMainWorld
- [ ] Test that window.electronAPI.browser is accessible

## Phase 2: Browser UI Store (Day 1)

### 2.1 Store Implementation
- [ ] Create `packages/react-ui/src/stores/browserUiStore.ts`
- [ ] Define BrowserViewUiState interface
- [ ] Define BrowserUiState interface
- [ ] Implement createDefaultViewState helper

### 2.2 Store State
- [ ] Implement activeViewId state
- [ ] Implement views Map<string, BrowserViewUiState>
- [ ] Implement isInitialized and initError
- [ ] Implement computed getters (activeView, isLoading, loadingProgress)

### 2.3 Store Actions
- [ ] Implement initialize() - creates first view
- [ ] Implement createView(url) - creates new view
- [ ] Implement destroyView(id) - destroys view
- [ ] Implement setActiveView(id) - switches active
- [ ] Implement loadURL(url) - navigates active view
- [ ] Implement goBack(), goForward(), reload(), stop()
- [ ] Implement updateBounds(bounds) - sends to main

### 2.4 Event Handlers
- [ ] Implement handleLoadingEvent(viewId, isLoading)
- [ ] Implement handleNavigatedEvent(viewId, url, ...)
- [ ] Implement handleTitleEvent(viewId, title)
- [ ] Implement handleFaviconEvent(viewId, faviconUrl)
- [ ] Implement handleProgressEvent(viewId, progress)
- [ ] Implement handleErrorEvent(viewId, code, desc)
- [ ] Implement clearError(viewId)

### 2.5 Event Subscriptions
- [ ] Implement initializeBrowserEventSubscriptions()
- [ ] Subscribe to all browser: events
- [ ] Return cleanup function
- [ ] Export from stores/index.ts

## Phase 3: Browser Components (Day 2)

### 3.1 BrowserLoadingBar Component
- [ ] Create `packages/react-ui/src/components/browser/BrowserLoadingBar.tsx`
- [ ] Accept progress (0-1) and optional height props
- [ ] Implement smooth progress animation
- [ ] Implement indeterminate animation when progress=0
- [ ] Implement fade out when progress reaches 1
- [ ] Create `BrowserLoadingBar.module.css`
- [ ] Use design system variables (--color-primary)

### 3.2 BrowserErrorOverlay Component
- [ ] Create `packages/react-ui/src/components/browser/BrowserErrorOverlay.tsx`
- [ ] Accept errorCode, errorDescription, url props
- [ ] Implement getUserMessage() for friendly messages
- [ ] Map common Chromium error codes to messages
- [ ] Implement handleRetry (calls reload)
- [ ] Implement handleGoHome (navigates to Google)
- [ ] Create `BrowserErrorOverlay.module.css`
- [ ] Style with design system tokens

### 3.3 BrowserArea Component
- [ ] Create `packages/react-ui/src/components/browser/BrowserArea.tsx`
- [ ] Accept sidebarWidth, topOffset, className props
- [ ] Use containerRef for bounds measurement
- [ ] Implement sendBounds() with requestAnimationFrame
- [ ] Initialize browser on mount (call store.initialize())
- [ ] Set up event subscriptions on mount
- [ ] Update bounds on resize (window + ResizeObserver)
- [ ] Update bounds when sidebar/topOffset changes
- [ ] Render initialization error state
- [ ] Render loading state during init
- [ ] Render BrowserLoadingBar when loading
- [ ] Render BrowserErrorOverlay on errors
- [ ] Render placeholder when no active view
- [ ] Create `BrowserArea.module.css`
- [ ] Style with design system tokens

### 3.4 Barrel Exports
- [ ] Create `packages/react-ui/src/components/browser/index.ts`
- [ ] Export all components and types
- [ ] Update `packages/react-ui/src/components/index.ts`
- [ ] Update `packages/react-ui/src/index.ts`

## Phase 4: Layout Integration (Day 2-3)

### 4.1 App Integration
- [ ] Update `packages/desktop/src/renderer/App.tsx`
- [ ] Import BrowserArea component
- [ ] Get sidebarWidth from navigation store
- [ ] Render BrowserArea with correct props
- [ ] Ensure correct z-index layering

### 4.2 Sidebar Coordination
- [ ] Ensure sidebar width changes update browser bounds
- [ ] Handle sidebar show/hide transitions
- [ ] No visual gaps between sidebar and browser

### 4.3 Window Resize
- [ ] Verify smooth resize at 60fps
- [ ] No tearing or lag during resize
- [ ] Bounds update correctly on all edges

## Phase 5: Testing (Day 3)

### 5.1 Unit Tests - Store
- [ ] Create `packages/react-ui/__tests__/stores/browserUiStore.test.ts`
- [ ] Test initial state
- [ ] Test initialize action
- [ ] Test view creation
- [ ] Test event handlers
- [ ] Test error handling

### 5.2 Unit Tests - Components
- [ ] Create `__tests__/components/browser/BrowserLoadingBar.test.tsx`
- [ ] Test progress rendering
- [ ] Test indeterminate state
- [ ] Test fade out behavior

- [ ] Create `__tests__/components/browser/BrowserErrorOverlay.test.tsx`
- [ ] Test error message mapping
- [ ] Test button actions

- [ ] Create `__tests__/components/browser/BrowserArea.test.tsx`
- [ ] Test loading state
- [ ] Test error state
- [ ] Test bounds calculation

### 5.3 Integration Tests
- [ ] Create browser UI integration test
- [ ] Test full initialization flow
- [ ] Test navigation
- [ ] Test error handling
- [ ] Test resize behavior

## Phase 6: Documentation & Cleanup (Day 3)

### 6.1 Documentation
- [ ] Add JSDoc comments to all public APIs
- [ ] Document store usage patterns
- [ ] Document component props

### 6.2 Code Quality
- [ ] Run TypeScript compiler (tsc --noEmit)
- [ ] Fix any type errors
- [ ] Run linter
- [ ] Fix any lint issues

### 6.3 Tech Decisions
- [ ] Update tech_decisions.md with Spec 019 decisions
- [ ] Document state management approach
- [ ] Document bounds calculation approach

## Verification Checklist

### Functionality
- [ ] Browser initializes on app start
- [ ] Default page (Google) loads
- [ ] Loading progress bar shows
- [ ] Page title updates
- [ ] Error overlay shows on load failure
- [ ] Retry button works
- [ ] Go home button works

### Layout
- [ ] Browser fills space beside sidebar
- [ ] Browser respects sidebar width
- [ ] No gaps or overlaps
- [ ] Smooth resize

### Performance
- [ ] Bounds update at 60fps
- [ ] No memory leaks
- [ ] No unnecessary re-renders
- [ ] Smooth animations

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] No console errors
- [ ] Design tokens used consistently

### Cross-Spec Integration
- [ ] Preload API works with BrowserService (017)
- [ ] Store state aligns with TabEntity (018)
- [ ] Layout integrates with sidebar (002)
