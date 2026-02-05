/**
 * tabStore Tests
 * Story F038: Tab State Management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useTabStore, _resetInitializeForTesting } from '../../src/stores/tabStore';

// Mock tab data matching TabEntity shape from @spayce/core
function createMockTab(overrides: Partial<{
    id: string;
    url: string;
    title: string;
    faviconUrl: string | null;
    isActive: boolean;
    isLoading: boolean;
    loadingProgress: number;
    position: number;
    tabType: string;
    originSpaceId: string | null;
    originSpaceItemId: string | null;
    originUrl: string | null;
    isTracked: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
    isSecure: boolean;
    errorCode: number | null;
    errorDescription: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt: Date | null;
}> = {}) {
    return {
        id: overrides.id ?? crypto.randomUUID(),
        url: overrides.url ?? 'https://www.google.com',
        title: overrides.title ?? 'New Tab',
        faviconUrl: overrides.faviconUrl ?? null,
        isActive: overrides.isActive ?? false,
        isLoading: overrides.isLoading ?? false,
        loadingProgress: overrides.loadingProgress ?? 0,
        position: overrides.position ?? 0,
        tabType: overrides.tabType ?? 'web',
        originSpaceId: overrides.originSpaceId ?? null,
        originSpaceItemId: overrides.originSpaceItemId ?? null,
        originUrl: overrides.originUrl ?? null,
        isTracked: overrides.isTracked ?? false,
        canGoBack: overrides.canGoBack ?? false,
        canGoForward: overrides.canGoForward ?? false,
        isSecure: overrides.isSecure ?? true,
        errorCode: overrides.errorCode ?? null,
        errorDescription: overrides.errorDescription ?? null,
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
        lastAccessedAt: overrides.lastAccessedAt ?? null,
    };
}

// Mock IPC API
const mockTabsAPI = {
    getAll: vi.fn(),
    getActive: vi.fn(),
    create: vi.fn(),
    close: vi.fn(),
    switch: vi.fn(),
    update: vi.fn(),
    reorder: vi.fn(),
};

// Setup window.electronAPI.tabs mock (augment, don't replace window)
beforeEach(() => {
    (window as any).electronAPI = {
        ...(window as any).electronAPI,
        tabs: mockTabsAPI,
    };
});

describe('tabStore', () => {
    beforeEach(() => {
        // Reset store state
        useTabStore.setState({
            tabs: [],
            activeTabId: null,
            isInitialized: false,
            initError: null,
        });
        // Reset module-level initialize promise lock (B021)
        _resetInitializeForTesting();
        // Reset mocks
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('should have empty initial state', () => {
            const state = useTabStore.getState();
            expect(state.tabs).toEqual([]);
            expect(state.activeTabId).toBeNull();
            expect(state.isInitialized).toBe(false);
            expect(state.initError).toBeNull();
        });

        it('should be a valid Zustand store', () => {
            expect(typeof useTabStore).toBe('function');
            expect(typeof useTabStore.getState).toBe('function');
            expect(typeof useTabStore.setState).toBe('function');
        });

        it('should have all required actions', () => {
            const state = useTabStore.getState();
            expect(typeof state.initialize).toBe('function');
            expect(typeof state.createTab).toBe('function');
            expect(typeof state.closeTab).toBe('function');
            expect(typeof state.switchTab).toBe('function');
            expect(typeof state.reorderTabs).toBe('function');
            expect(typeof state.updateTabFromEvent).toBe('function');
        });
    });

    describe('initialize', () => {
        it('should fetch tabs from IPC and set state', async () => {
            const tab1 = createMockTab({ id: 'tab-1', title: 'Tab 1', isActive: false, position: 0 });
            const tab2 = createMockTab({ id: 'tab-2', title: 'Tab 2', isActive: true, position: 1 });

            mockTabsAPI.getAll.mockResolvedValue({ success: true, data: [tab1, tab2] });

            await act(async () => {
                await useTabStore.getState().initialize();
            });

            const state = useTabStore.getState();
            expect(state.tabs).toHaveLength(2);
            expect(state.activeTabId).toBe('tab-2');
            expect(state.isInitialized).toBe(true);
            expect(state.initError).toBeNull();
        });

        it('should set error on failure', async () => {
            mockTabsAPI.getAll.mockResolvedValue({ success: false, error: { message: 'DB error' } });

            await act(async () => {
                await useTabStore.getState().initialize();
            });

            const state = useTabStore.getState();
            expect(state.tabs).toEqual([]);
            expect(state.isInitialized).toBe(true);
            expect(state.initError).toBe('DB error');
        });

        it('should not re-initialize if already initialized', async () => {
            mockTabsAPI.getAll.mockResolvedValue({ success: true, data: [] });
            // Mock create for the default tab that initialize creates when empty
            mockTabsAPI.create.mockResolvedValue({ success: true, data: createMockTab({ id: 'default-1', isActive: true }) });

            await act(async () => {
                await useTabStore.getState().initialize();
            });
            await act(async () => {
                await useTabStore.getState().initialize();
            });

            expect(mockTabsAPI.getAll).toHaveBeenCalledTimes(1);
        });

        it('should create default tab when DB returns empty (B018)', async () => {
            mockTabsAPI.getAll.mockResolvedValue({ success: true, data: [] });
            const defaultTab = createMockTab({
                id: 'default-1',
                url: 'https://www.google.com',
                title: 'New Tab',
                isActive: true,
                position: 0,
            });
            mockTabsAPI.create.mockResolvedValue({ success: true, data: defaultTab });

            await act(async () => {
                await useTabStore.getState().initialize();
            });

            const state = useTabStore.getState();
            expect(state.tabs).toHaveLength(1);
            expect(state.tabs[0].url).toBe('https://www.google.com');
            expect(state.activeTabId).toBe('default-1');
            expect(state.isInitialized).toBe(true);
            // Should have called create IPC for the default tab
            expect(mockTabsAPI.create).toHaveBeenCalled();
        });
    });

    describe('createTab', () => {
        it('should call IPC and add tab to store', async () => {
            const newTab = createMockTab({ id: 'new-1', title: 'New Tab', isActive: true });
            mockTabsAPI.create.mockResolvedValue({ success: true, data: newTab });

            await act(async () => {
                await useTabStore.getState().createTab();
            });

            const state = useTabStore.getState();
            expect(state.tabs).toHaveLength(1);
            expect(state.tabs[0].id).toBe('new-1');
            expect(state.activeTabId).toBe('new-1');
        });

        it('should pass input to IPC', async () => {
            const newTab = createMockTab({ id: 'new-1', url: 'https://example.com' });
            mockTabsAPI.create.mockResolvedValue({ success: true, data: newTab });

            await act(async () => {
                await useTabStore.getState().createTab({ url: 'https://example.com', title: 'Example' });
            });

            expect(mockTabsAPI.create).toHaveBeenCalledWith({ url: 'https://example.com', title: 'Example' });
        });

        it('should prepend new tab at position 0 (B019 - leftmost)', async () => {
            const tab1 = createMockTab({ id: 'tab-1', title: 'Existing', isActive: true, position: 0 });
            useTabStore.setState({ tabs: [tab1], activeTabId: 'tab-1' });

            const newTab = createMockTab({ id: 'tab-2', title: 'New Tab', isActive: true, position: 0 });
            mockTabsAPI.create.mockResolvedValue({ success: true, data: newTab });

            await act(async () => {
                await useTabStore.getState().createTab();
            });

            const state = useTabStore.getState();
            // New tab should be first (leftmost), matching Flutter behavior
            expect(state.tabs[0].id).toBe('tab-2');
            expect(state.tabs[1].id).toBe('tab-1');
        });

        it('should deactivate previous tabs when new tab is created', async () => {
            const tab1 = createMockTab({ id: 'tab-1', isActive: true, position: 0 });
            useTabStore.setState({ tabs: [tab1], activeTabId: 'tab-1' });

            const newTab = createMockTab({ id: 'tab-2', isActive: true, position: 1 });
            mockTabsAPI.create.mockResolvedValue({ success: true, data: newTab });

            await act(async () => {
                await useTabStore.getState().createTab();
            });

            const state = useTabStore.getState();
            expect(state.tabs).toHaveLength(2);
            expect(state.activeTabId).toBe('tab-2');
            const oldTab = state.tabs.find(t => t.id === 'tab-1');
            expect(oldTab?.isActive).toBe(false);
        });

        it('should not modify store on IPC failure', async () => {
            mockTabsAPI.create.mockResolvedValue({ success: false, error: { message: 'limit reached' } });

            await act(async () => {
                await useTabStore.getState().createTab();
            });

            const state = useTabStore.getState();
            expect(state.tabs).toEqual([]);
        });
    });

    describe('closeTab', () => {
        it('should remove tab from store (optimistic)', async () => {
            const tab1 = createMockTab({ id: 'tab-1', title: 'One', isActive: false, position: 0 });
            const tab2 = createMockTab({ id: 'tab-2', title: 'Two', isActive: true, position: 1 });
            useTabStore.setState({ tabs: [tab1, tab2], activeTabId: 'tab-2' });

            mockTabsAPI.close.mockResolvedValue({ success: true });

            await act(async () => {
                await useTabStore.getState().closeTab('tab-1');
            });

            const state = useTabStore.getState();
            expect(state.tabs).toHaveLength(1);
            expect(state.tabs[0].id).toBe('tab-2');
        });

        it('should activate adjacent tab when closing active tab', async () => {
            const tab1 = createMockTab({ id: 'tab-1', isActive: false, position: 0 });
            const tab2 = createMockTab({ id: 'tab-2', isActive: true, position: 1 });
            useTabStore.setState({ tabs: [tab1, tab2], activeTabId: 'tab-2' });

            mockTabsAPI.close.mockResolvedValue({ success: true });

            await act(async () => {
                await useTabStore.getState().closeTab('tab-2');
            });

            const state = useTabStore.getState();
            expect(state.activeTabId).toBe('tab-1');
        });

        it('should rollback on IPC failure', async () => {
            const tab1 = createMockTab({ id: 'tab-1', isActive: true, position: 0 });
            useTabStore.setState({ tabs: [tab1], activeTabId: 'tab-1' });

            mockTabsAPI.close.mockResolvedValue({ success: false, error: { message: 'failed' } });

            await act(async () => {
                await useTabStore.getState().closeTab('tab-1');
            });

            const state = useTabStore.getState();
            // Should be rolled back
            expect(state.tabs).toHaveLength(1);
            expect(state.tabs[0].id).toBe('tab-1');
        });

        it('should create default tab when closing the last tab (B018)', async () => {
            const tab1 = createMockTab({ id: 'tab-1', isActive: true, position: 0 });
            useTabStore.setState({ tabs: [tab1], activeTabId: 'tab-1' });

            // First call: close succeeds
            mockTabsAPI.close.mockResolvedValue({ success: true });
            // Second call: create default tab
            const defaultTab = createMockTab({
                id: 'default-1',
                url: 'https://www.google.com',
                title: 'New Tab',
                isActive: true,
                position: 0,
            });
            mockTabsAPI.create.mockResolvedValue({ success: true, data: defaultTab });

            await act(async () => {
                await useTabStore.getState().closeTab('tab-1');
            });

            const state = useTabStore.getState();
            // Should never have 0 tabs - a default tab should be created
            expect(state.tabs).toHaveLength(1);
            expect(state.tabs[0].url).toBe('https://www.google.com');
            expect(state.activeTabId).toBe('default-1');
            // Should have called create IPC to make the default tab
            expect(mockTabsAPI.create).toHaveBeenCalled();
        });

        it('should not create default tab when other tabs remain (B018)', async () => {
            const tab1 = createMockTab({ id: 'tab-1', isActive: false, position: 0 });
            const tab2 = createMockTab({ id: 'tab-2', isActive: true, position: 1 });
            useTabStore.setState({ tabs: [tab1, tab2], activeTabId: 'tab-2' });

            mockTabsAPI.close.mockResolvedValue({ success: true });

            await act(async () => {
                await useTabStore.getState().closeTab('tab-2');
            });

            // Should NOT call create - there's still tab-1
            expect(mockTabsAPI.create).not.toHaveBeenCalled();
            expect(useTabStore.getState().tabs).toHaveLength(1);
        });
    });

    describe('switchTab', () => {
        it('should set active tab optimistically', async () => {
            const tab1 = createMockTab({ id: 'tab-1', isActive: false, position: 0 });
            const tab2 = createMockTab({ id: 'tab-2', isActive: true, position: 1 });
            useTabStore.setState({ tabs: [tab1, tab2], activeTabId: 'tab-2' });

            mockTabsAPI.switch.mockResolvedValue({ success: true });

            await act(async () => {
                await useTabStore.getState().switchTab('tab-1');
            });

            const state = useTabStore.getState();
            expect(state.activeTabId).toBe('tab-1');
        });

        it('should rollback on IPC failure', async () => {
            const tab1 = createMockTab({ id: 'tab-1', isActive: false, position: 0 });
            const tab2 = createMockTab({ id: 'tab-2', isActive: true, position: 1 });
            useTabStore.setState({ tabs: [tab1, tab2], activeTabId: 'tab-2' });

            mockTabsAPI.switch.mockResolvedValue({ success: false, error: { message: 'failed' } });

            await act(async () => {
                await useTabStore.getState().switchTab('tab-1');
            });

            const state = useTabStore.getState();
            expect(state.activeTabId).toBe('tab-2');
        });
    });

    describe('reorderTabs', () => {
        it('should reorder tabs optimistically', async () => {
            const tab1 = createMockTab({ id: 'tab-1', title: 'One', position: 0 });
            const tab2 = createMockTab({ id: 'tab-2', title: 'Two', position: 1 });
            const tab3 = createMockTab({ id: 'tab-3', title: 'Three', position: 2 });
            useTabStore.setState({ tabs: [tab1, tab2, tab3], activeTabId: 'tab-1' });

            mockTabsAPI.reorder.mockResolvedValue({ success: true });

            await act(async () => {
                await useTabStore.getState().reorderTabs(['tab-3', 'tab-1', 'tab-2']);
            });

            const state = useTabStore.getState();
            expect(state.tabs[0].id).toBe('tab-3');
            expect(state.tabs[1].id).toBe('tab-1');
            expect(state.tabs[2].id).toBe('tab-2');
        });

        it('should rollback on IPC failure', async () => {
            const tab1 = createMockTab({ id: 'tab-1', title: 'One', position: 0 });
            const tab2 = createMockTab({ id: 'tab-2', title: 'Two', position: 1 });
            useTabStore.setState({ tabs: [tab1, tab2], activeTabId: 'tab-1' });

            mockTabsAPI.reorder.mockResolvedValue({ success: false, error: { message: 'failed' } });

            await act(async () => {
                await useTabStore.getState().reorderTabs(['tab-2', 'tab-1']);
            });

            const state = useTabStore.getState();
            // Should be rolled back to original order
            expect(state.tabs[0].id).toBe('tab-1');
            expect(state.tabs[1].id).toBe('tab-2');
        });
    });

    describe('updateTabFromEvent', () => {
        it('should update tab title', () => {
            const tab1 = createMockTab({ id: 'tab-1', title: 'Old Title' });
            useTabStore.setState({ tabs: [tab1], activeTabId: 'tab-1' });

            act(() => {
                useTabStore.getState().updateTabFromEvent('tab-1', { title: 'New Title' });
            });

            expect(useTabStore.getState().tabs[0].title).toBe('New Title');
        });

        it('should update tab url', () => {
            const tab1 = createMockTab({ id: 'tab-1', url: 'https://old.com' });
            useTabStore.setState({ tabs: [tab1], activeTabId: 'tab-1' });

            act(() => {
                useTabStore.getState().updateTabFromEvent('tab-1', { url: 'https://new.com' });
            });

            expect(useTabStore.getState().tabs[0].url).toBe('https://new.com');
        });

        it('should update tab favicon', () => {
            const tab1 = createMockTab({ id: 'tab-1' });
            useTabStore.setState({ tabs: [tab1], activeTabId: 'tab-1' });

            act(() => {
                useTabStore.getState().updateTabFromEvent('tab-1', { faviconUrl: 'https://example.com/favicon.ico' });
            });

            expect(useTabStore.getState().tabs[0].faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should update loading state', () => {
            const tab1 = createMockTab({ id: 'tab-1', isLoading: false });
            useTabStore.setState({ tabs: [tab1], activeTabId: 'tab-1' });

            act(() => {
                useTabStore.getState().updateTabFromEvent('tab-1', { isLoading: true, loadingProgress: 0.5 });
            });

            const tab = useTabStore.getState().tabs[0];
            expect(tab.isLoading).toBe(true);
            expect(tab.loadingProgress).toBe(0.5);
        });

        it('should not throw for unknown tab ID', () => {
            act(() => {
                useTabStore.getState().updateTabFromEvent('non-existent', { title: 'test' });
            });
            // No error thrown
            expect(useTabStore.getState().tabs).toEqual([]);
        });
    });

    describe('initialize race condition (B021)', () => {
        it('should only call getAll once when initialize is called concurrently', async () => {
            // Simulate slow IPC that we control
            let resolveGetAll!: (value: any) => void;
            mockTabsAPI.getAll.mockReturnValue(
                new Promise((resolve) => { resolveGetAll = resolve; })
            );

            // Start two concurrent initialize calls (simulates React strict mode double-mount)
            const promise1 = useTabStore.getState().initialize();
            const promise2 = useTabStore.getState().initialize();

            // Resolve the IPC call
            resolveGetAll({ success: true, data: [createMockTab({ id: 'tab-1', isActive: true })] });

            await promise1;
            await promise2;

            // getAll should only be called once (shared promise lock)
            expect(mockTabsAPI.getAll).toHaveBeenCalledTimes(1);
            expect(useTabStore.getState().tabs).toHaveLength(1);
        });

        it('should not create duplicate tabs when concurrent initialize creates default tabs', async () => {
            const defaultTab = createMockTab({
                id: 'default-tab',
                url: 'https://www.google.com',
                isActive: true,
            });

            // Both getAll calls return empty (race: both hit DB before any tab created)
            mockTabsAPI.getAll.mockResolvedValue({ success: true, data: [] });
            // Create always returns same tab (facade URL duplicate detection)
            mockTabsAPI.create.mockResolvedValue({ success: true, data: defaultTab });

            // Concurrent initialize calls
            await act(async () => {
                await Promise.all([
                    useTabStore.getState().initialize(),
                    useTabStore.getState().initialize(),
                ]);
            });

            const state = useTabStore.getState();
            // Should have exactly 1 tab, not duplicates
            expect(state.tabs).toHaveLength(1);
            expect(state.tabs[0].id).toBe('default-tab');
        });
    });

    describe('createTab deduplication (B021)', () => {
        it('should not create duplicate when facade returns existing tab ID', async () => {
            const existingTab = createMockTab({ id: 'tab-1', url: 'https://www.google.com', isActive: true });
            useTabStore.setState({ tabs: [existingTab], activeTabId: 'tab-1' });

            // Facade returns the SAME tab (URL duplicate detection found match)
            mockTabsAPI.create.mockResolvedValue({ success: true, data: existingTab });

            await act(async () => {
                await useTabStore.getState().createTab({ url: 'https://www.google.com' });
            });

            const state = useTabStore.getState();
            // Should still have 1 tab, NOT 2 with same ID
            expect(state.tabs).toHaveLength(1);
            expect(state.tabs[0].id).toBe('tab-1');
        });

        it('should activate existing tab when facade returns duplicate', async () => {
            const tab1 = createMockTab({ id: 'tab-1', isActive: true });
            const tab2 = createMockTab({ id: 'tab-2', url: 'https://example.com', isActive: false });
            useTabStore.setState({ tabs: [tab1, tab2], activeTabId: 'tab-1' });

            // Facade returns tab-2 (URL duplicate detection matched example.com)
            const returnedTab2 = createMockTab({ id: 'tab-2', url: 'https://example.com', isActive: true });
            mockTabsAPI.create.mockResolvedValue({ success: true, data: returnedTab2 });

            await act(async () => {
                await useTabStore.getState().createTab({ url: 'https://example.com' });
            });

            const state = useTabStore.getState();
            // Should still have exactly 2 tabs (no duplicate)
            expect(state.tabs).toHaveLength(2);
            // tab-2 should now be active
            expect(state.activeTabId).toBe('tab-2');
        });

        it('should return existing tab ID when facade returns duplicate', async () => {
            const existingTab = createMockTab({ id: 'tab-1', url: 'https://www.google.com', isActive: true });
            useTabStore.setState({ tabs: [existingTab], activeTabId: 'tab-1' });

            mockTabsAPI.create.mockResolvedValue({ success: true, data: existingTab });

            let returnedId: string | null = null;
            await act(async () => {
                returnedId = await useTabStore.getState().createTab({ url: 'https://www.google.com' });
            });

            // Should still return the tab ID (for callers to use)
            expect(returnedId).toBe('tab-1');
        });
    });
});
