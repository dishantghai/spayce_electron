# Phase 6: Advanced Features (Stories)

> **Stories**: F002-F020
> **Goal**: Feature parity with Flutter Spayce browser
> **Estimated Sessions**: 4-6 Claude Opus 4.5 sessions
> **Prerequisites**: Phase 5 complete (Specs 029-031)

---

## Phase Overview

Phase 6 implements advanced browser features as individual stories. Each story is standalone but may depend on previous specs. These features complete the browser integration and achieve parity with the Flutter Spayce app.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 6 STORIES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Core UX Stories                    Integration Stories                      │
│  ┌─────────────────────────┐       ┌─────────────────────────┐              │
│  │ F002: Arc-style         │       │ F010: Workspace Tab     │              │
│  │       Fullscreen        │       │ F011: Tab Context Menu  │              │
│  │ F003: Link Preview      │       │ F012: New Tab Menu      │              │
│  │       Popup             │       │ F013: DevTools Toggle   │              │
│  │ F004: Keyboard Shortcuts│       │ F014: Find in Page      │              │
│  │ F005: Error View        │       └─────────────────────────┘              │
│  │ F006: Loading States    │                                                │
│  └─────────────────────────┘       Media & Downloads                        │
│                                    ┌─────────────────────────┐              │
│  Navigation Stories                │ F015: YouTube Support   │              │
│  ┌─────────────────────────┐       │ F016: Media Playback    │              │
│  │ F007: Favicon Caching   │       │ F017: Download Manager  │              │
│  │ F008: SSL/Security      │       │ F018: File Handling     │              │
│  │       Indicators        │       └─────────────────────────┘              │
│  │ F009: Page Zoom         │                                                │
│  └─────────────────────────┘       Future (Post-MVP)                        │
│                                    ┌─────────────────────────┐              │
│                                    │ F019: Ad Blocking       │              │
│                                    │ F020: Multiple Profiles │              │
│                                    └─────────────────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Story F002: Arc-style Fullscreen Mode

### User Story

As a user, I want to toggle fullscreen mode that hides the tab bar and navigation while staying within the app window, so I can focus on content without distractions.

### Acceptance Criteria

- [ ] Double-click on browser area toggles fullscreen
- [ ] Keyboard shortcut (Cmd+Shift+F) toggles fullscreen
- [ ] Fullscreen hides tab bar and navigation bar
- [ ] Mouse move to top reveals controls temporarily
- [ ] Escape key exits fullscreen
- [ ] Video fullscreen works within app window

### Technical Notes

```typescript
// State management
interface BrowserUiState {
  isFullscreen: boolean;
  isControlsVisible: boolean; // For mouse-reveal
  toggleFullscreen: () => void;
}

// In BrowserLayout.tsx
<div 
  className={styles.browserLayout}
  onMouseMove={handleMouseMove}
>
  {(!isFullscreen || isControlsVisible) && <TabBar />}
  {(!isFullscreen || isControlsVisible) && <NavigationBar />}
  <BrowserArea />
</div>
```

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/tabbed_browser_screen.dart`

Lines 139-186: Fullscreen state management and SafeArea handling

### Estimated Effort

1 Claude Opus session

---

## Story F003: Link Preview Popup

### User Story

As a user, when I click an external link, I want to see a preview popup with options to expand to new tab or navigate in current tab, similar to Arc browser.

### Acceptance Criteria

- [ ] External link clicks show preview popup
- [ ] Same-domain links navigate normally
- [ ] Popup shows link URL and destination domain
- [ ] "Open in New Tab" button creates new tab
- [ ] "Open Here" button navigates current tab
- [ ] Clicking outside dismisses popup
- [ ] CMD/CTRL+Click always opens new tab (no popup)

### Technical Notes

```typescript
// In BrowserService - inject JavaScript handler
view.webContents.on('did-finish-load', async () => {
  await view.webContents.executeJavaScript(`
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.href;
      const currentDomain = window.location.hostname;
      const linkDomain = new URL(href).hostname;
      
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        window.postMessage({ type: 'openInNewTab', url: href });
      } else if (currentDomain !== linkDomain) {
        e.preventDefault();
        window.postMessage({ type: 'showLinkPreview', url: href });
      }
    }, true);
  `);
});
```

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/widgets/link_preview_popup.dart`

Full file (278 lines) - Popup UI and logic

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/tabbed_browser_screen.dart`

Lines 544-603: JavaScript injection for link interception

### Estimated Effort

1-2 Claude Opus sessions

---

## Story F004: Keyboard Shortcuts

### User Story

As a power user, I want comprehensive keyboard shortcuts for browser navigation and tab management.

### Acceptance Criteria

| Shortcut | Action |
|----------|--------|
| Cmd+T | New tab |
| Cmd+W | Close current tab |
| Cmd+Shift+T | Reopen closed tab |
| Cmd+1-9 | Switch to tab N |
| Cmd+[ / Cmd+] | Navigate back/forward |
| Cmd+R | Reload |
| Cmd+L | Focus URL bar |
| Cmd+F | Find in page |
| Cmd+Shift+F | Toggle fullscreen |
| Cmd+Plus/Minus | Zoom in/out |
| Escape | Stop loading / Exit fullscreen |

### Technical Notes

```typescript
// Global keyboard handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;
    
    // Tab management
    if (isMod && e.key === 't') {
      e.preventDefault();
      createTab();
    } else if (isMod && e.key === 'w') {
      e.preventDefault();
      closeCurrentTab();
    } else if (isMod && e.shiftKey && e.key === 't') {
      e.preventDefault();
      reopenClosedTab();
    } else if (isMod && /^[1-9]$/.test(e.key)) {
      e.preventDefault();
      switchToTabIndex(parseInt(e.key) - 1);
    }
    // ... more shortcuts
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Estimated Effort

1 Claude Opus session

---

## Story F005: Error View with Retry

### User Story

As a user, when a page fails to load, I want to see a clear error message with options to retry or report the issue.

### Acceptance Criteria

- [ ] Network errors show appropriate message
- [ ] SSL errors show security warning
- [ ] 404 shows page not found message
- [ ] Retry button attempts to reload
- [ ] Error view follows design system
- [ ] Error type icon varies by error type

### Technical Notes

```typescript
// Error types from Flutter
enum BrowserErrorType {
  NetworkTimeout = 'networkTimeout',
  SslError = 'sslError',
  PageNotFound = 'pageNotFound',
  AuthenticationRequired = 'authenticationRequired',
  ResourceLoadFailure = 'resourceLoadFailure',
  MemoryError = 'memoryError',
  CrashFailure = 'crashFailure',
  InvalidUrl = 'invalidUrl',
  Unknown = 'unknown',
}

// User-friendly messages
const errorMessages: Record<BrowserErrorType, string> = {
  networkTimeout: "Page is taking too long to load. Check your connection.",
  sslError: "This site's security certificate is not trusted.",
  pageNotFound: "The page you're looking for doesn't exist.",
  // ... etc
};
```

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/widgets/browser_error_view.dart`

Full file - Error view component

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/domain/browser_state.dart`

Lines 44-117: BrowserError model and error types

### HiFi Design Reference

> **For Pixel-Perfect UI Implementation:**
>
> | Design | File Path |
> |--------|----------|
> | Browser View (Error States) | `.speky/design/screens/browser-view/Browser View.png` |
>
> **Key UI Elements to Match:**
> - Error view centered in browser area
> - Error icon sizing and colors by error type
> - Retry button styling per design system
> - Error message typography

### Estimated Effort

0.5 Claude Opus session

---

## Story F006: Loading States

### User Story

As a user, I want clear visual feedback when pages are loading, including progress indication and loading spinners.

### Acceptance Criteria

- [ ] Linear progress bar shows during load
- [ ] Progress percentage updates smoothly
- [ ] Tab shows spinner icon during load
- [ ] Indeterminate progress when percentage unknown
- [ ] Stop button appears during load
- [ ] Loading state clears on complete/error

### Technical Notes

Already partially implemented in Phase 1-2. This story ensures polish and edge case handling.

### HiFi Design Reference

> **For Pixel-Perfect UI Implementation:**
>
> | Design | File Path |
> |--------|----------|
> | Browser View (Loading Bar) | `.speky/design/screens/browser-view/Browser View.png` |
>
> **Key UI Elements to Match:**
> - Progress bar position: top of browser area, full width
> - Progress bar height: 2-3px
> - Progress bar color: `--color-primary` (#6D5AE6)
> - Loading spinner in tab: 16px, animated rotation
> - Stop button styling during load

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/tabbed_browser_screen.dart`

Lines 154-168: Loading progress indicator

### Estimated Effort

0.5 Claude Opus session

---

## Story F007: Favicon Caching

### User Story

As a user, I want favicons to load quickly from cache and persist across sessions.

### Acceptance Criteria

- [ ] Favicons cached locally
- [ ] Cache persists across app restarts
- [ ] Stale favicons refreshed on page visit
- [ ] Fallback icon for failed fetches
- [ ] Cache size limited (e.g., 100 favicons)

### Technical Notes

```typescript
// packages/infrastructure/src/services/FaviconCacheService.ts

interface CachedFavicon {
  url: string;
  dataUrl: string; // Base64 encoded
  fetchedAt: number;
}

class FaviconCacheService {
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  async getFavicon(pageUrl: string): Promise<string | null>;
  async cacheFavicon(pageUrl: string, faviconUrl: string): Promise<void>;
  async pruneCacheIfNeeded(): Promise<void>;
}
```

### Estimated Effort

0.5 Claude Opus session

---

## Story F008: SSL/Security Indicators

### User Story

As a user, I want to see security status of the current page in the URL bar.

### Acceptance Criteria

- [ ] HTTPS pages show lock icon (green)
- [ ] HTTP pages show warning icon
- [ ] Invalid SSL shows error icon (red)
- [ ] Clicking icon shows security details
- [ ] EV certificates show organization name (optional)

### Technical Notes

```typescript
// Security state from WebContentsView
view.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
  // Log/display certificate error
  this.mainWindow?.webContents.send('browser:security', {
    viewId: id,
    secure: false,
    error,
  });
  
  // Decide whether to proceed
  callback(false); // Don't proceed with invalid cert
});
```

### Estimated Effort

0.5 Claude Opus session

---

## Story F009: Page Zoom

### User Story

As a user, I want to zoom in/out on pages for better readability.

### Acceptance Criteria

- [ ] Cmd+Plus zooms in
- [ ] Cmd+Minus zooms out
- [ ] Cmd+0 resets to 100%
- [ ] Zoom level persists per domain
- [ ] Zoom indicator shows current level

### Technical Notes

```typescript
// Zoom control via WebContentsView
view.webContents.setZoomFactor(1.25); // 125%
view.webContents.getZoomFactor(); // Get current

// Store zoom per domain
const zoomSettings: Map<string, number> = new Map();
```

### Estimated Effort

0.5 Claude Opus session

---

## Story F010: Workspace Tab

### User Story

As a user, I want a dedicated "Workspace" tab in the browser tab bar that shows my Spaces without leaving the browser view.

### Acceptance Criteria

- [ ] Workspace tab pinned at left of tab bar
- [ ] Clicking shows Spaces view in browser area
- [ ] Regular tabs show web content
- [ ] Workspace tab has distinct styling
- [ ] Cannot close workspace tab

### Technical Notes

```tsx
// In TabBar.tsx
<div className={styles.tabBar}>
  {/* Fixed Workspace Tab */}
  <WorkspaceTab
    isActive={activeView === 'workspace'}
    onClick={() => setActiveView('workspace')}
  />
  
  {/* Divider */}
  <div className={styles.divider} />
  
  {/* New Tab Button */}
  <NewTabButton />
  
  {/* Browser Tabs */}
  <div className={styles.tabsContainer}>
    {tabs.map(tab => <TabItem key={tab.id} ... />)}
  </div>
</div>
```

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/tabbed_browser_screen.dart`

Lines 202-203: WorkspaceTab integration

### HiFi Design Reference

- `.speky/design/screens/workspace-view-in-browser/Workspace View in Browser.png`

### Estimated Effort

1 Claude Opus session

---

## Story F011: Tab Context Menu

### User Story

As a user, I want to right-click on tabs to access common actions like close, duplicate, pin, etc.

### Acceptance Criteria

- [ ] Right-click shows context menu
- [ ] Options: Close, Close Others, Close to Right, Duplicate, Pin, Reload
- [ ] Menu follows design system
- [ ] Actions work correctly
- [ ] Keyboard accessible (Shift+F10)

### Technical Notes

```tsx
const tabContextMenuItems = [
  { label: 'Close Tab', action: 'close', shortcut: '⌘W' },
  { label: 'Close Other Tabs', action: 'closeOthers' },
  { label: 'Close Tabs to the Right', action: 'closeToRight' },
  { type: 'separator' },
  { label: 'Duplicate Tab', action: 'duplicate' },
  { label: 'Pin Tab', action: 'pin' },
  { type: 'separator' },
  { label: 'Reload', action: 'reload', shortcut: '⌘R' },
];
```

### HiFi Design Reference

> **For Pixel-Perfect UI Implementation:**
>
> | Design | File Path |
> |--------|----------|
> | Browser Tab Bar (Context Menu) | `.speky/design/screens/browser-tab-bar/Browser Tab Bar.png` |
>
> **Key UI Elements to Match:**
> - Context menu styling per design system
> - Menu item padding and typography
> - Separator styling
> - Keyboard shortcut display alignment

### Estimated Effort

0.5 Claude Opus session

---

## Story F012: New Tab Menu

### User Story

As a user, when I create a new tab, I want to see a clean new tab page with quick access options.

### Acceptance Criteria

- [ ] New tab shows clean start page
- [ ] Search bar prominently displayed
- [ ] Quick links to recent/frequent pages
- [ ] Spaces shortcuts (optional)
- [ ] Follows design system dark theme

### Technical Notes

```tsx
// NewTabPage.tsx
function NewTabPage() {
  const { recentItems } = useRecentItems();
  const { frequentItems } = useFrequentItems();
  
  return (
    <div className={styles.newTabPage}>
      <SearchBar autoFocus />
      
      <section className={styles.quickLinks}>
        <h3>Recent</h3>
        {recentItems.map(item => <QuickLink key={item.id} item={item} />)}
      </section>
      
      <section className={styles.quickLinks}>
        <h3>Frequently Visited</h3>
        {frequentItems.map(item => <QuickLink key={item.id} item={item} />)}
      </section>
    </div>
  );
}
```

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/widgets/new_tab_menu.dart`

Full file - New tab menu component

### HiFi Design Reference

> **For Pixel-Perfect UI Implementation:**
>
> | Design | File Path |
> |--------|----------|
> | Browser Tab Bar (New Tab) | `.speky/design/screens/browser-tab-bar/Browser Tab Bar.png` |
>
> **Key UI Elements to Match:**
> - New tab page background: `--color-bg-dark`
> - Search bar centered, large, with focus state
> - Quick links grid layout and card styling
> - Section headers typography
> - Favicon thumbnails for quick links

### Estimated Effort

1 Claude Opus session

---

## Story F013: DevTools Toggle

### User Story

As a developer, I want to toggle DevTools for the active browser tab for debugging purposes.

### Acceptance Criteria

- [ ] Cmd+Option+I toggles DevTools
- [ ] DevTools opens in separate window
- [ ] DevTools state persists for session
- [ ] Menu option to toggle DevTools

### Technical Notes

```typescript
// In BrowserService
toggleDevTools(viewId: string): void {
  const view = this.views.get(viewId);
  if (!view) return;
  
  if (view.webContents.isDevToolsOpened()) {
    view.webContents.closeDevTools();
  } else {
    view.webContents.openDevTools({ mode: 'detach' });
  }
}
```

### Estimated Effort

0.25 Claude Opus session

---

## Story F014: Find in Page

### User Story

As a user, I want to search for text within the current page.

### Acceptance Criteria

- [ ] Cmd+F opens find bar
- [ ] Type to search, matches highlighted
- [ ] Show match count (e.g., "3 of 12")
- [ ] Enter/Shift+Enter for next/previous
- [ ] Escape closes find bar
- [ ] Case sensitivity toggle (optional)

### Technical Notes

```typescript
// Using Electron's findInPage API
view.webContents.findInPage(text, { forward: true });
view.webContents.stopFindInPage('clearSelection');

view.webContents.on('found-in-page', (event, result) => {
  // result.matches - total matches
  // result.activeMatchOrdinal - current match index
});
```

### Estimated Effort

0.5 Claude Opus session

---

## Story F015: YouTube Support

### User Story

As a user, I want YouTube videos to play correctly with full controls and picture-in-picture support.

### Acceptance Criteria

- [ ] YouTube videos play inline
- [ ] Video controls work (play/pause/seek)
- [ ] Fullscreen video works
- [ ] Picture-in-picture support
- [ ] Audio continues in background tab

### Technical Notes

YouTube should work out of the box with proper WebContentsView settings. Key settings:

```typescript
const view = new WebContentsView({
  webPreferences: {
    // ... other settings
    autoplayPolicy: 'no-user-gesture-required', // For YouTube
    backgroundThrottling: false, // Keep audio in background
  },
});
```

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/browser_screen.dart`

Lines 225-235: Media playback settings

### Estimated Effort

0.25 Claude Opus session (mostly verification)

---

## Story F016: Media Playback Controls

### User Story

As a user, I want media (audio/video) to work correctly across all sites with proper controls.

### Acceptance Criteria

- [ ] HTML5 video plays correctly
- [ ] Audio plays correctly
- [ ] Media continues in background tabs
- [ ] System media controls work (optional)

### Technical Notes

Most media should work with default settings. May need to handle specific codecs or DRM.

### Estimated Effort

0.25 Claude Opus session (mostly verification)

---

## Story F017: Download Manager

### User Story

As a user, I want to download files from websites with progress tracking and easy access to downloaded files.

### Acceptance Criteria

- [ ] Downloads start automatically for file links
- [ ] Show download progress
- [ ] Notification on download complete
- [ ] Access downloads folder easily
- [ ] Cancel/pause downloads

### Technical Notes

```typescript
// Handle downloads in main process
view.webContents.session.on('will-download', (event, item, webContents) => {
  const savePath = path.join(app.getPath('downloads'), item.getFilename());
  item.setSavePath(savePath);
  
  item.on('updated', (event, state) => {
    if (state === 'progressing') {
      const progress = item.getReceivedBytes() / item.getTotalBytes();
      // Send progress to renderer
    }
  });
  
  item.on('done', (event, state) => {
    if (state === 'completed') {
      // Notify completion
    }
  });
});
```

### Estimated Effort

1 Claude Opus session

---

## Story F018: File/Protocol Handling

### User Story

As a user, I want external links (mailto:, tel:, etc.) to open in appropriate system apps.

### Acceptance Criteria

- [ ] mailto: links open email client
- [ ] tel: links open phone app (if available)
- [ ] Custom protocols prompt before opening
- [ ] file:// links blocked for security

### Technical Notes

```typescript
// Handle external protocols
view.webContents.setWindowOpenHandler(({ url }) => {
  const protocol = new URL(url).protocol;
  
  if (['mailto:', 'tel:'].includes(protocol)) {
    shell.openExternal(url);
    return { action: 'deny' };
  }
  
  if (protocol === 'file:') {
    return { action: 'deny' };
  }
  
  return { action: 'allow' };
});
```

### Estimated Effort

0.5 Claude Opus session

---

## Story F019: Ad Blocking (Future)

### User Story

As a user, I want optional ad blocking for a cleaner browsing experience.

### Acceptance Criteria

- [ ] Toggle ad blocking on/off
- [ ] Uses @cliqz/adblocker-electron
- [ ] Filter lists configurable
- [ ] Per-site whitelist
- [ ] Stats on blocked items

### Technical Notes

```typescript
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import fetch from 'cross-fetch';

const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
blocker.enableBlockingInSession(session.defaultSession);
```

### Estimated Effort

1-2 Claude Opus sessions

**Note**: This is marked as future/post-MVP and depends on tech decisions approval.

---

## Story F020: Multiple Browser Profiles (Future)

### User Story

As a user, I want separate browser profiles with isolated cookies, history, and settings.

### Acceptance Criteria

- [ ] Create/delete profiles
- [ ] Switch between profiles
- [ ] Each profile has separate session
- [ ] Profile-specific settings

### Technical Notes

```typescript
// Create separate session per profile
const profileSession = session.fromPartition(`persist:profile-${profileId}`);

new WebContentsView({
  webPreferences: {
    session: profileSession,
  },
});
```

### Estimated Effort

2-3 Claude Opus sessions

**Note**: This is marked as future/post-MVP due to complexity.

---

## Phase 6 Story Priority Matrix

| Story | Priority | Effort | Dependencies |
|-------|----------|--------|--------------|
| F002: Arc Fullscreen | P1 | 1 session | Phase 5 |
| F003: Link Preview | P1 | 1.5 sessions | Phase 4 |
| F004: Keyboard Shortcuts | P0 | 1 session | Phase 3 |
| F005: Error View | P0 | 0.5 session | Phase 1 |
| F006: Loading States | P0 | 0.5 session | Phase 1 |
| F007: Favicon Cache | P1 | 0.5 session | Phase 2 |
| F008: Security Indicators | P1 | 0.5 session | Phase 3 |
| F009: Page Zoom | P2 | 0.5 session | Phase 3 |
| F010: Workspace Tab | P1 | 1 session | Phase 2 |
| F011: Tab Context Menu | P1 | 0.5 session | Phase 2 |
| F012: New Tab Menu | P2 | 1 session | Phase 2 |
| F013: DevTools | P2 | 0.25 session | Phase 1 |
| F014: Find in Page | P1 | 0.5 session | Phase 3 |
| F015: YouTube | P1 | 0.25 session | Phase 1 |
| F016: Media Playback | P1 | 0.25 session | Phase 1 |
| F017: Download Manager | P2 | 1 session | Phase 1 |
| F018: Protocol Handling | P1 | 0.5 session | Phase 1 |
| F019: Ad Blocking | P3 (Future) | 1.5 sessions | Phase 5 |
| F020: Multiple Profiles | P3 (Future) | 2.5 sessions | Phase 5 |

### Recommended Implementation Order

1. **Sprint 1**: F004, F005, F006 (Essential UX)
2. **Sprint 2**: F015, F016, F018 (Media & Protocols)
3. **Sprint 3**: F007, F008, F014 (Navigation Polish)
4. **Sprint 4**: F002, F003 (Arc-style Features)
5. **Sprint 5**: F010, F011, F012 (Tab Bar Features)
6. **Sprint 6**: F009, F013, F017 (Nice-to-Have)
7. **Future**: F019, F020 (Post-MVP)

---

## Phase 6 Completion Checklist

- [ ] All P0 stories complete
- [ ] All P1 stories complete
- [ ] P2 stories prioritized and complete
- [ ] Feature parity with Flutter Spayce browser
- [ ] All keyboard shortcuts working
- [ ] Error states handled gracefully
- [ ] Media playback working
- [ ] Performance targets met
