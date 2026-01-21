# Implementation Plan: Migration & Feature Parity (011)

## Prerequisites
- ALL specs 007-010 must be complete and tested
- Spec 010 deliverables verified:
  - ServiceBootstrap initialized in main process
  - App.tsx integrated with hooks
  - DEMO_SPACES removed
  - InvalidationProvider wrapping app

## Phase 1: Spec 010 Verification (Day 1) - BLOCKING
1.1. Run `scripts/verify-e2e-integration.sh`
1.2. Verify ServiceBootstrap.initialize in main/index.ts
1.3. Verify SurrealDB code removed
1.4. Verify DEMO_SPACES removed from App.tsx
1.5. Verify InvalidationProvider in App.tsx
1.6. Verify useSpaces hook in use

> [!IMPORTANT]
> If any of Phase 1 checks fail, go back and complete Spec 010.

## Phase 2: Database Setup (Day 1)
2.1. Create `scripts/copy-flutter-db.sh`
2.2. Run database copy from Flutter location
2.3. Create `scripts/migrate-db.ts` for schema updates
2.4. Verify all columns exist
2.5. Create `scripts/seed-db.ts` for development

## Phase 3: Pre-Migration Backup (Day 1)
3.1. Create `scripts/backup-before-migration.sh`
3.2. Create backup git branch
3.3. Backup database file
3.4. Create backup manifest

## Phase 4: Migration Audit (Day 2)
4.1. Audit all files in `packages/shared/`
4.2. Create migration mapping document
4.3. Identify import patterns to replace

## Phase 5: Import Migration (Days 2-3)
5.1. Create `scripts/migrate-imports.sh`
5.2. Run import replacements
5.3. Fix any manual cases
5.4. Verify TypeScript build passes

## Phase 6: Mock Data Removal Verification (Day 3)
6.1. Run `scripts/find-mock-data.sh`
6.2. Verify App.tsx DEMO_SPACES already removed (Spec 010)
6.3. Find and remove any remaining mock data
6.4. Verify all components use hooks
6.5. Verify loading/error states present

## Phase 7: Feature Verification (Days 4-5)
7.1. Create `scripts/verify-features.ts`
7.2. Test all Space CRUD operations
7.3. Test all Item CRUD operations
7.4. Test pin operations
7.5. Test drag & drop
7.6. Test search functionality
7.7. Manual verification of Flutter parity

## Phase 8: E2E Integration Testing (Day 5) - NEW
8.1. Execute manual E2E test scenarios:
   | # | Scenario | Expected Result |
   |---|----------|-----------------|
   | 1 | App Launch | Shows real spaces from database |
   | 2 | Create Space | Persists to database |
   | 3 | Delete Space | Cascade deletes items |
   | 4 | Rename Space | Updates in database |
   | 5 | Reorder Spaces | Persists after restart |
   | 6 | Add Link | Shows with favicon |
   | 7 | Create Folder | Shows in tree |
   | 8 | Pin Item | Shows in pinned grid |
   | 9 | Drag Item | Moves in tree |
   | 10 | Search | Returns results |

8.2. Run database persistence verification
8.3. Document any failures for fixing

## Phase 9: Testing (Days 5-6)
9.1. Run all unit tests
9.2. Run all integration tests
9.3. Verify coverage targets met
9.4. Fix any failing tests

## Phase 10: Documentation (Day 6)
10.1. Update `.aasef/context/codebase.md`
10.2. Update `.aasef/context/tech_decisions.md`
10.3. Create `.aasef/context/architecture.md`
10.4. Update agent rules

## Phase 11: Cleanup (Day 7)
11.1. Remove `packages/shared/` directory
11.2. Update `pnpm-workspace.yaml`
11.3. Final build and test
11.4. Create `scripts/rollback-migration.sh`

## Verification Checklist
- [ ] **Spec 010 Verification**: All deliverables verified
- [ ] Flutter database imported and validated
- [ ] All 40+ features verified working
- [ ] All mock data removed (including App.tsx)
- [ ] E2E test scenarios pass (10/10)
- [ ] All unit/integration tests pass
- [ ] Coverage targets met
- [ ] Documentation complete
- [ ] Rollback procedure tested
