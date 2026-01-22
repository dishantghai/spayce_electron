#!/usr/bin/env npx ts-node
/**
 * Feature Verification Script
 * 
 * Verifies that all Flutter features are implemented in the Electron app.
 * Run with: npx ts-node scripts/verify-features.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface FeatureCheck {
    name: string;
    category: string;
    check: () => boolean;
    required: boolean;
}

const PROJECT_ROOT = path.resolve(__dirname, '..');

const features: FeatureCheck[] = [
    // Space Management
    {
        name: 'Create Space',
        category: 'Space Management',
        check: () => fileContains('packages/core/src/application/use-cases/spaces/CreateSpaceUseCase.ts', 'CreateSpaceUseCase'),
        required: true,
    },
    {
        name: 'Delete Space',
        category: 'Space Management',
        check: () => fileContains('packages/core/src/application/use-cases/spaces/DeleteSpaceUseCase.ts', 'DeleteSpaceUseCase'),
        required: true,
    },
    {
        name: 'Rename Space',
        category: 'Space Management',
        check: () => fileContains('packages/core/src/application/use-cases/spaces/RenameSpaceUseCase.ts', 'RenameSpaceUseCase'),
        required: true,
    },
    {
        name: 'Update Space',
        category: 'Space Management',
        check: () => fileContains('packages/core/src/application/use-cases/spaces/UpdateSpaceUseCase.ts', 'UpdateSpaceUseCase'),
        required: true,
    },
    {
        name: 'Reorder Spaces',
        category: 'Space Management',
        check: () => fileContains('packages/core/src/application/use-cases/spaces/ReorderSpacesUseCase.ts', 'ReorderSpacesUseCase'),
        required: true,
    },

    // Item Management
    {
        name: 'Create Item',
        category: 'Item Management',
        check: () => fileContains('packages/core/src/application/use-cases/items/CreateItemUseCase.ts', 'CreateItemUseCase'),
        required: true,
    },
    {
        name: 'Delete Item',
        category: 'Item Management',
        check: () => fileContains('packages/core/src/application/use-cases/items/DeleteItemUseCase.ts', 'DeleteItemUseCase'),
        required: true,
    },
    {
        name: 'Move Item',
        category: 'Item Management',
        check: () => fileContains('packages/core/src/application/use-cases/items/MoveItemUseCase.ts', 'MoveItemUseCase'),
        required: true,
    },

    // Pin System
    {
        name: 'Pin Item',
        category: 'Pin System',
        check: () => fileContains('packages/core/src/application/use-cases/items/PinItemUseCase.ts', 'PinItemUseCase'),
        required: true,
    },
    {
        name: 'Unpin Item',
        category: 'Pin System',
        check: () => fileContains('packages/core/src/application/use-cases/items/UnpinItemUseCase.ts', 'UnpinItemUseCase'),
        required: true,
    },

    // Repository Methods
    {
        name: 'SQLite Spaces Repository',
        category: 'Infrastructure',
        check: () => fileContains('packages/infrastructure/src/persistence/sqlite/SqliteSpacesRepository.ts', 'SqliteSpacesRepository'),
        required: true,
    },
    {
        name: 'SQLite Items Repository',
        category: 'Infrastructure',
        check: () => fileContains('packages/infrastructure/src/persistence/sqlite/SqliteSpaceItemsRepository.ts', 'SqliteSpaceItemsRepository'),
        required: true,
    },
    {
        name: 'Delete Items By Space ID',
        category: 'Infrastructure',
        check: () => fileContains('packages/infrastructure/src/persistence/sqlite/SqliteSpaceItemsRepository.ts', 'deleteItemsBySpaceId'),
        required: true,
    },
    {
        name: 'Duplicate URL Check',
        category: 'Infrastructure',
        check: () => fileContains('packages/infrastructure/src/persistence/sqlite/SqliteSpaceItemsRepository.ts', 'isDuplicateUrl'),
        required: true,
    },

    // React UI Hooks
    {
        name: 'useSpaces Hook',
        category: 'React UI',
        check: () => fileExists('packages/react-ui/src/hooks/useSpaces.ts'),
        required: true,
    },
    {
        name: 'useSpaceItems Hook',
        category: 'React UI',
        check: () => fileExists('packages/react-ui/src/hooks/useSpaceItems.ts'),
        required: true,
    },
    {
        name: 'usePinnedItems Hook',
        category: 'React UI',
        check: () => fileExists('packages/react-ui/src/hooks/usePinnedItems.ts'),
        required: true,
    },

    // Local File System (Flutter Parity)
    {
        name: 'LocalFolder Type Support',
        category: 'Local File System',
        check: () => fileContains('packages/core/src/domain/entities/SpaceItem.ts', 'LocalFolder'),
        required: true,
    },
    {
        name: 'LocalFile Type Support',
        category: 'Local File System',
        check: () => fileContains('packages/core/src/domain/entities/SpaceItem.ts', 'LocalFile'),
        required: true,
    },
    {
        name: 'Security Bookmark Field',
        category: 'Local File System',
        check: () => fileContains('packages/core/src/domain/entities/SpaceItem.ts', 'securityBookmark'),
        required: true,
    },
];

function fileExists(relativePath: string): boolean {
    return fs.existsSync(path.join(PROJECT_ROOT, relativePath));
}

function fileContains(relativePath: string, content: string): boolean {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return false;
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    return fileContent.includes(content);
}

function verify(): void {
    console.log('=== Spayce Feature Verification ===\n');

    const results: { category: string; name: string; status: string }[] = [];
    let passed = 0;
    let failed = 0;

    const categories = [...new Set(features.map(f => f.category))];

    for (const category of categories) {
        console.log(`\n${category}:`);
        const categoryFeatures = features.filter(f => f.category === category);

        for (const feature of categoryFeatures) {
            const status = feature.check();
            const statusStr = status ? '✓' : '✗';
            const statusColor = status ? '\x1b[32m' : '\x1b[31m';

            console.log(`  ${statusColor}${statusStr}\x1b[0m ${feature.name}`);

            results.push({ category, name: feature.name, status: status ? 'PASS' : 'FAIL' });

            if (status) {
                passed++;
            } else {
                failed++;
            }
        }
    }

    console.log('\n=== Summary ===');
    console.log(`Total: ${features.length}`);
    console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
    console.log(`Coverage: ${((passed / features.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
        process.exit(1);
    }
}

verify();
