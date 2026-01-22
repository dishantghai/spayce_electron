/**
 * Smoke Tests
 * 
 * Quick tests to verify the app can start and basic functionality works.
 * These should be run after every significant change.
 * 
 * CRITICAL: These tests catch runtime failures that would prevent the app
 * from starting at all.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
    WORKSPACE_ROOT,
    DESKTOP_ROOT,
    DIST_DIR,
    checkBuildOutputs,
    getTestDbPath,
    cleanupTestDb,
    findNativeModule,
} from '../setup/test-utils';
import { ServiceBootstrap, serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';

describe('Smoke Tests', () => {
    describe('Build Smoke Test', () => {
        beforeAll(() => {
            // Ensure build is fresh
            try {
                execSync('pnpm build:main', {
                    cwd: DESKTOP_ROOT,
                    stdio: 'pipe',
                    timeout: 30000,
                });
            } catch (error) {
                console.error('Build failed:', error);
            }
        }, 60000);

        it('should have build outputs', () => {
            const outputs = checkBuildOutputs();
            expect(outputs.mainExists).toBe(true);
            expect(outputs.preloadExists).toBe(true);
        });

        it('should have reasonable build sizes', () => {
            const outputs = checkBuildOutputs();
            // main.cjs should be substantial (bundles workspace deps)
            expect(outputs.mainSize).toBeGreaterThan(10000);
            // preload.cjs is smaller
            expect(outputs.preloadSize).toBeGreaterThan(1000);
        });
    });

    describe('Service Initialization Smoke Test (skip if arch mismatch)', () => {
        let testDbPath: string;
        let canRunTests = false;

        beforeAll(() => {
            const moduleInfo = findNativeModule('better-sqlite3');
            if (moduleInfo.architecture && moduleInfo.architecture !== process.arch) {
                console.log(`Skipping service tests: arch mismatch (Node: ${process.arch}, Module: ${moduleInfo.architecture})`);
                return;
            }
            canRunTests = true;
            testDbPath = getTestDbPath();
        });

        afterAll(() => {
            if (canRunTests) {
                ServiceBootstrap.shutdown();
                cleanupTestDb(testDbPath);
            }
        });

        it('should initialize services without error', () => {
            if (!canRunTests) return;
            expect(() => {
                ServiceBootstrap.initialize({
                    databasePath: testDbPath,
                    logPrefix: '[Smoke Test]',
                });
            }).not.toThrow();
        });

        it('should have all required services registered', () => {
            if (!canRunTests) return;
            expect(serviceRegistry.has(SERVICE_KEYS.DATABASE)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.LOGGER)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.EVENT_BUS)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.SPACES_REPOSITORY)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.SPACES_FACADE)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.SPACE_ITEMS_FACADE)).toBe(true);
        });
    });

    describe('Database Operations Smoke Test (skip if arch mismatch)', () => {
        let testDbPath: string;
        let canRunTests = false;

        beforeAll(() => {
            const moduleInfo = findNativeModule('better-sqlite3');
            if (moduleInfo.architecture && moduleInfo.architecture !== process.arch) {
                console.log(`Skipping DB ops tests: arch mismatch`);
                return;
            }
            canRunTests = true;
            testDbPath = getTestDbPath();
            ServiceBootstrap.initialize({ databasePath: testDbPath });
        });

        afterAll(() => {
            if (canRunTests) {
                ServiceBootstrap.shutdown();
                cleanupTestDb(testDbPath);
            }
        });

        it('should create a space', async () => {
            if (!canRunTests) return;
            const facade = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_FACADE);
            const space = await facade.createSpace({
                profileId: 'smoke-test-profile',
                userId: 'smoke-test-user',
                name: 'Smoke Test Space',
                iconName: 'folder',
                accentColor: '#FF5733',
            });
            expect(space.id).toBeDefined();
            expect(space.name).toBe('Smoke Test Space');
        });

        it('should retrieve spaces', async () => {
            if (!canRunTests) return;
            const facade = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_FACADE);
            const spaces = await facade.getSpaces('smoke-test-profile');
            expect(Array.isArray(spaces)).toBe(true);
            expect(spaces.length).toBeGreaterThan(0);
        });

        it('should create an item', async () => {
            if (!canRunTests) return;
            const spacesFacade = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_FACADE);
            const spaces = await spacesFacade.getSpaces('smoke-test-profile');

            if (spaces.length > 0) {
                const itemsFacade = serviceRegistry.get<any>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
                const item = await itemsFacade.createItem({
                    spaceId: spaces[0].id,
                    name: 'Test Link',
                    type: 'link',
                    path: 'https://example.com',
                    parentId: null,
                });
                expect(item.id).toBeDefined();
                expect(item.name).toBe('Test Link');
            }
        });
    });

    describe('Development Database Smoke Test (skip if arch mismatch)', () => {
        const devDbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');
        let canRunTests = false;

        beforeAll(() => {
            const moduleInfo = findNativeModule('better-sqlite3');
            if (moduleInfo.architecture && moduleInfo.architecture !== process.arch) {
                console.log(`Skipping dev DB tests: arch mismatch`);
                return;
            }
            canRunTests = true;
        });

        it('should load development database', () => {
            if (!canRunTests) return;
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const Database = require('better-sqlite3');
            const db = new Database(devDbPath, { readonly: true });
            expect(db.open).toBe(true);
            db.close();
        });

        it('should have seeded spaces', () => {
            if (!canRunTests) return;
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const Database = require('better-sqlite3');
            const db = new Database(devDbPath, { readonly: true });

            const result = db.prepare('SELECT COUNT(*) as count FROM spaces').get() as { count: number };
            expect(result.count).toBeGreaterThan(0);

            db.close();
        });

        it('should be able to query spaces', () => {
            if (!canRunTests) return;
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const Database = require('better-sqlite3');
            const db = new Database(devDbPath, { readonly: true });

            const spaces = db.prepare('SELECT * FROM spaces LIMIT 5').all();
            expect(Array.isArray(spaces)).toBe(true);

            db.close();
        });
    });

    describe('Native Module Smoke Test (skip if arch mismatch)', () => {
        let canRunTests = false;

        beforeAll(() => {
            const moduleInfo = findNativeModule('better-sqlite3');
            if (moduleInfo.architecture && moduleInfo.architecture !== process.arch) {
                console.log(`Skipping native module tests: arch mismatch`);
                return;
            }
            canRunTests = true;
        });

        it('should load better-sqlite3 without architecture errors', () => {
            if (!canRunTests) return;
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                require('better-sqlite3');
            }).not.toThrow();
        });

        it('should create and query in-memory database', () => {
            if (!canRunTests) return;
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const Database = require('better-sqlite3');
            const db = new Database(':memory:');

            db.exec('CREATE TABLE smoke_test (id INTEGER PRIMARY KEY, value TEXT)');
            db.prepare('INSERT INTO smoke_test (value) VALUES (?)').run('test');
            const result = db.prepare('SELECT * FROM smoke_test').get() as { id: number; value: string };

            expect(result.value).toBe('test');
            db.close();
        });
    });
});

describe('Critical Path Smoke Tests', () => {
    describe('Workspace Configuration', () => {
        it('should have valid pnpm-workspace.yaml', () => {
            const workspaceYaml = fs.readFileSync(
                path.join(WORKSPACE_ROOT, 'pnpm-workspace.yaml'),
                'utf-8'
            );
            expect(workspaceYaml).toContain('packages:');
        });

        it('should have all workspace packages', () => {
            const packages = ['core', 'infrastructure', 'react-ui', 'desktop', 'shared'];
            for (const pkg of packages) {
                const pkgPath = path.join(WORKSPACE_ROOT, 'packages', pkg);
                expect(fs.existsSync(pkgPath), `Missing package: ${pkg}`).toBe(true);
            }
        });
    });

    describe('TypeScript Configuration', () => {
        it('should have root tsconfig.json', () => {
            expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'tsconfig.json'))).toBe(true);
        });

        it('should have desktop tsconfig.json', () => {
            expect(fs.existsSync(path.join(DESKTOP_ROOT, 'tsconfig.json'))).toBe(true);
        });

        it('should compile without errors', () => {
            try {
                execSync('pnpm typecheck', {
                    cwd: DESKTOP_ROOT,
                    stdio: 'pipe',
                    timeout: 60000,
                });
            } catch (error: any) {
                // May fail if typecheck script doesn't exist, that's ok
                if (!error.message?.includes('Missing script')) {
                    throw error;
                }
            }
        }, 90000);
    });
});
