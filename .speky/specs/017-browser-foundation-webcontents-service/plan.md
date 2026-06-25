# Implementation Plan: Browser Foundation - WebContentsView Service (017)

## Phase 1: Service Foundation (Day 1)

### 1.1 Type Definitions
- [ ] Create `packages/desktop/src/types/browser.ts` with all interface definitions
- [ ] Define ViewBounds, BrowserViewState, CreateViewOptions
- [ ] Define IPC event payload types
- [ ] Define BrowserIPCResponse wrapper type
- [ ] Update `packages/desktop/src/types/index.ts` to export browser types

### 1.2 Error Classes
- [ ] Create `packages/desktop/src/main/services/errors/BrowserErrors.ts`
- [ ] Implement BrowserError base class
- [ ] Implement ViewNotFoundError
- [ ] Implement InvalidURLError
- [ ] Implement NavigationError
- [ ] Implement ServiceNotInitializedError

### 1.3 BrowserService Core
- [ ] Create `packages/desktop/src/main/services/BrowserService.ts`
- [ ] Implement singleton pattern with getBrowserService()
- [ ] Implement initialize() with main window binding
- [ ] Implement private ensureInitialized() guard
- [ ] Set up cleanup on window close

## Phase 2: View Management (Day 1-2)

### 2.1 View Creation
- [ ] Implement createView() with secure WebContentsView configuration
- [ ] Configure nodeIntegration: false
- [ ] Configure contextIsolation: true
- [ ] Configure sandbox: true
- [ ] Set Safari macOS user agent
- [ ] Store view in Map with ID

### 2.2 View Lifecycle
- [ ] Implement getView() for view retrieval
- [ ] Implement destroyView() with proper cleanup
- [ ] Remove all webContents event listeners on destroy
- [ ] Close webContents on destroy
- [ ] Implement destroyAllViews() for shutdown
- [ ] Implement getViewCount()

### 2.3 Active View Management
- [ ] Implement setActiveView() with window content management
- [ ] Remove previous active view from contentView
- [ ] Add new active view to contentView
- [ ] Apply current bounds to active view
- [ ] Implement getActiveViewId()

### 2.4 Bounds Management
- [ ] Implement setBounds() with validation
- [ ] Validate positive width/height
- [ ] Round bounds to integers
- [ ] Store current bounds for new views
- [ ] Apply bounds to active view

## Phase 3: Navigation (Day 2)

### 3.1 URL Validation
- [ ] Implement validateAndNormalizeUrl() private method
- [ ] Block javascript: scheme
- [ ] Block data:text/html scheme
- [ ] Block vbscript: scheme
- [ ] Add https:// to bare domains
- [ ] Convert search queries to Google search URL
- [ ] Validate URL structure with URL constructor

### 3.2 Navigation Commands
- [ ] Implement loadURL() with validation
- [ ] Implement loadURLInternal() for internal use
- [ ] Implement goBack() with canGoBack check
- [ ] Implement goForward() with canGoForward check
- [ ] Implement reload()
- [ ] Implement stop()

### 3.3 State Query
- [ ] Implement getViewState() returning BrowserViewState
- [ ] Include URL, title, loading state
- [ ] Include canGoBack, canGoForward
- [ ] Include isSecure (https check)
- [ ] Implement setViewVisibility()

## Phase 4: Event Forwarding (Day 2)

### 4.1 Event Listeners Setup
- [ ] Implement setupEventListeners() private method
- [ ] Add did-start-loading listener → browser:loading
- [ ] Add did-stop-loading listener → browser:loading
- [ ] Add did-navigate listener → browser:navigated
- [ ] Add did-navigate-in-page listener → browser:navigated
- [ ] Add page-title-updated listener → browser:title
- [ ] Add page-favicon-updated listener → browser:favicon
- [ ] Add did-fail-load listener → browser:error (main frame only)

### 4.2 Security Event Handlers
- [ ] Add certificate-error handler with logging
- [ ] Implement setWindowOpenHandler to block popups
- [ ] Load popup URLs in current view instead
- [ ] Implement setPermissionRequestHandler with allowlist

### 4.3 IPC Forwarding
- [ ] Implement sendToRenderer() private method
- [ ] Check mainWindow is not destroyed before sending
- [ ] Type-safe event payload forwarding

## Phase 5: IPC Handlers (Day 2-3)

### 5.1 Handler Registration
- [ ] Create `packages/desktop/src/main/ipc/browserHandlers.ts`
- [ ] Implement registerBrowserHandlers(mainWindow)
- [ ] Initialize BrowserService with mainWindow
- [ ] Register browser:createView handler
- [ ] Register browser:destroyView handler
- [ ] Register browser:setActiveView handler
- [ ] Register browser:getActiveViewId handler
- [ ] Register browser:setBounds handler
- [ ] Register browser:loadURL handler
- [ ] Register browser:goBack handler
- [ ] Register browser:goForward handler
- [ ] Register browser:reload handler
- [ ] Register browser:stop handler
- [ ] Register browser:getViewState handler
- [ ] Register browser:setVisibility handler
- [ ] Register browser:getViewCount handler

### 5.2 Response Format
- [ ] All handlers return { success: boolean, error?: string, ...data }
- [ ] Wrap handler logic in try/catch
- [ ] Log errors with context

### 5.3 Handler Cleanup
- [ ] Implement unregisterBrowserHandlers() for testing
- [ ] Remove all IPC handlers

## Phase 6: Integration & Testing (Day 3)

### 6.1 Main Process Integration
- [ ] Update `packages/desktop/src/main/index.ts`
- [ ] Import registerBrowserHandlers
- [ ] Call registerBrowserHandlers after window creation
- [ ] Export from barrel files

### 6.2 Unit Tests
- [ ] Create `packages/desktop/__tests__/services/BrowserService.test.ts`
- [ ] Test URL validation (all cases)
- [ ] Test view creation with secure defaults
- [ ] Test view destruction and cleanup
- [ ] Test active view management
- [ ] Test bounds validation

### 6.3 Integration Tests
- [ ] Create `packages/desktop/__tests__/integration/browser.integration.test.ts`
- [ ] Test end-to-end view creation and navigation
- [ ] Test event forwarding
- [ ] Test IPC handler responses

### 6.4 Documentation
- [ ] Update tech_decisions.md with browser service decisions
- [ ] Add inline code documentation
- [ ] Document public API

## Verification Checklist

### Security
- [ ] nodeIntegration: false verified
- [ ] contextIsolation: true verified
- [ ] sandbox: true verified
- [ ] URL scheme blocking verified
- [ ] Permission allowlist verified

### Performance
- [ ] View creation <50ms (measure with Performance.now())
- [ ] Navigation response <100ms (measure IPC round-trip)
- [ ] No memory leaks (heap snapshot before/after)

### Functionality
- [ ] View creates and loads URL
- [ ] Navigation commands work
- [ ] Events forward to renderer
- [ ] Bounds update correctly
- [ ] Cleanup on destroy works

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] No console errors in normal operation
- [ ] Consistent error handling
