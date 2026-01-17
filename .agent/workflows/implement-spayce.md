---
description: Implement Spayce Electron application from the comprehensive implementation plan
---

# Spayce Electron Implementation Workflow

## Prerequisites
- Read the implementation plan: `/Users/apple/.gemini/antigravity/brain/aa177766-3ffd-4318-8f53-b04d074d7f1e/implementation_plan.md`
- Reference old Flutter codebase: `/Users/Shared/ALL WORKSPACE/projects/spayce`
- Target directory: `/Users/Shared/ALL WORKSPACE/projects/spayce_electron`

## Phase Execution Order

Execute phases in this order:

1. **Phase 1: Project Foundation** (2-3 days)
   - Initialize Electron + React Native Web monorepo
   - Set up design system tokens from AUGMENTED SECTION 1
   - Configure SurrealDB embedded

2. **Phase 2: Navigation Shell** (3-4 days)
   - 320px sidebar with bottom tab bar (60px)
   - Keyboard navigation from AUGMENTED SECTION 5

3. **Phase 3: Spaces Feature** (5-7 days)
   - Space/SpaceItem models from AUGMENTED SECTION 3
   - Pinned links grid, drag-drop, tree view
   - Reference: `spayce/frontend/lib/features/spaces/`

4. **Phase 4: Browser Feature** (5-7 days)
   - WebContentsView TabManager from AUGMENTED SECTION 11
   - Arc-style multi-tab browser integration

5. **Phase 5: Workspace Feature** (4-5 days)
   - File tree, activity bar, editor area
   - Reference: `spayce/frontend/lib/features/workspace/`

6. **Phase 6: Authentication** (2-3 days)
   - Firebase Auth from AUGMENTED SECTION 7
   - Reuse existing spayce-app project

## Per-Phase Checklist

For EACH phase:
// turbo-all
1. Read the phase section in implementation_plan.md
2. Read the corresponding OLD codebase tests in `spayce/frontend/test/`
3. Read the corresponding OLD source code in `spayce/frontend/lib/features/`
4. Cross-reference HiFi UI screens in `spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/`
5. Implement with 100% feature parity
6. Run verification checklist from the plan

## Key Files to Always Reference

| Purpose | Path |
|---------|------|
| Implementation Plan | `/Users/apple/.gemini/antigravity/brain/aa177766-3ffd-4318-8f53-b04d074d7f1e/implementation_plan.md` |
| Old Flutter Tests | `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/test/` |
| Old Feature Code | `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/` |
| Design System | `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/core/theme/` |
| UI Screens | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/` |
