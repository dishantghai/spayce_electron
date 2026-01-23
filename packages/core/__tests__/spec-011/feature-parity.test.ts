/**
 * Spec 011: Feature Parity Tests for Core Package
 * 
 * Note: Most feature parity tests are in packages/infrastructure/__tests__/spec-011/feature-parity.test.ts
 * as they require database access. This file contains core domain-level feature parity checks.
 */

import { describe, it, expect } from 'vitest';
import { SpaceItemType } from '../../src/domain/entities/SpaceItem';

describe('Spec 011: Core Feature Parity', () => {
    describe('SpaceItemType enum parity with Flutter', () => {
        it('should have all Flutter SpaceItemType values', () => {
            // Flutter SpaceItemType: link, file, folder, localFolder, localFile
            expect(SpaceItemType.Link).toBe('link');
            expect(SpaceItemType.File).toBe('file');
            expect(SpaceItemType.Folder).toBe('folder');
            expect(SpaceItemType.LocalFolder).toBe('localFolder');
            expect(SpaceItemType.LocalFile).toBe('localFile');
        });

        it('should have exactly 5 item types', () => {
            const types = Object.values(SpaceItemType);
            expect(types).toHaveLength(5);
        });
    });
});
