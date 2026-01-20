# Implementation Plan: Migration & Feature Parity (011)

## Prerequisites
- ALL specs 007-010 must be complete and tested

## Phase 1: Database Setup (Day 1)
1.1. Create `scripts/copy-flutter-db.sh`
1.2. Run database copy from Flutter location
1.3. Create `scripts/migrate-db.ts` for schema updates
1.4. Verify all columns exist
1.5. Create `scripts/seed-db.ts` for development

## Phase 2: Pre-Migration Backup (Day 1)
2.1. Create `scripts/backup-before-migration.sh`
2.2. Create backup git branch
2.3. Backup database file
2.4. Create backup manifest

## Phase 3: Migration Audit (Day 2)
3.1. Audit all files in `packages/shared/`
3.2. Create migration mapping document
3.3. Identify import patterns to replace

## Phase 4: Import Migration (Days 2-3)
4.1. Create `scripts/migrate-imports.sh`
4.2. Run import replacements
4.3. Fix any manual cases
4.4. Verify TypeScript build passes

## Phase 5: Mock Data Removal (Day 3)
5.1. Run `scripts/find-mock-data.sh`
5.2. Replace mock data with hook usage
5.3. Add loading states
5.4. Add error states

## Phase 6: Feature Verification (Days 4-5)
6.1. Create `scripts/verify-features.ts`
6.2. Test all Space CRUD operations
6.3. Test all Item CRUD operations
6.4. Test pin operations
6.5. Test drag & drop
6.6. Test search functionality
6.7. Manual verification of Flutter parity

## Phase 7: Testing (Days 5-6)
7.1. Run all unit tests
7.2. Run all integration tests
7.3. Verify coverage targets met
7.4. Fix any failing tests

## Phase 8: Documentation (Day 6)
8.1. Update `.aasef/context/codebase.md`
8.2. Update `.aasef/context/tech_decisions.md`
8.3. Create `.aasef/context/architecture.md`
8.4. Update agent rules

## Phase 9: Cleanup (Day 7)
9.1. Remove `packages/shared/` directory
9.2. Update `pnpm-workspace.yaml`
9.3. Final build and test
9.4. Create `scripts/rollback-migration.sh`

## Verification Checklist
- [ ] Flutter database imported and validated
- [ ] All 40+ features verified working
- [ ] All mock data removed
- [ ] All tests pass
- [ ] Coverage targets met
- [ ] Documentation complete
- [ ] Rollback procedure tested
