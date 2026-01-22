/**
 * Spec 011: Migration & Feature Parity - Migration Verification Tests
 * 
 * TDD RED Phase: These tests verify the migration from packages/shared/ to new Clean Architecture structure.
 * Tests should FAIL initially until migration is complete.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

describe('Spec 011: Migration Verification', () => {
    describe('AC1: packages/shared/ Migration Complete', () => {
        describe('Phase 1: Old Structure Removal', () => {
            it('should have removed packages/shared/src/types/ directory', () => {
                const typesPath = path.join(PROJECT_ROOT, 'packages/shared/src/types');
                // After migration, this directory should not exist or be empty
                const exists = fs.existsSync(typesPath);
                if (exists) {
                    const files = fs.readdirSync(typesPath);
                    // Should only have index.ts with re-exports at most
                    expect(files.filter(f => f !== 'index.ts')).toHaveLength(0);
                }
            });

            it('should have removed packages/shared/src/stores/spaces.ts', () => {
                const spacesStorePath = path.join(PROJECT_ROOT, 'packages/shared/src/stores/spaces.ts');
                // spaces.ts should be removed (replaced by hooks)
                expect(fs.existsSync(spacesStorePath)).toBe(false);
            });
        });

        describe('Phase 2: New Structure Exists', () => {
            it('should have @spayce/core domain entities', () => {
                const entitiesPath = path.join(PROJECT_ROOT, 'packages/core/src/domain/entities');
                expect(fs.existsSync(entitiesPath)).toBe(true);

                const files = fs.readdirSync(entitiesPath);
                expect(files).toContain('Space.ts');
                expect(files).toContain('SpaceItem.ts');
            });

            it('should have @spayce/core application use-cases', () => {
                const useCasesPath = path.join(PROJECT_ROOT, 'packages/core/src/application/use-cases');
                expect(fs.existsSync(useCasesPath)).toBe(true);

                const spacesPath = path.join(useCasesPath, 'spaces');
                expect(fs.existsSync(spacesPath)).toBe(true);

                const itemsPath = path.join(useCasesPath, 'items');
                expect(fs.existsSync(itemsPath)).toBe(true);
            });

            it('should have @spayce/infrastructure repositories', () => {
                const repoPath = path.join(PROJECT_ROOT, 'packages/infrastructure/src/persistence/sqlite');
                expect(fs.existsSync(repoPath)).toBe(true);

                const files = fs.readdirSync(repoPath);
                expect(files).toContain('SqliteSpacesRepository.ts');
                expect(files).toContain('SqliteSpaceItemsRepository.ts');
            });

            it('should have @spayce/react-ui hooks', () => {
                const hooksPath = path.join(PROJECT_ROOT, 'packages/react-ui/src/hooks');
                expect(fs.existsSync(hooksPath)).toBe(true);

                const files = fs.readdirSync(hooksPath);
                expect(files).toContain('useSpaces.ts');
                expect(files).toContain('useSpaceItems.ts');
            });

            it('should have @spayce/react-ui components', () => {
                const componentsPath = path.join(PROJECT_ROOT, 'packages/react-ui/src/components');
                expect(fs.existsSync(componentsPath)).toBe(true);
            });
        });

        describe('Phase 3: Import Paths Updated', () => {
            it('should not have @spayce/shared/types imports in packages/desktop', () => {
                const desktopSrc = path.join(PROJECT_ROOT, 'packages/desktop/src');
                const hasOldImports = searchForPattern(desktopSrc, '@spayce/shared/types');
                expect(hasOldImports).toBe(false);
            });

            it('should not have @spayce/shared/hooks imports in packages/desktop', () => {
                const desktopSrc = path.join(PROJECT_ROOT, 'packages/desktop/src');
                const hasOldImports = searchForPattern(desktopSrc, '@spayce/shared/hooks');
                expect(hasOldImports).toBe(false);
            });

            it('should not have @spayce/shared/stores imports (except navigation)', () => {
                const desktopSrc = path.join(PROJECT_ROOT, 'packages/desktop/src');
                // spaces.ts store should be removed, navigation.ts can remain
                const hasSpacesStoreImport = searchForPattern(desktopSrc, '@spayce/shared/stores/spaces');
                expect(hasSpacesStoreImport).toBe(false);
            });
        });
    });

    describe('AC2: TypeScript Build Passes', () => {
        it('should have valid tsconfig.json in packages/core', () => {
            const tsconfigPath = path.join(PROJECT_ROOT, 'packages/core/tsconfig.json');
            expect(fs.existsSync(tsconfigPath)).toBe(true);

            const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
            expect(tsconfig.compilerOptions).toBeDefined();
        });

        it('should have valid tsconfig.json in packages/infrastructure', () => {
            const tsconfigPath = path.join(PROJECT_ROOT, 'packages/infrastructure/tsconfig.json');
            expect(fs.existsSync(tsconfigPath)).toBe(true);

            const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
            expect(tsconfig.compilerOptions).toBeDefined();
        });

        it('should have valid tsconfig.json in packages/react-ui', () => {
            const tsconfigPath = path.join(PROJECT_ROOT, 'packages/react-ui/tsconfig.json');
            expect(fs.existsSync(tsconfigPath)).toBe(true);

            const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
            expect(tsconfig.compilerOptions).toBeDefined();
        });

        it('should export all required types from @spayce/core', () => {
            const indexPath = path.join(PROJECT_ROOT, 'packages/core/src/index.ts');
            expect(fs.existsSync(indexPath)).toBe(true);

            const content = fs.readFileSync(indexPath, 'utf-8');
            expect(content).toContain('domain');
        });

        it('should export all required services from @spayce/infrastructure', () => {
            const indexPath = path.join(PROJECT_ROOT, 'packages/infrastructure/src/index.ts');
            expect(fs.existsSync(indexPath)).toBe(true);

            const content = fs.readFileSync(indexPath, 'utf-8');
            expect(content).toContain('bootstrap');
        });
    });

    describe('AC3: Package Dependencies Correct', () => {
        it('should have @spayce/core with zero production dependencies', () => {
            const packagePath = path.join(PROJECT_ROOT, 'packages/core/package.json');
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

            // Core should have no production dependencies (domain layer is pure)
            const deps = pkg.dependencies || {};
            expect(Object.keys(deps)).toHaveLength(0);
        });

        it('should have @spayce/infrastructure depending on @spayce/core', () => {
            const packagePath = path.join(PROJECT_ROOT, 'packages/infrastructure/package.json');
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

            expect(pkg.dependencies).toHaveProperty('@spayce/core');
        });

        it('should have @spayce/react-ui depending on @spayce/core', () => {
            const packagePath = path.join(PROJECT_ROOT, 'packages/react-ui/package.json');
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

            expect(pkg.dependencies).toHaveProperty('@spayce/core');
        });
    });
});

/**
 * Helper function to search for a pattern in all .ts/.tsx files in a directory
 */
function searchForPattern(dir: string, pattern: string): boolean {
    if (!fs.existsSync(dir)) return false;

    const files = getAllFiles(dir, ['.ts', '.tsx']);
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes(pattern)) {
            return true;
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
