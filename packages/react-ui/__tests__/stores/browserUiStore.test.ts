/**
 * browserUiStore Tests
 * Bug B018: Multi-Tab Store Synchronization
 *
 * Tests for view registration/unregistration used for multi-tab sync.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBrowserUiStore, ensureBrowserViewsExist } from '../../src/stores/browserUiStore';

// Mock browser API
const mockBrowserAPI = {
    createView: vi.fn(),
    setActiveView: vi.fn(),
    destroyView: vi.fn(),
    loadURL: vi.fn(),
    goBack: vi.fn(),
    goForward: vi.fn(),
    reload: vi.fn(),
    stop: vi.fn(),
    setBounds: vi.fn(),
    setVisibility: vi.fn(),
    onLoading: vi.fn(() => vi.fn()),
    onNavigated: vi.fn(() => vi.fn()),
    onTitle: vi.fn(() => vi.fn()),
    onFavicon: vi.fn(() => vi.fn()),
    onProgress: vi.fn(() => vi.fn()),
    onError: vi.fn(() => vi.fn()),
};

beforeEach(() => {
    (window as any).electronAPI = {
        ...(window as any).electronAPI,
        browser: mockBrowserAPI,
    };
});

describe('browserUiStore', () => {
    beforeEach(() => {
        // Reset store state
        useBrowserUiStore.setState({
            activeViewId: null,
            views: new Map(),
            isInitialized: false,
            initError: null,
        });
        vi.clearAllMocks();
    });

    describe('registerView (B018)', () => {
        it('should add a view to the views Map', () => {
            useBrowserUiStore.getState().registerView('view-1', 'https://www.google.com');

            const views = useBrowserUiStore.getState().views;
            expect(views.has('view-1')).toBe(true);
            const view = views.get('view-1')!;
            expect(view.id).toBe('view-1');
            expect(view.url).toBe('https://www.google.com');
            expect(view.title).toBe('New Tab');
        });

        it('should use default URL when none provided', () => {
            useBrowserUiStore.getState().registerView('view-1');

            const view = useBrowserUiStore.getState().views.get('view-1')!;
            expect(view.url).toBe('https://www.google.com');
        });

        it('should not overwrite existing view', () => {
            useBrowserUiStore.getState().registerView('view-1', 'https://www.google.com');
            // Simulate title update
            useBrowserUiStore.getState().handleTitleEvent('view-1', 'Google');

            // Register again - should NOT overwrite
            useBrowserUiStore.getState().registerView('view-1', 'https://example.com');

            const view = useBrowserUiStore.getState().views.get('view-1')!;
            expect(view.title).toBe('Google'); // Should retain updated title
        });
    });

    describe('unregisterView (B018)', () => {
        it('should remove a view from the views Map', () => {
            useBrowserUiStore.getState().registerView('view-1');
            expect(useBrowserUiStore.getState().views.has('view-1')).toBe(true);

            useBrowserUiStore.getState().unregisterView('view-1');
            expect(useBrowserUiStore.getState().views.has('view-1')).toBe(false);
        });

        it('should clear activeViewId if removing active view', () => {
            useBrowserUiStore.getState().registerView('view-1');
            useBrowserUiStore.setState({ activeViewId: 'view-1' });

            useBrowserUiStore.getState().unregisterView('view-1');

            expect(useBrowserUiStore.getState().activeViewId).toBeNull();
        });

        it('should not affect activeViewId when removing non-active view', () => {
            useBrowserUiStore.getState().registerView('view-1');
            useBrowserUiStore.getState().registerView('view-2');
            useBrowserUiStore.setState({ activeViewId: 'view-1' });

            useBrowserUiStore.getState().unregisterView('view-2');

            expect(useBrowserUiStore.getState().activeViewId).toBe('view-1');
        });

        it('should be safe to call for non-existent view', () => {
            useBrowserUiStore.getState().unregisterView('non-existent');
            // No error thrown
            expect(useBrowserUiStore.getState().views.size).toBe(0);
        });
    });

    describe('event handlers with registered views (B018)', () => {
        it('should update title for registered view', () => {
            useBrowserUiStore.getState().registerView('view-1');

            useBrowserUiStore.getState().handleTitleEvent('view-1', 'Google');

            const view = useBrowserUiStore.getState().views.get('view-1')!;
            expect(view.title).toBe('Google');
        });

        it('should update favicon for registered view', () => {
            useBrowserUiStore.getState().registerView('view-1');

            useBrowserUiStore.getState().handleFaviconEvent('view-1', 'https://google.com/favicon.ico');

            const view = useBrowserUiStore.getState().views.get('view-1')!;
            expect(view.faviconUrl).toBe('https://google.com/favicon.ico');
        });

        it('should update loading state for registered view', () => {
            useBrowserUiStore.getState().registerView('view-1');

            useBrowserUiStore.getState().handleLoadingEvent('view-1', true);

            const view = useBrowserUiStore.getState().views.get('view-1')!;
            expect(view.isLoading).toBe(true);
        });

        it('should auto-register and apply events for unregistered views (B019)', () => {
            // No views registered - events should auto-register (race condition fix)
            useBrowserUiStore.getState().handleTitleEvent('auto-1', 'Title');
            useBrowserUiStore.getState().handleFaviconEvent('auto-2', 'url');
            useBrowserUiStore.getState().handleLoadingEvent('auto-3', true);
            // Views should be auto-registered
            expect(useBrowserUiStore.getState().views.size).toBe(3);
            expect(useBrowserUiStore.getState().views.get('auto-1')!.title).toBe('Title');
        });
    });

    describe('ensureBrowserViewsExist (B020)', () => {
        it('should call createView IPC for all tabs', async () => {
            mockBrowserAPI.createView.mockResolvedValue({ success: true });
            mockBrowserAPI.setActiveView.mockResolvedValue({ success: true });

            const tabs = [
                { id: 'tab-1', url: 'https://www.google.com' },
                { id: 'tab-2', url: 'https://example.com' },
            ];

            await ensureBrowserViewsExist(tabs, 'tab-1');

            expect(mockBrowserAPI.createView).toHaveBeenCalledTimes(2);
            expect(mockBrowserAPI.createView).toHaveBeenCalledWith('tab-1', { url: 'https://www.google.com' });
            expect(mockBrowserAPI.createView).toHaveBeenCalledWith('tab-2', { url: 'https://example.com' });
        });

        it('should call setActiveView IPC for active tab', async () => {
            mockBrowserAPI.createView.mockResolvedValue({ success: true });
            mockBrowserAPI.setActiveView.mockResolvedValue({ success: true });

            await ensureBrowserViewsExist(
                [{ id: 'tab-1', url: 'https://www.google.com' }],
                'tab-1',
            );

            expect(mockBrowserAPI.setActiveView).toHaveBeenCalledWith('tab-1');
        });

        it('should not call setActiveView when no active tab', async () => {
            mockBrowserAPI.createView.mockResolvedValue({ success: true });
            mockBrowserAPI.setActiveView.mockResolvedValue({ success: true });

            await ensureBrowserViewsExist(
                [{ id: 'tab-1', url: 'https://www.google.com' }],
                null,
            );

            expect(mockBrowserAPI.createView).toHaveBeenCalledTimes(1);
            expect(mockBrowserAPI.setActiveView).not.toHaveBeenCalled();
        });

        it('should continue if createView fails for one tab', async () => {
            mockBrowserAPI.createView
                .mockRejectedValueOnce(new Error('fail'))
                .mockResolvedValueOnce({ success: true });
            mockBrowserAPI.setActiveView.mockResolvedValue({ success: true });

            const tabs = [
                { id: 'tab-1', url: 'https://www.google.com' },
                { id: 'tab-2', url: 'https://example.com' },
            ];

            await ensureBrowserViewsExist(tabs, 'tab-2');

            // Both called even though first one failed
            expect(mockBrowserAPI.createView).toHaveBeenCalledTimes(2);
            expect(mockBrowserAPI.setActiveView).toHaveBeenCalledWith('tab-2');
        });

        it('should be safe when browser API is unavailable', async () => {
            (window as any).electronAPI = undefined;

            // Should not throw
            await expect(
                ensureBrowserViewsExist([{ id: 'tab-1', url: 'https://google.com' }], 'tab-1')
            ).resolves.not.toThrow();
        });
    });

    describe('auto-registration on events (B019)', () => {
        it('should auto-register view on loading event for unknown viewId', () => {
            // No view registered - simulating race condition
            useBrowserUiStore.getState().handleLoadingEvent('new-view', true);

            // View should be auto-registered with loading state
            const view = useBrowserUiStore.getState().views.get('new-view');
            expect(view).toBeDefined();
            expect(view!.isLoading).toBe(true);
        });

        it('should auto-register view on title event for unknown viewId', () => {
            useBrowserUiStore.getState().handleTitleEvent('new-view', 'Google');

            const view = useBrowserUiStore.getState().views.get('new-view');
            expect(view).toBeDefined();
            expect(view!.title).toBe('Google');
        });

        it('should auto-register view on favicon event for unknown viewId', () => {
            useBrowserUiStore.getState().handleFaviconEvent('new-view', 'https://google.com/favicon.ico');

            const view = useBrowserUiStore.getState().views.get('new-view');
            expect(view).toBeDefined();
            expect(view!.faviconUrl).toBe('https://google.com/favicon.ico');
        });

        it('should auto-register view on navigated event for unknown viewId', () => {
            useBrowserUiStore.getState().handleNavigatedEvent('new-view', 'https://google.com', false, false, true);

            const view = useBrowserUiStore.getState().views.get('new-view');
            expect(view).toBeDefined();
            expect(view!.url).toBe('https://google.com');
            expect(view!.isSecure).toBe(true);
        });

        it('should handle full loading cycle with auto-registration', () => {
            // Simulate: loading starts, navigation happens, title updates, loading stops
            useBrowserUiStore.getState().handleLoadingEvent('view-1', true);
            useBrowserUiStore.getState().handleNavigatedEvent('view-1', 'https://google.com', false, false, true);
            useBrowserUiStore.getState().handleTitleEvent('view-1', 'Google');
            useBrowserUiStore.getState().handleFaviconEvent('view-1', 'https://google.com/favicon.ico');
            useBrowserUiStore.getState().handleLoadingEvent('view-1', false);

            const view = useBrowserUiStore.getState().views.get('view-1')!;
            expect(view.isLoading).toBe(false);
            expect(view.url).toBe('https://google.com');
            expect(view.title).toBe('Google');
            expect(view.faviconUrl).toBe('https://google.com/favicon.ico');
        });
    });
});
