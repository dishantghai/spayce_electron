/**
 * IPC Contract Tests
 * 
 * These tests verify that the IPC (Inter-Process Communication) contract
 * between the main process and renderer process is consistent.
 * 
 * CRITICAL: These tests catch mismatches between preload script API
 * and main process handlers that would cause runtime failures.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
    DESKTOP_ROOT,
    EXPECTED_IPC_CHANNELS,
    extractIpcChannelsFromSource,
    getTestDbPath,
    cleanupTestDb,
    findNativeModule,
} from '../setup/test-utils';
import { ServiceBootstrap, serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';

describe('IPC Contract', () => {
    describe('Channel Definition Consistency', () => {
        const handlersPath = path.join(DESKTOP_ROOT, 'src', 'main', 'ipc', 'handlers.ts');
        const preloadPath = path.join(DESKTOP_ROOT, 'src', 'preload', 'index.ts');

        it('should have handlers file', () => {
            expect(fs.existsSync(handlersPath)).toBe(true);
        });

        it('should have preload file', () => {
            expect(fs.existsSync(preloadPath)).toBe(true);
        });

        it('should have matching channels in handlers and preload', () => {
            const handlerChannels = extractIpcChannelsFromSource(handlersPath);
            const preloadChannels = extractIpcChannelsFromSource(preloadPath);

            // Channels that are temporarily disabled (not implemented in facade yet)
            const disabledChannels = ['items:pasteItem', 'items:refreshLocalFolder'];

            // Every channel in preload should have a handler
            for (const channel of preloadChannels) {
                expect(handlerChannels, `Missing handler for channel: ${channel}`).toContain(channel);
            }

            // Every handler should be exposed in preload (or be internal/disabled)
            for (const channel of handlerChannels) {
                // Allow internal channels and disabled channels that aren't exposed
                if (!channel.startsWith('internal:') && !disabledChannels.includes(channel)) {
                    expect(preloadChannels, `Handler ${channel} not exposed in preload`).toContain(channel);
                }
            }
        });

        it('should have all expected channels defined', () => {
            const handlerChannels = extractIpcChannelsFromSource(handlersPath);

            for (const expected of EXPECTED_IPC_CHANNELS) {
                expect(handlerChannels, `Missing expected channel: ${expected.name}`).toContain(expected.name);
            }
        });
    });

    describe('Preload API Structure', () => {
        const preloadPath = path.join(DESKTOP_ROOT, 'src', 'preload', 'index.ts');
        let preloadContent: string;

        beforeAll(() => {
            preloadContent = fs.readFileSync(preloadPath, 'utf-8');
        });

        it('should use contextBridge.exposeInMainWorld', () => {
            expect(preloadContent).toContain('contextBridge.exposeInMainWorld');
        });

        it('should expose electronAPI', () => {
            expect(preloadContent).toContain("'electronAPI'");
        });

        it('should have spaces namespace', () => {
            expect(preloadContent).toContain('spaces:');
            expect(preloadContent).toContain('getAll:'); // spaces.getAll
        });

        it('should have items namespace', () => {
            expect(preloadContent).toContain('items:');
            expect(preloadContent).toContain('getBySpace:'); // items.getBySpace
        });

        it('should have search namespace', () => {
            expect(preloadContent).toContain('search:');
        });

        it('should have app namespace', () => {
            expect(preloadContent).toContain('app:');
        });

        it('should have event listener support', () => {
            expect(preloadContent).toContain('on:');
            expect(preloadContent).toContain('ipcRenderer.on');
            expect(preloadContent).toContain('removeListener');
        });

        it('should export ElectronAPI type', () => {
            expect(preloadContent).toContain('export type ElectronAPI');
            expect(preloadContent).toContain('typeof electronAPI');
        });
    });

    describe('Handler Implementation', () => {
        const handlersPath = path.join(DESKTOP_ROOT, 'src', 'main', 'ipc', 'handlers.ts');
        let handlersContent: string;

        beforeAll(() => {
            handlersContent = fs.readFileSync(handlersPath, 'utf-8');
        });

        it('should export registerIpcHandlers function', () => {
            expect(handlersContent).toContain('export function registerIpcHandlers');
        });

        it('should use ipcMain.handle for async operations', () => {
            expect(handlersContent).toContain('ipcMain.handle');
        });

        it('should use service registry for dependencies', () => {
            expect(handlersContent).toContain('serviceRegistry.get');
        });

        it('should use SpacesFacade for space operations', () => {
            expect(handlersContent).toContain('SpacesFacade');
            expect(handlersContent).toContain('SERVICE_KEYS.SPACES_FACADE');
        });

        it('should use SpaceItemsFacade for item operations', () => {
            expect(handlersContent).toContain('SpaceItemsFacade');
            expect(handlersContent).toContain('SERVICE_KEYS.SPACE_ITEMS_FACADE');
        });

        it('should use SearchFacade for search operations', () => {
            expect(handlersContent).toContain('SearchFacade');
            expect(handlersContent).toContain('SERVICE_KEYS.SEARCH_FACADE');
        });

        it('should log when handlers are registered', () => {
            expect(handlersContent).toContain('IPC handlers registered');
        });
    });

    describe('IPC Handler Integration (skip if arch mismatch)', () => {
        let testDbPath: string;
        let canRunIntegrationTests = false;

        beforeAll(() => {
            // Check if we can run integration tests (requires native module)
            const moduleInfo = findNativeModule('better-sqlite3');
            const nodeArch = process.arch;

            if (moduleInfo.architecture && moduleInfo.architecture !== nodeArch) {
                console.log(`Skipping IPC integration tests: arch mismatch (Node: ${nodeArch}, Module: ${moduleInfo.architecture})`);
                return;
            }

            canRunIntegrationTests = true;
            testDbPath = getTestDbPath();
            ServiceBootstrap.initialize({ databasePath: testDbPath });
        });

        afterAll(() => {
            if (canRunIntegrationTests) {
                ServiceBootstrap.shutdown();
                cleanupTestDb(testDbPath);
            }
        });

        it('should have SpacesFacade registered after bootstrap', () => {
            if (!canRunIntegrationTests) return;
            expect(serviceRegistry.has(SERVICE_KEYS.SPACES_FACADE)).toBe(true);
        });

        it('should have SpaceItemsFacade registered after bootstrap', () => {
            if (!canRunIntegrationTests) return;
            expect(serviceRegistry.has(SERVICE_KEYS.SPACE_ITEMS_FACADE)).toBe(true);
        });

        it('should have SearchFacade registered after bootstrap', () => {
            if (!canRunIntegrationTests) return;
            expect(serviceRegistry.has(SERVICE_KEYS.SEARCH_FACADE)).toBe(true);
        });

        it('should be able to get spaces via facade', async () => {
            if (!canRunIntegrationTests) return;
            const facade = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_FACADE);
            const result = await facade.getSpaces('test-profile');
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });

        it('should be able to create and retrieve a space', async () => {
            if (!canRunIntegrationTests) return;
            const facade = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_FACADE);

            const createResult = await facade.createSpace({
                profileId: 'test-profile',
                userId: 'test-user',
                name: 'Test Space',
                iconName: 'folder',
                accentColor: '#6D5AE6',
            });

            expect(createResult.success).toBe(true);
            expect(createResult.data.name).toBe('Test Space');

            const getResult = await facade.getSpaces('test-profile');
            expect(getResult.success).toBe(true);
            expect(getResult.data.some((s: any) => s.name === 'Test Space')).toBe(true);
        });
    });
});

describe('IPC Security', () => {
    const preloadPath = path.join(DESKTOP_ROOT, 'src', 'preload', 'index.ts');
    let preloadContent: string;

    beforeAll(() => {
        preloadContent = fs.readFileSync(preloadPath, 'utf-8');
    });

    it('should not expose dangerous APIs', () => {
        // Should not expose Node.js APIs directly
        expect(preloadContent).not.toContain('require(');
        expect(preloadContent).not.toContain('process.env');
        expect(preloadContent).not.toContain('fs.');
        expect(preloadContent).not.toContain('child_process');
    });

    it('should use ipcRenderer.invoke (not send) for data operations', () => {
        // invoke returns a promise and waits for response
        // send is fire-and-forget which is less safe for data ops
        const invokeCount = (preloadContent.match(/ipcRenderer\.invoke/g) || []).length;
        expect(invokeCount).toBeGreaterThan(10); // We have many data operations
    });

    it('should clean up event listeners', () => {
        // The 'on' function should return a cleanup function
        expect(preloadContent).toContain('removeListener');
    });
});

describe('IPC Type Safety', () => {
    const preloadPath = path.join(DESKTOP_ROOT, 'src', 'preload', 'index.ts');
    let preloadContent: string;

    beforeAll(() => {
        preloadContent = fs.readFileSync(preloadPath, 'utf-8');
    });

    it('should have typed input parameters', () => {
        // Check that functions have typed parameters
        expect(preloadContent).toMatch(/\(profileId:\s*string\)/);
        expect(preloadContent).toMatch(/\(spaceId:\s*string\)/);
    });

    it('should have typed input objects', () => {
        // Check for typed input objects
        expect(preloadContent).toContain('input: {');
    });

    it('should export ElectronAPI type for type safety', () => {
        expect(preloadContent).toContain('export type ElectronAPI');
        // Window declaration is in types/electron.d.ts
        const typesPath = path.join(DESKTOP_ROOT, 'src', 'types', 'electron.d.ts');
        if (fs.existsSync(typesPath)) {
            const typesContent = fs.readFileSync(typesPath, 'utf-8');
            expect(typesContent).toContain('declare global');
            expect(typesContent).toContain('interface Window');
        }
    });
});
