import { describe, test, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useNavigationUiStore } from '../../src/stores/navigationUiStore';

describe('Feature: 010 - useNavigationUiStore', () => {
    beforeEach(() => {
        useNavigationUiStore.setState({
            activeSpaceId: null,
            sidebarTab: 'spaces',
            sidebarMode: 'fixed',
            isSidebarOpen: true,
        });
    });

    describe('AC1: manages activeSpaceId', () => {
        test('should have null activeSpaceId initially', () => {
            const state = useNavigationUiStore.getState();
            expect(state.activeSpaceId).toBeNull();
        });

        test('should update activeSpaceId with setActiveSpace', () => {
            act(() => {
                useNavigationUiStore.getState().setActiveSpace('space-123');
            });
            expect(useNavigationUiStore.getState().activeSpaceId).toBe('space-123');
        });
    });

    describe('AC2: manages sidebar state', () => {
        test('should have default sidebarTab as spaces', () => {
            expect(useNavigationUiStore.getState().sidebarTab).toBe('spaces');
        });

        test('should update sidebarTab with setSidebarTab', () => {
            act(() => {
                useNavigationUiStore.getState().setSidebarTab('history');
            });
            expect(useNavigationUiStore.getState().sidebarTab).toBe('history');
        });

        test('should have default sidebarMode as fixed', () => {
            expect(useNavigationUiStore.getState().sidebarMode).toBe('fixed');
        });

        test('should update sidebarMode with setSidebarMode', () => {
            act(() => {
                useNavigationUiStore.getState().setSidebarMode('floating');
            });
            expect(useNavigationUiStore.getState().sidebarMode).toBe('floating');
        });

        test('should have isSidebarOpen as true initially', () => {
            expect(useNavigationUiStore.getState().isSidebarOpen).toBe(true);
        });

        test('should toggle isSidebarOpen with toggleSidebar', () => {
            act(() => {
                useNavigationUiStore.getState().toggleSidebar();
            });
            expect(useNavigationUiStore.getState().isSidebarOpen).toBe(false);
            act(() => {
                useNavigationUiStore.getState().toggleSidebar();
            });
            expect(useNavigationUiStore.getState().isSidebarOpen).toBe(true);
        });
    });

    describe('AC3: Zustand-based with proper actions', () => {
        test('should be a Zustand store', () => {
            expect(typeof useNavigationUiStore).toBe('function');
            expect(typeof useNavigationUiStore.getState).toBe('function');
            expect(typeof useNavigationUiStore.setState).toBe('function');
        });

        test('should have all required actions', () => {
            const state = useNavigationUiStore.getState();
            expect(typeof state.setActiveSpace).toBe('function');
            expect(typeof state.setSidebarTab).toBe('function');
            expect(typeof state.setSidebarMode).toBe('function');
            expect(typeof state.toggleSidebar).toBe('function');
        });
    });

    describe('AC4: contains only UI state, not business data', () => {
        test('should not contain spaces data', () => {
            const state = useNavigationUiStore.getState();
            expect(state).not.toHaveProperty('spaces');
        });

        test('should not contain items data', () => {
            const state = useNavigationUiStore.getState();
            expect(state).not.toHaveProperty('items');
        });
    });
});
