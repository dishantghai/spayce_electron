# Spayce Electron Browser Integration Plan

> **Version**: 1.0
> **Created**: January 29, 2026
> **Status**: Ready for Implementation

---

## Executive Summary

This comprehensive implementation plan provides a complete roadmap for integrating a full-featured browser into the Spayce Electron application. The plan achieves **feature parity with the Flutter Spayce app** while leveraging Electron's native capabilities for superior performance.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Total Specs** | 15 (017-031) |
| **Total Stories** | 19 (F002-F020) |
| **Estimated Sessions** | 16-23 Claude Opus 4.5 |
| **Total Phases** | 6 |

---

## Quick Start

### For Implementers

1. **Review Readiness**: Start with `00-READINESS-ASSESSMENT.md`
2. **Understand Overview**: Read `01-IMPLEMENTATION-OVERVIEW.md`
3. **Begin Phase 1**: Follow `02-PHASE1-FOUNDATION.md`
4. **Reference Flutter**: Use `08-FLUTTER-REFERENCE-MAPPING.md` during coding

### Implementation Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
   ↓         ↓         ↓         ↓         ↓         ↓
 Specs    Specs     Specs     Specs     Specs    Stories
017-019  020-022   023-025   026-028   029-031   F002-F020
```

---

## Document Index

| Document | Description | When to Use |
|----------|-------------|-------------|
| [`00-READINESS-ASSESSMENT.md`](./00-READINESS-ASSESSMENT.md) | Architecture readiness analysis | Before starting |
| [`01-IMPLEMENTATION-OVERVIEW.md`](./01-IMPLEMENTATION-OVERVIEW.md) | High-level plan overview | Planning sessions |
| [`02-PHASE1-FOUNDATION.md`](./02-PHASE1-FOUNDATION.md) | WebContentsView, Tab domain, MVP | Specs 017-019 |
| [`03-PHASE2-MULTI-TAB.md`](./03-PHASE2-MULTI-TAB.md) | Tab bar, CRUD, state management | Specs 020-022 |
| [`04-PHASE3-NAVIGATION.md`](./04-PHASE3-NAVIGATION.md) | Nav bar, URL bar, history | Specs 023-025 |
| [`05-PHASE4-INTEGRATION.md`](./05-PHASE4-INTEGRATION.md) | Spaces-browser deep linking | Specs 026-028 |
| [`06-PHASE5-POLISH.md`](./06-PHASE5-POLISH.md) | Session, hibernation, perf | Specs 029-031 |
| [`07-PHASE6-ADVANCED-FEATURES.md`](./07-PHASE6-ADVANCED-FEATURES.md) | Advanced features stories | Stories F002-F020 |
| [`08-FLUTTER-REFERENCE-MAPPING.md`](./08-FLUTTER-REFERENCE-MAPPING.md) | Flutter → Electron code mapping | During coding |

---

## Specs Overview

### Phase 1: Foundation (3-4 sessions)
| Spec | Title | Complexity |
|------|-------|------------|
| 017 | Browser Foundation - WebContentsView Service | High |
| 018 | Browser Domain Layer - Tab Entities | Medium |
| 019 | Single Tab Browser - MVP Prototype | Medium |

### Phase 2: Multi-Tab (3-4 sessions)
| Spec | Title | Complexity |
|------|-------|------------|
| 020 | Tab Bar UI Component | Medium |
| 021 | Tab CRUD Operations | Medium |
| 022 | Tab State Management | Medium |

### Phase 3: Navigation (2-3 sessions)
| Spec | Title | Complexity |
|------|-------|------------|
| 023 | Navigation Bar Component | Medium |
| 024 | URL Bar with Validation | Medium |
| 025 | History Management | Medium |

### Phase 4: Integration (2-3 sessions)
| Spec | Title | Complexity |
|------|-------|------------|
| 026 | Tab-Space Origin Tracking | Medium |
| 027 | Add to Space Flow | Medium |
| 028 | Link Click Handling | Medium |

### Phase 5: Polish (2-3 sessions)
| Spec | Title | Complexity |
|------|-------|------------|
| 029 | Session Persistence | Medium |
| 030 | Tab Hibernation | High |
| 031 | Performance Optimization | Medium |

### Phase 6: Advanced (4-6 sessions)
19 feature stories for complete Flutter parity. See `07-PHASE6-ADVANCED-FEATURES.md`.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     ELECTRON APP                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MAIN PROCESS                    RENDERER PROCESS            │
│  ┌─────────────────┐            ┌─────────────────┐         │
│  │ BrowserService  │◄──IPC───►  │ React UI        │         │
│  │ • WebContentsView│            │ • TabBar        │         │
│  │ • Tab lifecycle  │            │ • NavigationBar │         │
│  │ • Session mgmt   │            │ • BrowserArea   │         │
│  └─────────────────┘            └─────────────────┘         │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌─────────────────┐            ┌─────────────────┐         │
│  │ SQLite          │            │ Zustand Stores  │         │
│  │ • browser_tabs  │            │ • tabStore      │         │
│  │ • browser_history│           │ • browserUiStore│         │
│  └─────────────────┘            └─────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Browser API | WebContentsView | Modern Electron 30+ API, not deprecated |
| UI Framework | React 18 | Already in use, component-based |
| State Management | Zustand | Lightweight, TypeScript-friendly |
| Persistence | SQLite | Already in use for Spaces |
| Architecture | Clean Architecture | Existing pattern, maintainable |

---

## Files to Create/Modify

### New Files (by package)

**@spayce/desktop** (main process)
- `src/main/services/BrowserService.ts`
- `src/main/services/SessionService.ts`
- `src/main/services/HibernationManager.ts`
- `src/main/ipc/browserHandlers.ts`
- `src/main/ipc/tabHandlers.ts`

**@spayce/core** (domain)
- `src/domain/entities/TabEntity.ts`
- `src/domain/entities/HistoryEntry.ts`
- `src/domain/repositories/ITabsRepository.ts`
- `src/domain/repositories/IHistoryRepository.ts`
- `src/application/facades/TabsFacade.ts`

**@spayce/infrastructure** (persistence)
- `src/persistence/sqlite/SqliteTabsRepository.ts`
- `src/persistence/sqlite/SqliteHistoryRepository.ts`
- `src/persistence/sqlite/migrations/002_browser_tabs.sql`
- `src/persistence/sqlite/migrations/003_browser_history.sql`

**@spayce/react-ui** (components)
- `src/components/browser/BrowserArea.tsx`
- `src/components/browser/BrowserLayout.tsx`
- `src/components/browser/TabBar.tsx`
- `src/components/browser/TabItem.tsx`
- `src/components/browser/NavigationBar.tsx`
- `src/components/browser/UrlBar.tsx`
- `src/components/browser/AddToSpaceDialog.tsx`
- `src/components/browser/LinkPreviewPopup.tsx`
- `src/components/browser/BrowserErrorView.tsx`
- `src/stores/tabStore.ts`
- `src/stores/browserUiStore.ts`
- `src/hooks/useOpenLink.ts`
- `src/hooks/useSpaceItemHighlight.ts`
- `src/utils/urlValidator.ts`

---

## Success Criteria

### Functional
- [ ] Can browse to any website
- [ ] Multi-tab support with create/close/switch
- [ ] Tabs persist across app restarts
- [ ] Space items open corresponding tabs
- [ ] "Add to Space" saves current page
- [ ] All Flutter browser features ported

### Performance
- [ ] Tab switch <500ms
- [ ] Memory <1GB with 10 active tabs
- [ ] UI stays responsive during loading

### Quality
- [ ] All HiFi designs implemented
- [ ] Design system tokens used consistently
- [ ] No console errors in normal operation
- [ ] Unit test coverage for domain layer

---

## SPEKY Integration

After this plan is approved, create SPEKY specs:

```bash
# Create specs for each phase
speky spec "Browser Foundation - WebContentsView Service"
speky spec "Browser Domain Layer - Tab Entities"
# ... etc

# Or import this plan
speky import ./BROWSER_INTEGRATION_PLAN/
```

Spec files will be created in:
```
.speky/specs/017-browser-foundation/
.speky/specs/018-tab-domain-layer/
# ... etc
```

---

## Getting Started

### Prerequisites
- Complete existing specs (001-016)
- Electron 30+ installed
- Familiarity with Clean Architecture

### First Session
1. Open `02-PHASE1-FOUNDATION.md`
2. Implement Spec 017: BrowserService
3. Test WebContentsView creation
4. Proceed to Spec 018

### Useful Commands
```bash
# Start development
pnpm dev

# Run tests
pnpm test

# Check types
pnpm typecheck
```

---

## Questions?

If unclear about any spec or story:
1. Check `08-FLUTTER-REFERENCE-MAPPING.md` for Flutter source
2. Reference HiFi designs in `.speky/design/screens/`
3. Review `.speky/context/tech_decisions.md` for constraints

---

**Ready to begin? Start with Phase 1 → `02-PHASE1-FOUNDATION.md`**
