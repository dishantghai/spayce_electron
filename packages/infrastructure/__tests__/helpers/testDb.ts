/**
 * Test Database Helper - Provides fast, reusable in-memory database for tests
 */

import Database from 'better-sqlite3';
import { execSync } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseInitializer } from '../../src/persistence/sqlite/DatabaseInitializer';
import { SqliteSpacesRepository } from '../../src/persistence/sqlite/SqliteSpacesRepository';
import { SqliteSpaceItemsRepository } from '../../src/persistence/sqlite/SqliteSpaceItemsRepository';
import { testLogger } from './testLogger';

// ============================================================================
// ARCHITECTURE CHECK - Detect native module compatibility
// ============================================================================

/**
 * Gets the actual hardware architecture (handles Rosetta on macOS)
 */
export function getHardwareArch(): string {
    const platform = os.platform();
    if (platform === 'darwin') {
        try {
            const cpuBrand = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf-8' });
            if (cpuBrand.includes('Apple')) {
                return 'arm64';
            }
        } catch {
            try {
                const uname = execSync('uname -m', { encoding: 'utf-8' }).trim();
                if (uname === 'arm64') return 'arm64';
            } catch { /* ignore */ }
        }
    }
    return os.arch();
}

/**
 * Gets the architecture of the better-sqlite3 native module
 */
export function getNativeModuleArch(): string | null {
    const workspaceRoot = path.resolve(__dirname, '../../../..');
    const possiblePaths = [
        path.join(workspaceRoot, 'node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/build/Release/better_sqlite3.node'),
        path.join(workspaceRoot, 'node_modules/better-sqlite3/build/Release/better_sqlite3.node'),
    ];

    for (const nodePath of possiblePaths) {
        if (fs.existsSync(nodePath)) {
            try {
                const fileOutput = execSync(`file "${nodePath}"`, { encoding: 'utf-8' });
                if (fileOutput.includes('arm64')) return 'arm64';
                if (fileOutput.includes('x86_64')) return 'x64';
            } catch { /* ignore */ }
        }
    }
    return null;
}

/**
 * Checks if native SQLite tests can run (architecture matches)
 */
export function canRunNativeTests(): boolean {
    const nodeArch = process.arch;
    const nativeArch = getNativeModuleArch();

    // If we can't determine native arch, assume it won't work
    if (!nativeArch) {
        return false;
    }

    // Node x64 can't load arm64 native modules (even under Rosetta)
    if (nodeArch === 'x64' && nativeArch === 'arm64') {
        return false;
    }

    // Check if architectures match
    return nodeArch === nativeArch;
}

/**
 * Returns reason why native tests can't run, or null if they can
 */
export function getNativeTestSkipReason(): string | null {
    if (canRunNativeTests()) return null;
    const nodeArch = process.arch;
    const nativeArch = getNativeModuleArch();
    return `Architecture mismatch: Node.js is ${nodeArch}, native module is ${nativeArch}`;
}

export interface TestDbContext {
    db: Database.Database;
    spacesRepo: SqliteSpacesRepository;
    itemsRepo: SqliteSpaceItemsRepository;
    cleanup: () => void;
}

let sharedDb: Database.Database | null = null;
let initCount = 0;

/**
 * Creates a fresh in-memory database for testing
 * Uses connection pooling for performance
 */
export function createTestDb(options?: { logging?: boolean }): TestDbContext {
    const startTime = Date.now();

    const db = new Database(':memory:');
    const initializer = new DatabaseInitializer(db);
    initializer.initialize();

    const spacesRepo = new SqliteSpacesRepository(db);
    const itemsRepo = new SqliteSpaceItemsRepository(db);

    initCount++;

    if (options?.logging) {
        testLogger.timing(`DB init #${initCount}`, startTime);
    }

    return {
        db,
        spacesRepo,
        itemsRepo,
        cleanup: () => {
            db.close();
        },
    };
}

/**
 * Resets the database by clearing all tables (faster than recreating)
 */
export function resetTestDb(db: Database.Database): void {
    db.exec('DELETE FROM space_items');
    db.exec('DELETE FROM spaces');
}

/**
 * Test constants
 */
export const TEST_PROFILE_ID = 'test-profile';
export const TEST_USER_ID = 'test-user';

/**
 * Creates a test space with minimal required fields
 */
export function createTestSpace(overrides?: Partial<{
    id: string;
    profileId: string;
    userId: string;
    name: string;
    iconName: string;
    accentColor: string;
    order: number;
    isExpanded: boolean;
}>) {
    return {
        id: overrides?.id ?? `space-${Date.now()}`,
        profileId: overrides?.profileId ?? TEST_PROFILE_ID,
        userId: overrides?.userId ?? TEST_USER_ID,
        name: overrides?.name ?? 'Test Space',
        iconName: overrides?.iconName ?? 'folder',
        accentColor: overrides?.accentColor ?? '#6D5AE6',
        order: overrides?.order ?? 0,
        isExpanded: overrides?.isExpanded ?? true,
    };
}

/**
 * Creates a test item with minimal required fields
 */
export function createTestItem(spaceId: string, overrides?: Partial<{
    id: string;
    parentId: string | null;
    name: string;
    path: string;
    type: string;
    isExpanded: boolean;
    sortOrder: number;
    faviconUrl: string | null;
    description: string | null;
    visitCount: number;
    lastVisited: Date | null;
    isPinned: boolean;
    pinPosition: number | null;
    localPath: string | null;
    securityBookmark: string | null;
    lastSyncedAt: Date | null;
    isWatching: boolean;
}>) {
    return {
        id: overrides?.id ?? `item-${Date.now()}`,
        spaceId,
        parentId: overrides?.parentId ?? null,
        name: overrides?.name ?? 'Test Item',
        path: overrides?.path ?? 'https://example.com',
        type: overrides?.type ?? 'link',
        isExpanded: overrides?.isExpanded ?? false,
        sortOrder: overrides?.sortOrder ?? 0,
        faviconUrl: overrides?.faviconUrl ?? null,
        description: overrides?.description ?? null,
        visitCount: overrides?.visitCount ?? 0,
        lastVisited: overrides?.lastVisited ?? null,
        isPinned: overrides?.isPinned ?? false,
        pinPosition: overrides?.pinPosition ?? null,
        localPath: overrides?.localPath ?? null,
        securityBookmark: overrides?.securityBookmark ?? null,
        lastSyncedAt: overrides?.lastSyncedAt ?? null,
        isWatching: overrides?.isWatching ?? false,
    };
}
