# Browser Integration Implementation Overview

> **Document Version**: 1.0
> **Created**: January 29, 2026
> **Purpose**: Comprehensive overview of browser integration implementation plan

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Feature Reference from Flutter Spayce](#feature-reference-from-flutter-spayce)
3. [Implementation Phases](#implementation-phases)
4. [Spec & Story Structure](#spec--story-structure)
5. [Technical Architecture](#technical-architecture)
6. [UI/UX Design Reference](#uiux-design-reference)
7. [Success Criteria](#success-criteria)

---

## Vision & Goals

### Product Vision

Transform Spayce Electron from a workspace/bookmark manager into a **full-featured integrated browser** that seamlessly connects web browsing with content organization. Users should be able to:

1. **Browse the web** without leaving Spayce
2. **Save pages to Spaces** with one click
3. **Track which tabs** came from which Space items
4. **Maintain context** as they navigate between learning resources

### Key Goals

| Goal | Description | Success Metric |
|------|-------------|----------------|
| **Seamless Browsing** | Full web compatibility | 99%+ sites work correctly |
| **Tab Management** | Multi-tab with persistence | Session survives restart |
| **Spaces Integration** | Two-way link between tabs and items | Tab shows origin, item shows active |
| **Performance** | Responsive UI, managed memory | <500ms tab switch, <1GB for 10 tabs |
| **Feature Parity** | Match Flutter Spayce browser | All features ported |

---

## Feature Reference from Flutter Spayce

### Browser Features to Port

The existing Flutter Spayce app (`/Users/Shared/ALL WORKSPACE/projects/spayce`) has these browser features that must be implemented in Electron:

#### Core Browser (from `browser_screen.dart`)
- [x] Single-tab web browsing with WebView
- [x] Navigation controls (back, forward, refresh, URL bar)
- [x] URL validation with search fallback to Google
- [x] Loading progress indicator
- [x] Error handling with retry mechanisms
- [x] "Add to Space" button
- [x] Security indicator (HTTPS lock icon)
- [x] Arc-style fullscreen (hide chrome, stay in app window)
- [x] YouTube/media playback support
- [x] Cloudflare/bot detection bypass

#### Multi-Tab (from `tabbed_browser_screen.dart`, `tab_manager.dart`)
- [x] Multiple browser tabs
- [x] Tab bar with drag-and-drop reordering
- [x] Tab create/close/switch
- [x] Tab persistence across sessions
- [x] Tab limit management (max 20, LRU eviction)
- [x] Inactive tab timeout (30 days)
- [x] Workspace tab integration

#### Tab-Space Integration (from `tab_model.dart`)
- [x] Origin tracking (which Space item opened this tab)
- [x] URL tracking (detect navigation away from origin)
- [x] Duplicate tab detection (by Space item ID and URL)
- [x] Space item highlighting for active tab

#### Link Handling (from `link_preview_popup.dart`)
- [x] CMD/CTRL+Click to open in new tab
- [x] Regular click shows Arc-style popup for external links
- [x] Same-domain links navigate normally
- [x] Link preview with expand option

#### Browser Widgets (from `widgets/`)
- [x] Browser navigation bar
- [x] Browser error view
- [x] Link preview popup
- [x] New tab menu
- [x] Tab bar component

---

## Implementation Phases

### Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BROWSER INTEGRATION PHASES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: Foundation          PHASE 2: Multi-Tab         PHASE 3: Navigation│
│  ┌─────────────────────┐     ┌─────────────────────┐     ┌────────────────┐ │
│  │ Spec 017: WebContents│     │ Spec 020: Tab Bar   │     │ Spec 023: Nav  │ │
│  │ Spec 018: Tab Domain │     │ Spec 021: Tab CRUD  │     │ Spec 024: URL  │ │
│  │ Spec 019: Single Tab │     │ Spec 022: Tab State │     │ Spec 025: Hist │ │
│  └─────────────────────┘     └─────────────────────┘     └────────────────┘ │
│           │                           │                          │          │
│           ▼                           ▼                          ▼          │
│  PHASE 4: Integration        PHASE 5: Polish           PHASE 6: Advanced    │
│  ┌─────────────────────┐     ┌─────────────────────┐     ┌────────────────┐ │
│  │ Spec 026: Tab-Space │     │ Spec 029: Session   │     │ Stories:       │ │
│  │ Spec 027: Add2Space │     │ Spec 030: Hibernate │     │ F002-F020      │ │
│  │ Spec 028: Link Click│     │ Spec 031: Perf      │     │ (Features)     │ │
│  └─────────────────────┘     └─────────────────────┘     └────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase Details

#### Phase 1: Foundation (Specs 017-019)
**Goal**: Establish core browser infrastructure

| Spec | Title | Complexity | Sessions |
|------|-------|------------|----------|
| 017 | Browser Foundation - WebContentsView Service | High | 2 |
| 018 | Browser Domain Layer - Tab Entities | Medium | 1 |
| 019 | Single Tab Browser - MVP Prototype | Medium | 1-2 |

**Deliverables**:
- WebContentsView management in main process
- Tab entity, repository interfaces in @spayce/core
- Basic IPC handlers for browser operations
- Single working browser view

#### Phase 2: Multi-Tab (Specs 020-022)
**Goal**: Full multi-tab browser functionality

| Spec | Title | Complexity | Sessions |
|------|-------|------------|----------|
| 020 | Tab Bar UI Component | Medium | 1-2 |
| 021 | Tab CRUD Operations | Medium | 1 |
| 022 | Tab State Management | Medium | 1 |

**Deliverables**:
- Tab bar component with drag-and-drop
- Create/close/switch tab operations
- Tab state store (Zustand)
- IndexedStack-style tab switching

#### Phase 3: Navigation (Specs 023-025)
**Goal**: Complete navigation experience

| Spec | Title | Complexity | Sessions |
|------|-------|------------|----------|
| 023 | Navigation Bar Component | Medium | 1 |
| 024 | URL Bar with Validation | Medium | 1 |
| 025 | History Management | Medium | 1 |

**Deliverables**:
- Back/forward/refresh controls
- URL input with validation and search fallback
- Navigation history per tab
- Security indicator

#### Phase 4: Integration (Specs 026-028)
**Goal**: Spaces-browser deep integration

| Spec | Title | Complexity | Sessions |
|------|-------|------------|----------|
| 026 | Tab-Space Origin Tracking | Medium | 1 |
| 027 | Add to Space Flow | Medium | 1 |
| 028 | Link Click Handling | Medium | 1 |

**Deliverables**:
- Tab origin tracking (Space item → Tab)
- "Add to Space" dialog and flow
- Item click opens/switches to tab
- Space item highlighting for active tab

#### Phase 5: Polish (Specs 029-031)
**Goal**: Production-ready browser

| Spec | Title | Complexity | Sessions |
|------|-------|------------|----------|
| 029 | Session Persistence | Medium | 1 |
| 030 | Tab Hibernation | High | 1-2 |
| 031 | Performance Optimization | Medium | 1 |

**Deliverables**:
- Tab session saves/restores on restart
- Inactive tab memory management
- Optimized rendering and IPC

#### Phase 6: Advanced Features (Stories F002-F020)
**Goal**: Feature parity with Flutter Spayce

Stories for advanced features (detailed in separate documents):
- F002: Arc-style Fullscreen Mode
- F003: Link Preview Popup
- F004: Keyboard Shortcuts
- F005: Tab Context Menu
- F006: New Tab Menu
- F007: Error View with Retry
- F008: Loading States
- F009: Favicon Management
- F010: YouTube/Media Support
- F011-F020: Additional features

---

## Spec & Story Structure

### AASEF Compliance

All specs and stories follow AASEF methodology:

```
.aasef/specs/017-browser-foundation/
├── spec.md           # Requirements and scope
├── plan.md           # Implementation steps
└── status.json       # Priority, dependencies, status

.aasef/stories/F002-arc-fullscreen/
├── story.md          # Story definition
└── status.json       # Related specs, affected files
```

### Spec Template

```markdown
# Spec XXX: [Title]

## Overview
Brief description of the spec's purpose and goals.

## Requirements

### Functional Requirements
- FR-1: ...
- FR-2: ...

### Non-Functional Requirements
- NFR-1: Performance...
- NFR-2: Security...

## Technical Design

### Architecture
Diagrams and component relationships.

### Data Models
Entity definitions and schemas.

### IPC Channels
New channels required.

## Implementation Steps
1. Step 1...
2. Step 2...

## Acceptance Criteria
- [ ] Criterion 1...
- [ ] Criterion 2...

## Dependencies
- Depends on: Spec XXX
- Blocks: Spec YYY

## References
- Flutter source: `path/to/file.dart`
- HiFi design: `path/to/design.png`
```

### Story Template

```markdown
# Story FXXX: [Title]

## Overview
User story description.

## User Story
As a [user], I want [feature] so that [benefit].

## Acceptance Criteria
- [ ] AC-1: ...
- [ ] AC-2: ...

## Technical Notes
Implementation considerations.

## UI Reference
Links to Flutter implementation and HiFi designs.

## Related Specs
- Spec XXX: Foundation

## Affected Files
- packages/desktop/src/...
- packages/react-ui/src/...
```

---

## Technical Architecture

### Browser Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ELECTRON MAIN PROCESS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    BrowserService (Singleton)                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │   │
│  │  │ WebContentsView │  │ WebContentsView │  │ WebContentsView │      │   │
│  │  │    Manager      │  │    Pool         │  │    Lifecycle    │      │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│  ┌──────────────────────────────────┼──────────────────────────────────┐   │
│  │                    TabService                                        │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │   │
│  │  │ Tab Repository  │  │ Session Manager │  │ History Manager │      │   │
│  │  │ (SQLite)        │  │                 │  │                 │      │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                    IPC                                       │
│                                     │                                        │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼───────────────────────────────────────┐
│                           RENDERER PROCESS                                   │
├─────────────────────────────────────┼───────────────────────────────────────┤
│                                     │                                        │
│  ┌──────────────────────────────────┴──────────────────────────────────┐   │
│  │                    Browser UI (React)                                │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │ TabBar      │  │ NavBar      │  │ BrowserArea │                 │   │
│  │  │ Component   │  │ Component   │  │ (Placeholder│                 │   │
│  │  └─────────────┘  └─────────────┘  │ for Views)  │                 │   │
│  │                                     └─────────────┘                 │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    tabStore (Zustand)                        │   │   │
│  │  │  tabs[], activeTabId, actions (create, close, switch, etc)  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **WebContentsView over BrowserView**: Use Electron 30+ WebContentsView API (not deprecated BrowserView)

2. **Views in Main Process**: WebContentsView instances managed in main process, not renderer

3. **Bounds Coordination**: Renderer sends layout bounds via IPC, main process positions views

4. **Tab State Split**:
   - UI state (tabs list, activeTabId) → Zustand in renderer
   - Persistence (session restore) → SQLite via main process

5. **IPC Patterns**:
   - `invoke/handle` for request-response (navigation, create tab)
   - `send/on` for events (tab state changes, loading progress)

---

## UI/UX Design Reference

### HiFi Designs Available

From `project_ops/HIFI_UI_DESIGN_SCREENS/`:

| Design | Description | Relevant Specs |
|--------|-------------|----------------|
| `Browser Tab Bar.png` | Tab bar design | Spec 020 |
| `Browser View.png` | Full browser layout | Specs 019, 023 |
| `Workspace View in Browser.png` | Workspace tab | Story F015 |

### Design System Compliance

All browser UI must use tokens from `@spayce/react-ui/theme`:

```typescript
// Colors
SpayceColors.backgroundDark  // #0F0B1A - Browser area background
SpayceColors.surfaceDark     // #1A1628 - Nav bar background
SpayceColors.sidebarDark     // #131020 - Tab bar background
SpayceColors.primary         // #6D5AE6 - Active tab indicator
SpayceColors.textPrimary     // #E5E7EB - Tab titles
SpayceColors.textMuted       // #6B7280 - URL text

// Spacing
SpayceSpacing.sm             // 8px - Tab padding
SpayceSpacing.md             // 16px - Nav bar padding

// Animations
SpayceAnimations.hover       // 150ms - Tab hover
SpayceAnimations.expand      // 200ms - Tab switch

// Radius
SpayceRadius.md              // 8px - Tab corners
SpayceRadius.lg              // 12px - URL bar corners
```

---

## Success Criteria

### Phase Completion Criteria

| Phase | Criteria |
|-------|----------|
| Phase 1 | Single tab loads URLs, navigates, shows in app |
| Phase 2 | Can create, switch, close tabs; tab bar works |
| Phase 3 | URL bar works, navigation buttons work |
| Phase 4 | Space items open tabs, "Add to Space" works |
| Phase 5 | Session restores on restart, memory managed |
| Phase 6 | All Flutter features ported |

### Overall Success Criteria

- [ ] Can browse to any website
- [ ] Tabs persist across app restarts
- [ ] Space items open corresponding tabs
- [ ] Can save current page to a Space
- [ ] Memory usage stays under 1GB with 10 active tabs
- [ ] Tab switch completes in <500ms
- [ ] All HiFi designs implemented
- [ ] All Flutter browser features ported

---

## File Index

This implementation plan consists of:

1. `00-READINESS-ASSESSMENT.md` - Architecture readiness (this assessment)
2. `01-IMPLEMENTATION-OVERVIEW.md` - This overview document
3. `02-PHASE1-FOUNDATION.md` - Specs 017-019 details
4. `03-PHASE2-MULTI-TAB.md` - Specs 020-022 details
5. `04-PHASE3-NAVIGATION.md` - Specs 023-025 details
6. `05-PHASE4-INTEGRATION.md` - Specs 026-028 details
7. `06-PHASE5-POLISH.md` - Specs 029-031 details
8. `07-PHASE6-ADVANCED-FEATURES.md` - Stories F002-F020
9. `08-FLUTTER-REFERENCE-MAPPING.md` - Flutter to Electron mapping

---

## Next Steps

1. **Review this overview** with stakeholders
2. **Proceed to Phase 1** documentation (`02-PHASE1-FOUNDATION.md`)
3. **Create AASEF specs** in `.aasef/specs/` following the plan
4. **Begin implementation** with Spec 017
