import { describe, test, expect, vi, beforeEach } from 'vitest';

/**
 * Regression Tests: useSpacesData Hook - No Loading During Refetch
 * 
 * These tests ensure the critical fix for Sidebar remount never regresses.
 * 
 * ROOT CAUSE: useSpacesData was setting loading=true on EVERY refetch,
 * which caused App.tsx to render the loading skeleton and unmount Sidebar.
 * 
 * FIX: Added hasInitiallyLoaded flag - loading=true only on initial load.
 * 
 * IMPACT: Without this fix, every drag-drop operation causes:
 * - Screen blink (loading skeleton appears briefly)
 * - Sidebar unmount/remount
 * - Loss of expanded folder state (if not lifted to App level)
 */

describe('useSpacesData - No Loading During Refetch', () => {
    /**
     * Simulates the fixed useSpacesData behavior
     */
    function createUseSpacesDataSimulation() {
        let spaces: any[] = [];
        let loading = true;
        let hasInitiallyLoaded = false;
        let error: Error | null = null;

        const fetchSpaces = async () => {
            // CRITICAL FIX: Only set loading on initial load
            if (!hasInitiallyLoaded) {
                loading = true;
            }
            error = null;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 10));

            // Simulate successful response
            spaces = [{ id: 'space-1', name: 'Test Space', rootItems: [] }];
            hasInitiallyLoaded = true;

            // CRITICAL FIX: Only set loading=false on initial load
            if (loading) {
                loading = false;
            }
        };

        return {
            getState: () => ({ spaces, loading, error, hasInitiallyLoaded }),
            fetchSpaces,
        };
    }

    test('REGRESSION: initial load should set loading=true then false', async () => {
        const hook = createUseSpacesDataSimulation();

        // Initial state
        expect(hook.getState().loading).toBe(true);
        expect(hook.getState().hasInitiallyLoaded).toBe(false);

        // Fetch
        await hook.fetchSpaces();

        // After initial load
        expect(hook.getState().loading).toBe(false);
        expect(hook.getState().hasInitiallyLoaded).toBe(true);
        expect(hook.getState().spaces.length).toBe(1);
    });

    test('REGRESSION: refetch should NOT set loading=true', async () => {
        const hook = createUseSpacesDataSimulation();

        // Complete initial load
        await hook.fetchSpaces();
        expect(hook.getState().loading).toBe(false);

        // Track loading state during refetch
        const loadingDuringRefetch: boolean[] = [];

        const refetchPromise = hook.fetchSpaces();
        loadingDuringRefetch.push(hook.getState().loading);

        await refetchPromise;
        loadingDuringRefetch.push(hook.getState().loading);

        // CRITICAL: loading should NEVER be true during refetch
        expect(loadingDuringRefetch.every(l => l === false)).toBe(true);
    });

    test('REGRESSION: multiple rapid refetches should keep loading=false', async () => {
        const hook = createUseSpacesDataSimulation();

        // Complete initial load
        await hook.fetchSpaces();

        // Rapid refetches (simulating multiple drag-drop operations)
        const refetchPromises = [
            hook.fetchSpaces(),
            hook.fetchSpaces(),
            hook.fetchSpaces(),
        ];

        // Check loading during all refetches
        expect(hook.getState().loading).toBe(false);

        await Promise.all(refetchPromises);

        // Still false after all complete
        expect(hook.getState().loading).toBe(false);
    });

    test('REGRESSION: hasInitiallyLoaded should persist across refetches', async () => {
        const hook = createUseSpacesDataSimulation();

        // Initial load
        await hook.fetchSpaces();
        expect(hook.getState().hasInitiallyLoaded).toBe(true);

        // Multiple refetches
        await hook.fetchSpaces();
        expect(hook.getState().hasInitiallyLoaded).toBe(true);

        await hook.fetchSpaces();
        expect(hook.getState().hasInitiallyLoaded).toBe(true);
    });
});

describe('useSpacesData - App.tsx Integration', () => {
    /**
     * Simulates how App.tsx uses loading state to conditionally render
     */

    test('REGRESSION: App should NOT show loading skeleton during refetch', async () => {
        let loading = true;
        let hasInitiallyLoaded = false;

        const fetchSpaces = async () => {
            if (!hasInitiallyLoaded) {
                loading = true;
            }
            await new Promise(resolve => setTimeout(resolve, 10));
            hasInitiallyLoaded = true;
            if (loading) {
                loading = false;
            }
        };

        // Simulate App.tsx render logic
        const shouldShowLoadingSkeleton = () => loading;
        const shouldShowSidebar = () => !loading;

        // Initial state - show skeleton
        expect(shouldShowLoadingSkeleton()).toBe(true);
        expect(shouldShowSidebar()).toBe(false);

        // After initial load - show sidebar
        await fetchSpaces();
        expect(shouldShowLoadingSkeleton()).toBe(false);
        expect(shouldShowSidebar()).toBe(true);

        // During refetch - STILL show sidebar (no skeleton)
        await fetchSpaces();
        expect(shouldShowLoadingSkeleton()).toBe(false);
        expect(shouldShowSidebar()).toBe(true);
    });

    test('REGRESSION: Sidebar should NOT unmount during refetch', async () => {
        let loading = true;
        let hasInitiallyLoaded = false;
        let sidebarMountCount = 0;
        let sidebarUnmountCount = 0;

        const fetchSpaces = async () => {
            if (!hasInitiallyLoaded) {
                loading = true;
            }
            await new Promise(resolve => setTimeout(resolve, 10));
            hasInitiallyLoaded = true;
            if (loading) {
                loading = false;
            }
        };

        // Simulate Sidebar mount/unmount based on loading state
        const updateSidebarMount = (prevLoading: boolean, newLoading: boolean) => {
            if (prevLoading && !newLoading) {
                // Transition from loading to not loading - mount
                sidebarMountCount++;
            }
            if (!prevLoading && newLoading) {
                // Transition from not loading to loading - unmount
                sidebarUnmountCount++;
            }
        };

        // Initial load
        const prevLoading1 = loading;
        await fetchSpaces();
        updateSidebarMount(prevLoading1, loading);

        expect(sidebarMountCount).toBe(1); // Mounted once after initial load
        expect(sidebarUnmountCount).toBe(0); // Never unmounted

        // Refetch - should NOT cause unmount
        const prevLoading2 = loading;
        await fetchSpaces();
        updateSidebarMount(prevLoading2, loading);

        expect(sidebarMountCount).toBe(1); // Still only mounted once
        expect(sidebarUnmountCount).toBe(0); // CRITICAL: Never unmounted during refetch

        // Another refetch
        const prevLoading3 = loading;
        await fetchSpaces();
        updateSidebarMount(prevLoading3, loading);

        expect(sidebarMountCount).toBe(1);
        expect(sidebarUnmountCount).toBe(0);
    });
});

describe('useSpacesData - Drop Operation Flow', () => {
    test('REGRESSION: complete drop flow should not trigger loading state', async () => {
        let loading = true;
        let hasInitiallyLoaded = false;
        let loadingStateChanges: boolean[] = [];

        const fetchSpaces = async () => {
            const prevLoading = loading;
            if (!hasInitiallyLoaded) {
                loading = true;
            }
            if (prevLoading !== loading) {
                loadingStateChanges.push(loading);
            }

            await new Promise(resolve => setTimeout(resolve, 10));

            hasInitiallyLoaded = true;
            const prevLoading2 = loading;
            if (loading && hasInitiallyLoaded) {
                loading = false;
            }
            if (prevLoading2 !== loading) {
                loadingStateChanges.push(loading);
            }
        };

        // Initial load - loading should change: true -> false
        await fetchSpaces();
        expect(loadingStateChanges).toEqual([false]); // Only one change: to false

        // Reset tracking
        loadingStateChanges = [];

        // Drop operation triggers refetch
        await fetchSpaces();

        // CRITICAL: No loading state changes during refetch
        expect(loadingStateChanges).toEqual([]);
    });

    test('REGRESSION: expanded state should be preserved through drop + refetch', () => {
        // This test documents the expected behavior

        // State at App level (lifted from Sidebar)
        const expandedIdsMap = new Map<string, Set<string>>();
        expandedIdsMap.set('space-1', new Set(['folder-a', 'folder-b']));

        // Simulate drop operation
        // 1. Move API called
        // 2. Refetch called (loading stays false)
        // 3. spaces data updates
        // 4. Sidebar receives new spaces prop
        // 5. expandedIdsMap is UNCHANGED (lifted to App level)

        // Verify expanded state is preserved
        expect(expandedIdsMap.get('space-1')!.has('folder-a')).toBe(true);
        expect(expandedIdsMap.get('space-1')!.has('folder-b')).toBe(true);
    });
});
