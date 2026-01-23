# Spec 011: Migration & Feature Parity - REMAINING WORK
**Last Updated:** Jan 23, 2026 10:52pm UTC+05:30  
**Status:** 75% Complete → 25% Remaining

---

## 🎯 QUICK STATUS

**Completed (Phases 1-5):** ✅
- All core architecture, IPC handlers, services, React hooks, event bus integration
- 755+ tests passing (90+ new tests added)
- TypeScript compilation passing

**Remaining (Phases 6-9):** 📋
- Component migration from packages/shared
- Comprehensive IPC handler tests
- Integration tests
- Documentation updates
- Final verification

---

## 📋 PHASE 6: Component Migration - **START HERE** ⏭️

**Priority:** 🔴 CRITICAL  
**Estimated Time:** 6-8 hours  
**Status:** Ready to implement

### Objective
Migrate all UI components and theme from `packages/shared` to `packages/react-ui`, update all imports, and remove the shared package.

### Current Problem
```typescript
// App.tsx still imports from @spayce/shared
import { SpayceColors, ContextMenu, Sidebar, SpacesScreen } from '@spayce/shared';
```

### Files to Migrate (39 total)

**Components (21 files):**
- BottomBar.tsx + .module.css
- ContextMenu.tsx + .module.css
- CreateSpaceModal.tsx + .module.css
- CreateSpaceView.tsx + .module.css
- KeyboardNavigationProvider.tsx
- PinnedLinksGrid.tsx + .module.css
- Sidebar.tsx + .module.css
- SidebarTabs.tsx + .module.css
- SpaceHeader.tsx + .module.css
- TreeView.tsx + .module.css
- TreeItem.tsx
- TreeItemIcon.tsx
- spaces/SpaceCard.tsx + .module.css
- spaces/SpacesScreen.tsx + .module.css
- spaces/SpacesBottomBar.tsx
- spaces/SpaceHeader.tsx
- spaces/SpaceCreationForm.tsx
- spaces/PinnedLinksGrid.tsx
- icons/SpayceIcons.tsx
- navigation/* (5 files)

**Theme (6 files):**
- colors.ts
- spacing.ts
- typography.ts
- animations.ts
- shadows.ts
- radius.ts

**Stores (1 file to migrate):**
- navigation.ts (spaces.ts is replaced by hooks - DELETE)

**Models/Types (2 files):**
- models/spaces.ts (verify if still needed)
- types/index.ts

### Implementation Steps

#### 6.1: Backup (15 mins)
```bash
mkdir -p .backups/pre-migration-$(date +%Y%m%d-%H%M%S)
cp -r packages/shared .backups/pre-migration-$(date +%Y%m%d-%H%M%S)/
cp -r packages/react-ui .backups/pre-migration-$(date +%Y%m%d-%H%M%S)/
cp packages/desktop/src/renderer/App.tsx .backups/pre-migration-$(date +%Y%m%d-%H%M%S)/
```

#### 6.2: Migrate Theme First (30 mins)
**Why first:** Components depend on theme

```bash
# Copy theme files
cp -r packages/shared/src/theme/* packages/react-ui/src/theme/

# Update exports in packages/react-ui/src/theme/index.ts
# Ensure all theme exports are available
```

**Verify:**
```bash
pnpm typecheck
```

#### 6.3: Migrate Components (1.5 hours)
**Strategy:** Migrate in dependency order

**Step 1: Base Components (no dependencies)**
```bash
cp packages/shared/src/components/TreeItemIcon.tsx packages/react-ui/src/components/
cp packages/shared/src/components/icons/* packages/react-ui/src/components/icons/
```

**Step 2: Mid-level Components**
```bash
cp packages/shared/src/components/TreeItem.tsx packages/react-ui/src/components/
cp packages/shared/src/components/TreeView.* packages/react-ui/src/components/
cp packages/shared/src/components/ContextMenu.* packages/react-ui/src/components/
```

**Step 3: Complex Components**
```bash
cp packages/shared/src/components/Sidebar.* packages/react-ui/src/components/
cp packages/shared/src/components/SidebarTabs.* packages/react-ui/src/components/
cp packages/shared/src/components/PinnedLinksGrid.* packages/react-ui/src/components/
cp packages/shared/src/components/BottomBar.* packages/react-ui/src/components/
cp packages/shared/src/components/SpaceHeader.* packages/react-ui/src/components/
cp packages/shared/src/components/CreateSpaceView.* packages/react-ui/src/components/
cp packages/shared/src/components/CreateSpaceModal.* packages/react-ui/src/components/
cp packages/shared/src/components/KeyboardNavigationProvider.tsx packages/react-ui/src/components/
```

**Step 4: Spaces Components**
```bash
mkdir -p packages/react-ui/src/components/spaces
cp -r packages/shared/src/components/spaces/* packages/react-ui/src/components/spaces/
```

**Step 5: Navigation Components**
```bash
mkdir -p packages/react-ui/src/components/navigation
cp -r packages/shared/src/components/navigation/* packages/react-ui/src/components/navigation/
```

#### 6.4: Update Component Imports (2.5 hours)

For each migrated component file:
1. Change `import { X } from '@spayce/shared'` → `import { X } from '../theme'` or local imports
2. Update theme imports to use local paths
3. Fix any cross-component imports

**Find all @spayce/shared imports:**
```bash
grep -r "@spayce/shared" packages/react-ui/src/components/
```

**Update each manually or with sed:**
```bash
# Example for a specific file
sed -i '' 's/@spayce\/shared/..\/..\//g' packages/react-ui/src/components/Sidebar.tsx
```

#### 6.5: Update react-ui Exports (30 mins)

**File:** `packages/react-ui/src/components/index.ts`
```typescript
// Add all migrated components
export * from './TreeView';
export * from './TreeItem';
export * from './TreeItemIcon';
export * from './ContextMenu';
export * from './Sidebar';
export * from './SidebarTabs';
export * from './PinnedLinksGrid';
export * from './BottomBar';
export * from './SpaceHeader';
export * from './CreateSpaceView';
export * from './CreateSpaceModal';
export * from './KeyboardNavigationProvider';

// Spaces components
export * from './spaces/SpaceCard';
export * from './spaces/SpacesScreen';
export * from './spaces/SpacesBottomBar';
export * from './spaces/SpaceHeader';
export * from './spaces/SpaceCreationForm';
export * from './spaces/PinnedLinksGrid';

// Navigation components
export * from './navigation';

// Icons
export * from './icons';
```

**File:** `packages/react-ui/src/index.ts`
```typescript
// Ensure components are re-exported at package level
export * from './components';
export * from './theme';
export * from './hooks';
export * from './stores';
```

#### 6.6: Update App.tsx Imports (30 mins)

**File:** `packages/desktop/src/renderer/App.tsx`

**Before:**
```typescript
import { SpayceColors, ContextMenu, Sidebar, SpacesScreen } from '@spayce/shared';
import type { SpaceItem, ContextMenuItem, Space, SidebarMode, SidebarTabId } from '@spayce/shared';
```

**After:**
```typescript
import { SpayceColors, ContextMenu, Sidebar, SpacesScreen } from '@spayce/react-ui';
import type { SpaceItem, ContextMenuItem, Space, SidebarMode, SidebarTabId } from '@spayce/react-ui';
```

#### 6.7: Find and Fix All Other Imports (1 hour)

```bash
# Search entire codebase for @spayce/shared
grep -r "@spayce/shared" packages/desktop/src/
grep -r "@spayce/shared" packages/react-ui/src/

# Fix each occurrence
```

#### 6.8: Remove packages/shared (15 mins)

**ONLY after all imports are fixed and tests pass:**

```bash
# Remove the package
rm -rf packages/shared

# Update pnpm-workspace.yaml
# Remove 'packages/shared' entry

# Update package.json files that reference @spayce/shared
# Remove from dependencies
```

#### 6.9: Test Everything (1 hour)

```bash
# TypeScript compilation
pnpm typecheck

# Run tests
pnpm test

# Start dev server
pnpm dev
```

**Manual Testing:**
- [ ] App launches successfully
- [ ] UI looks identical to before
- [ ] All components render correctly
- [ ] Styling is intact
- [ ] No console errors
- [ ] Create space works
- [ ] Delete space works
- [ ] All features functional

### Success Criteria
- ✅ packages/shared directory deleted
- ✅ All components in react-ui package
- ✅ All imports updated to @spayce/react-ui
- ✅ TypeScript compilation passes
- ✅ All tests pass
- ✅ App runs with identical UI
- ✅ No console errors

---

## 📋 PHASE 7A: IPC Handler Tests

**Priority:** 🟡 MEDIUM  
**Estimated Time:** 5-6 hours  
**Status:** Pending Phase 6 completion

### Objective
Achieve 100% test coverage for all Phase 2 IPC handlers (pins, metadata, fs operations).

### Handlers to Test (9 handlers)

**Pin Operations (3 handlers):**
1. `items:pin`
2. `items:unpin`
3. `items:reorderPins`

**Item Metadata (3 handlers):**
4. `items:incrementVisit`
5. `items:updateMetadata`
6. `items:reorder`

**Metadata Extraction (2 handlers):**
7. `metadata:extract`
8. `metadata:extractFavicon`

**File System (3 handlers):**
9. `fs:selectFolder`
10. `fs:selectFile`
11. `fs:loadFolderChildren`

### Implementation Steps

#### 7A.1: Complete Pin Operations Tests (1 hour)

**File:** `packages/desktop/__tests__/ipc/handlers-phase2.test.ts`

Expand existing tests with:
- Error cases (pin failure, item already pinned)
- Facade throwing exceptions
- Unpin failures
- Empty pin lists
- Invalid item IDs
- Order preservation verification

#### 7A.2: Add Metadata Operations Tests (1 hour)

**New test suite:**
- Increment visit count (fire-and-forget)
- Update metadata (name, description, favicon, isExpanded)
- Update multiple fields at once
- Null values for optional fields
- Validation of required fields
- Reorder items (root, within folder, empty list, partial reorder)

#### 7A.3: Add Metadata Extraction Service Tests (1.5 hours)

**New test suite:**
- Extract metadata successfully
- Handle extraction errors gracefully
- Invalid URLs
- Missing metadata fields
- Timeout after 10 seconds
- Extract favicon URL
- Fallback to /favicon.ico
- Extraction failures

#### 7A.4: Add File System Handler Tests (1.5 hours)

**New test suite:**
- Return selected folder path
- Handle user cancellation (null)
- Handle dialog errors
- Return selected file path
- Handle multiple files (return first)
- Load folder contents
- Filter hidden files
- Handle permission errors
- Handle non-existent paths
- Handle empty folders

#### 7A.5: Run Tests and Fix Issues (1 hour)

```bash
pnpm vitest run packages/desktop/__tests__/ipc/handlers-phase2.test.ts --reporter=verbose
```

### Success Criteria
- ✅ All 9 Phase 2 handlers have comprehensive tests
- ✅ Success cases tested
- ✅ Error cases tested
- ✅ Edge cases covered
- ✅ Test coverage >95% for handlers.ts Phase 2 code
- ✅ All tests passing (40+ new tests)

---

## 📋 PHASE 7B: Integration Tests

**Priority:** 🟡 MEDIUM  
**Estimated Time:** 4-5 hours  
**Status:** Pending Phase 7A completion

### Objective
Verify that all exports from Phases 1-3 work correctly in integration scenarios.

### Test Suites to Create

#### 7B.1: Core Package Integration Tests (1 hour)

**File:** `packages/core/__tests__/integration/exports.test.ts`

**Test:**
- Domain entities export correctly
- Facades export correctly
- Use cases export correctly
- All types available

#### 7B.2: Infrastructure Package Integration Tests (1 hour)

**File:** `packages/infrastructure/__tests__/integration/exports.test.ts`

**Test:**
- Service registry singleton works
- SERVICE_KEYS constants available
- ServiceBootstrap initializes correctly
- MetadataExtractionService exports
- Repositories export correctly
- Event bus exports

#### 7B.3: React-UI Package Integration Tests (1 hour)

**File:** `packages/react-ui/__tests__/integration/hooks-integration.test.tsx`

**Test:**
- useSpaces integrates with IPC
- useSpaceItems integrates with IPC
- usePinnedItems integrates with IPC
- Mutation hooks create and invalidate cache
- Delete operations invalidate cache
- Pin operations update pinned items

#### 7B.4: Desktop Package IPC Integration Tests (1.5 hours)

**File:** `packages/desktop/__tests__/integration/ipc-end-to-end.test.ts`

**Test:**
- Create space through IPC and persist to DB
- Pin item and retrieve from pins query
- Extract metadata and update item
- Select folder and create local folder item
- Error propagation from facade to IPC
- Database errors handled gracefully
- Service errors don't crash app

#### 7B.5: Run All Integration Tests (30 mins)

```bash
pnpm vitest run packages/*/__tests__/integration/ --reporter=verbose
pnpm vitest run --coverage
```

### Success Criteria
- ✅ All package exports verified
- ✅ IPC handlers integrate with facades
- ✅ Hooks integrate with IPC
- ✅ End-to-end scenarios work
- ✅ Error handling works throughout stack
- ✅ All integration tests pass (20+ new tests)

---

## 📋 PHASE 8: Documentation Updates

**Priority:** 🟢 LOW  
**Estimated Time:** 1-2 hours  
**Status:** Pending Phase 7 completion

### Tasks

#### 8.1: Update Codebase Documentation (30 mins)

**File:** `.aasef/context/codebase.md`
- Document new package structure
- Remove packages/shared references
- Add new services (MetadataExtraction, LocalFileSystem)
- Document event bus integration
- Update component locations

#### 8.2: Update Tech Decisions (30 mins)

**File:** `.aasef/context/tech_decisions.md`
- Add Clean Architecture section
- Document service registry pattern
- Document error handling strategy
- Document event bus usage
- Document cache invalidation approach

#### 8.3: Create Architecture Documentation (30 mins)

**File:** `.aasef/context/architecture.md`
- Layer diagrams (Domain → Application → Infrastructure → Presentation)
- Dependency flow
- Package purposes
- IPC communication flow
- Event bus flow

#### 8.4: Update Agent Rules (30 mins)

**File:** `.agent/rules/`
- New feature development process
- Package structure rules
- Testing requirements
- Import conventions

### Success Criteria
- ✅ Documentation complete
- ✅ Accurate and up-to-date
- ✅ Helpful for future development
- ✅ Architecture clearly explained

---

## 📋 PHASE 9: Final Verification

**Priority:** 🟡 MEDIUM  
**Estimated Time:** 1 hour  
**Status:** Pending Phase 8 completion

### Tasks

#### 9.1: Run Complete Test Suite (15 mins)

```bash
pnpm test -- --run
pnpm typecheck
```

#### 9.2: Run All Verification Scripts (15 mins)

```bash
bash scripts/verify-e2e-integration.sh
bash scripts/find-mock-data.sh
npx tsx scripts/verify-features.ts
```

#### 9.3: Test App Functionality (20 mins)

**Full smoke test:**
- [ ] App launches successfully
- [ ] Spaces load from database
- [ ] Create new space works
- [ ] Delete space works
- [ ] Rename space works
- [ ] Reorder spaces works
- [ ] Create item works (link, folder, local folder, local file)
- [ ] Delete item works
- [ ] Move item works
- [ ] Pin/unpin works
- [ ] Reorder pins works
- [ ] Search works
- [ ] Drag & drop works
- [ ] Metadata extraction works
- [ ] File system selection works

#### 9.4: Verify Database (5 mins)

```bash
# Check schema
sqlite3 resources/db/spaces.sqlite ".schema"

# Verify data integrity
sqlite3 resources/db/spaces.sqlite "SELECT COUNT(*) FROM spaces;"
sqlite3 resources/db/spaces.sqlite "SELECT COUNT(*) FROM space_items;"
```

#### 9.5: Update Status (5 mins)

- Mark spec 011 as complete
- Update `.aasef/specs/011-migration-feature-parity/status.json`
- Document any known issues
- Create completion summary

### Success Criteria
- ✅ All verifications pass
- ✅ App fully functional
- ✅ No console errors
- ✅ Data persists across restarts
- ✅ Ready for production use

---

## 📊 PROGRESS SUMMARY

### Completed Work (75%)

**Phase 1: Export Fixes** ✅
- Fixed all package exports
- TypeScript compilation passing

**Phase 2: IPC Handlers** ✅
- Added 9 missing handlers
- All handlers registered and working

**Phase 3: Services** ✅
- MetadataExtractionService created (21 tests)
- LocalFileSystemService created (20 tests)

**Phase 4: React UI Hooks** ✅
- 5 new mutation hooks created (29 tests)
- All hooks exported and integrated

**Phase 5: Event Bus Integration** ✅
- InvalidationProvider connected to event bus (20 tests)
- Automatic cache invalidation working
- 11 domain events mapped

### Remaining Work (25%)

**Phase 6: Component Migration** 📋 NEXT
- 39 files to migrate
- Update all imports
- Remove packages/shared
- **Estimated:** 6-8 hours

**Phase 7A: IPC Handler Tests** 📋
- Comprehensive tests for 9 handlers
- **Estimated:** 5-6 hours

**Phase 7B: Integration Tests** 📋
- 4 test suites
- **Estimated:** 4-5 hours

**Phase 8: Documentation** 📋
- Update 4 documentation files
- **Estimated:** 1-2 hours

**Phase 9: Final Verification** 📋
- Complete smoke test
- **Estimated:** 1 hour

---

## 🚀 NEXT STEPS

**START HERE:** Phase 6 - Component Migration

1. Create backup
2. Migrate theme files
3. Migrate components in dependency order
4. Update all imports
5. Remove packages/shared
6. Test thoroughly

**After Phase 6:**
- Phase 7A: Write IPC handler tests
- Phase 7B: Write integration tests
- Phase 8: Update documentation
- Phase 9: Final verification

---

## 📝 QUICK REFERENCE

### Test Counts
- **Current:** 755+ tests passing
- **Phase 4:** 29 new tests
- **Phase 5:** 20 new tests
- **Phase 7 (partial):** 41 new tests
- **Expected after completion:** 850+ tests

### Key Files
- Main plan: `.aasef/specs/011-migration-feature-parity/REMAINING_WORK.md` (this file)
- IPC handlers: `packages/desktop/src/main/ipc/handlers.ts`
- App.tsx: `packages/desktop/src/renderer/App.tsx`
- Shared package: `packages/shared/` (to be removed)

### Commands
```bash
# Backup
mkdir -p .backups/pre-migration-$(date +%Y%m%d-%H%M%S)

# Test
pnpm typecheck
pnpm test

# Dev
pnpm dev
```

---

**Last Updated:** Jan 23, 2026 10:52pm UTC+05:30  
**Next Review:** After Phase 6 completion  
**Estimated Time to 100%:** 18-22 hours
