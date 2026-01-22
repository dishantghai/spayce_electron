/**
 * Spec 011: Migration & Feature Parity - E2E Integration Verification Tests
 * 
 * TDD RED Phase: These tests verify Spec 010 deliverables are working end-to-end.
 * Tests should FAIL initially until all integration is complete.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

describe('Spec 011: E2E Integration Verification', () => {
    describe('AC1: Main Process Initialization (Spec 010 Deliverable)', () => {
        it('should have ServiceBootstrap.initialize in main/index.ts', () => {
            const mainIndexPath = path.join(PROJECT_ROOT, 'packages/desktop/src/main/index.ts');

            if (!fs.existsSync(mainIndexPath)) {
                // File doesn't exist yet - test should fail
                expect(fs.existsSync(mainIndexPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(mainIndexPath, 'utf-8');
            expect(content).toContain('ServiceBootstrap');
            expect(content).toContain('initialize');
        });

        it('should NOT have SurrealDB references in main process', () => {
            const mainDir = path.join(PROJECT_ROOT, 'packages/desktop/src/main');

            if (!fs.existsSync(mainDir)) {
                expect(fs.existsSync(mainDir)).toBe(true);
                return;
            }

            const hasSurrealDB = searchForPattern(mainDir, 'surrealdb');
            expect(hasSurrealDB).toBe(false);
        });

        it('should initialize database with correct path', () => {
            const bootstrapPath = path.join(PROJECT_ROOT, 'packages/infrastructure/src/bootstrap/ServiceBootstrap.ts');

            if (!fs.existsSync(bootstrapPath)) {
                expect(fs.existsSync(bootstrapPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(bootstrapPath, 'utf-8');
            expect(content).toContain('databasePath');
        });
    });

    describe('AC2: Mock Data Removal (Spec 010 Deliverable)', () => {
        it('should NOT have DEMO_SPACES in App.tsx', () => {
            const appTsxPath = path.join(PROJECT_ROOT, 'packages/desktop/src/renderer/App.tsx');

            if (!fs.existsSync(appTsxPath)) {
                expect(fs.existsSync(appTsxPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(appTsxPath, 'utf-8');
            expect(content).not.toContain('DEMO_SPACES');
        });

        it('should NOT have mockSpaces or mockItems in production code', () => {
            const desktopSrc = path.join(PROJECT_ROOT, 'packages/desktop/src');
            const reactUiSrc = path.join(PROJECT_ROOT, 'packages/react-ui/src');

            const hasMockInDesktop = searchForPattern(desktopSrc, 'mockSpaces');
            const hasMockInReactUi = searchForPattern(reactUiSrc, 'mockSpaces');

            expect(hasMockInDesktop).toBe(false);
            expect(hasMockInReactUi).toBe(false);
        });

        it('should NOT have hardcoded space arrays in components', () => {
            const desktopRenderer = path.join(PROJECT_ROOT, 'packages/desktop/src/renderer');

            if (!fs.existsSync(desktopRenderer)) {
                expect(fs.existsSync(desktopRenderer)).toBe(true);
                return;
            }

            // Search for patterns like: const spaces = [{ id: '1', name: 'Work'
            const hasHardcodedArrays = searchForPattern(
                desktopRenderer,
                /const\s+spaces\s*=\s*\[\s*\{/
            );
            expect(hasHardcodedArrays).toBe(false);
        });
    });

    describe('AC3: InvalidationProvider Integration (Spec 010 Deliverable)', () => {
        it('should have InvalidationProvider in App.tsx', () => {
            const appTsxPath = path.join(PROJECT_ROOT, 'packages/desktop/src/renderer/App.tsx');

            if (!fs.existsSync(appTsxPath)) {
                expect(fs.existsSync(appTsxPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(appTsxPath, 'utf-8');
            expect(content).toContain('InvalidationProvider');
        });

        it('should have InvalidationContext exported from react-ui', () => {
            const invalidationPath = path.join(
                PROJECT_ROOT,
                'packages/react-ui/src/hooks/common/InvalidationContext.tsx'
            );

            expect(fs.existsSync(invalidationPath)).toBe(true);
        });
    });

    describe('AC4: useSpaces Hook Integration (Spec 010 Deliverable)', () => {
        it('should have useSpaces hook in react-ui', () => {
            const useSpacesPath = path.join(PROJECT_ROOT, 'packages/react-ui/src/hooks/useSpaces.ts');
            expect(fs.existsSync(useSpacesPath)).toBe(true);
        });

        it('should use useSpaces hook in renderer components', () => {
            const rendererDir = path.join(PROJECT_ROOT, 'packages/desktop/src/renderer');

            if (!fs.existsSync(rendererDir)) {
                expect(fs.existsSync(rendererDir)).toBe(true);
                return;
            }

            const usesHook = searchForPattern(rendererDir, 'useSpaces');
            expect(usesHook).toBe(true);
        });
    });

    describe('AC5: Database Integration', () => {
        it('should have spaces.sqlite in resources/db/', () => {
            const dbPath = path.join(PROJECT_ROOT, 'resources/db/spaces.sqlite');
            expect(fs.existsSync(dbPath)).toBe(true);
        });

        it('should have DatabaseInitializer with correct schema', () => {
            const initializerPath = path.join(
                PROJECT_ROOT,
                'packages/infrastructure/src/persistence/sqlite/DatabaseInitializer.ts'
            );

            expect(fs.existsSync(initializerPath)).toBe(true);

            const content = fs.readFileSync(initializerPath, 'utf-8');
            expect(content).toContain('CREATE TABLE');
            expect(content).toContain('spaces');
            expect(content).toContain('space_items');
        });
    });

    describe('AC6: Service Registry Integration', () => {
        it('should have ServiceRegistry with all required keys', () => {
            const registryPath = path.join(
                PROJECT_ROOT,
                'packages/infrastructure/src/di/ServiceRegistry.ts'
            );

            expect(fs.existsSync(registryPath)).toBe(true);

            const content = fs.readFileSync(registryPath, 'utf-8');
            expect(content).toContain('SPACES_REPOSITORY');
            expect(content).toContain('SPACE_ITEMS_REPOSITORY');
        });

        it('should have SERVICE_KEYS exported', () => {
            const keysPath = path.join(
                PROJECT_ROOT,
                'packages/infrastructure/src/di/ServiceKeys.ts'
            );

            expect(fs.existsSync(keysPath)).toBe(true);
        });
    });

    describe('AC7: Error Boundaries', () => {
        it('should have DomainErrorBoundary component', () => {
            const errorBoundaryPath = path.join(
                PROJECT_ROOT,
                'packages/react-ui/src/components/error/DomainErrorBoundary.tsx'
            );

            expect(fs.existsSync(errorBoundaryPath)).toBe(true);
        });

        it('should have GlobalErrorBoundary component', () => {
            const globalErrorPath = path.join(
                PROJECT_ROOT,
                'packages/react-ui/src/components/error/GlobalErrorBoundary.tsx'
            );

            expect(fs.existsSync(globalErrorPath)).toBe(true);
        });
    });

    describe('AC8: Loading States', () => {
        it('should have Skeleton component', () => {
            const skeletonPath = path.join(
                PROJECT_ROOT,
                'packages/react-ui/src/components/common/Skeleton.tsx'
            );

            expect(fs.existsSync(skeletonPath)).toBe(true);
        });

        it('should have SpaceListSkeleton component', () => {
            const spaceSkeletonPath = path.join(
                PROJECT_ROOT,
                'packages/react-ui/src/components/spaces/SpaceListSkeleton.tsx'
            );

            expect(fs.existsSync(spaceSkeletonPath)).toBe(true);
        });
    });
});

/**
 * Helper function to search for a pattern in all .ts/.tsx files in a directory
 */
function searchForPattern(dir: string, pattern: string | RegExp): boolean {
    if (!fs.existsSync(dir)) return false;

    const files = getAllFiles(dir, ['.ts', '.tsx']);
    for (const file of files) {
        // Skip test files
        if (file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.')) {
            continue;
        }

        const content = fs.readFileSync(file, 'utf-8');
        if (typeof pattern === 'string') {
            if (content.includes(pattern)) {
                return true;
            }
        } else {
            if (pattern.test(content)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Helper function to get all files with specific extensions recursively
 */
function getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...getAllFiles(fullPath, extensions));
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
        }
    }

    return files;
}
