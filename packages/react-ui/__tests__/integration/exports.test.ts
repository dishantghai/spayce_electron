import { describe, it, expect } from 'vitest';

describe('React-UI Package Integration - Exports', () => {
    describe('Theme Exports', () => {
        it('should export SpayceColors', async () => {
            const { SpayceColors } = await import('@spayce/react-ui');
            expect(SpayceColors).toBeDefined();
            expect(SpayceColors.primary).toBeDefined();
            expect(SpayceColors.backgroundDark).toBeDefined();
        });

        it('should export SpayceSpacing', async () => {
            const { SpayceSpacing } = await import('@spayce/react-ui');
            expect(SpayceSpacing).toBeDefined();
            expect(SpayceSpacing.xs).toBeDefined();
            expect(SpayceSpacing.md).toBeDefined();
        });

        it('should export SpayceTypography', async () => {
            const { SpayceTypography } = await import('@spayce/react-ui');
            expect(SpayceTypography).toBeDefined();
        });

        it('should export SpaceThemes', async () => {
            const { SpaceThemes } = await import('@spayce/react-ui');
            expect(SpaceThemes).toBeDefined();
            expect(Array.isArray(SpaceThemes)).toBe(true);
        });
    });

    describe('Component Exports', () => {
        it('should export Sidebar component', async () => {
            const { Sidebar } = await import('@spayce/react-ui');
            expect(Sidebar).toBeDefined();
            expect(typeof Sidebar).toBe('function');
        });

        it('should export SpacesScreen component', async () => {
            const { SpacesScreen } = await import('@spayce/react-ui');
            expect(SpacesScreen).toBeDefined();
            expect(typeof SpacesScreen).toBe('function');
        });

        it('should export ContextMenu component', async () => {
            const { ContextMenu } = await import('@spayce/react-ui');
            expect(ContextMenu).toBeDefined();
            expect(typeof ContextMenu).toBe('function');
        });

        it('should export TreeView component', async () => {
            const { TreeView } = await import('@spayce/react-ui');
            expect(TreeView).toBeDefined();
            expect(typeof TreeView).toBe('function');
        });

        it('should export SpaceCard component', async () => {
            const { SpaceCard } = await import('@spayce/react-ui');
            expect(SpaceCard).toBeDefined();
            expect(typeof SpaceCard).toBe('function');
        });

        it('should export SidebarTabs component', async () => {
            const { SidebarTabs } = await import('@spayce/react-ui');
            expect(SidebarTabs).toBeDefined();
            expect(typeof SidebarTabs).toBe('function');
        });

        it('should export CreateSpaceView component', async () => {
            const { CreateSpaceView } = await import('@spayce/react-ui');
            expect(CreateSpaceView).toBeDefined();
            expect(typeof CreateSpaceView).toBe('function');
        });
    });

    describe('Store Exports', () => {
        it('should export useNavigationUiStore', async () => {
            const { useNavigationUiStore } = await import('@spayce/react-ui');
            expect(useNavigationUiStore).toBeDefined();
            expect(typeof useNavigationUiStore).toBe('function');
        });

        it('should export useDragDropUiStore', async () => {
            const { useDragDropUiStore } = await import('@spayce/react-ui');
            expect(useDragDropUiStore).toBeDefined();
            expect(typeof useDragDropUiStore).toBe('function');
        });

        it('should export store enums via stores module', async () => {
            const stores = await import('@spayce/react-ui');
            expect(stores).toBeDefined();
            expect(stores.useNavigationUiStore).toBeDefined();
        });
    });

    describe('Type Exports', () => {
        it('should export SpaceItemType enum', async () => {
            const { SpaceItemType } = await import('@spayce/react-ui');
            expect(SpaceItemType).toBeDefined();
            expect(SpaceItemType.link).toBe('link');
            expect(SpaceItemType.folder).toBe('folder');
        });

        it('should export TabType enum', async () => {
            const { TabType } = await import('@spayce/react-ui');
            expect(TabType).toBeDefined();
            expect(TabType.web).toBe('web');
        });
    });

    describe('Error Components', () => {
        it('should export ErrorFallback component', async () => {
            const { ErrorFallback } = await import('@spayce/react-ui');
            expect(ErrorFallback).toBeDefined();
            expect(typeof ErrorFallback).toBe('function');
        });

        it('should export DomainErrorBoundary component', async () => {
            const { DomainErrorBoundary } = await import('@spayce/react-ui');
            expect(DomainErrorBoundary).toBeDefined();
        });

        it('should export GlobalErrorBoundary component', async () => {
            const { GlobalErrorBoundary } = await import('@spayce/react-ui');
            expect(GlobalErrorBoundary).toBeDefined();
        });
    });
});
