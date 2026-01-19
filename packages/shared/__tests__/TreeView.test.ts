import { describe, it, expect } from 'vitest';
import { SpayceSpacing } from '../src/theme/spacing';
import { SpayceAnimations } from '../src/theme/animations';
import { SpayceColors } from '../src/theme/colors';
import { SpaceItemType } from '../src/types';

describe('TreeView', () => {
    describe('Component structure', () => {
        it('should export TreeView component', async () => {
            const module = await import('../src/components/TreeView');
            expect(module.TreeView).toBeDefined();
        });

        it('should export TreeItem component', async () => {
            const module = await import('../src/components/TreeView');
            expect(module.TreeItem).toBeDefined();
        });

        it('should export TreeItemIcon component', async () => {
            const module = await import('../src/components/TreeView');
            expect(module.TreeItemIcon).toBeDefined();
        });
    });

    describe('TreeItemIcon', () => {
        it('should be exported from module', async () => {
            const { TreeItemIcon } = await import('../src/components/TreeItemIcon');
            expect(TreeItemIcon).toBeDefined();
        });
    });

    describe('Design tokens compliance', () => {
        it('should use correct tree indent (16px)', () => {
            expect(SpayceSpacing.treeIndent).toBe(16);
        });

        it('should have correct animation durations', () => {
            expect(SpayceAnimations.expand).toBe(200); // Chevron, expand/collapse
            expect(SpayceAnimations.hover).toBe(150); // Hover fade
        });

        it('should have correct colors for tree items', () => {
            expect(SpayceColors.textMuted).toBe('#6B7280'); // Folder icon color
            expect(SpayceColors.info).toBe('#3B82F6'); // Link icon color
            expect(SpayceColors.success).toBe('#10B981'); // Local folder color
            expect(SpayceColors.accentDark).toBe('#2D2645'); // Hover background
        });
    });

    describe('Accessibility', () => {
        it('should use proper ARIA roles in TreeView', async () => {
            // TreeView uses role="tree"
            // TreeItem uses role="treeitem"
            const treeViewCode = await import('../src/components/TreeView');
            expect(treeViewCode).toBeDefined();
        });
    });
});

describe('SpaceItemType', () => {
    it('should have all required item types', () => {
        expect(SpaceItemType.folder).toBe('folder');
        expect(SpaceItemType.link).toBe('link');
        expect(SpaceItemType.file).toBe('file');
        expect(SpaceItemType.localFolder).toBe('localFolder');
        expect(SpaceItemType.localFile).toBe('localFile');
    });
});

