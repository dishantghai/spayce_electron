import { describe, it, expect } from 'vitest';
import { SidebarTab, SidebarMode, KeyboardFocusContext } from '../src/types';

describe('Navigation Types', () => {
    describe('SidebarTab enum', () => {
        it('should have browser tab', () => {
            expect(SidebarTab.browser).toBe('browser');
        });

        it('should have spaces tab', () => {
            expect(SidebarTab.spaces).toBe('spaces');
        });

        it('should have workspace tab', () => {
            expect(SidebarTab.workspace).toBe('workspace');
        });

        it('should have settings tab', () => {
            expect(SidebarTab.settings).toBe('settings');
        });
    });

    describe('SidebarMode enum', () => {
        it('should have floating mode', () => {
            expect(SidebarMode.floating).toBe('floating');
        });

        it('should have fixed mode', () => {
            expect(SidebarMode.fixed).toBe('fixed');
        });
    });

    describe('KeyboardFocusContext enum', () => {
        it('should have sidebar context', () => {
            expect(KeyboardFocusContext.sidebar).toBe('sidebar');
        });

        it('should have spacesScreen context', () => {
            expect(KeyboardFocusContext.spacesScreen).toBe('spacesScreen');
        });
    });
});
