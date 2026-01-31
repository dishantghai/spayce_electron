import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserTabBar } from '../../../src/components/browser/BrowserTabBar';

describe('BrowserTabBar', () => {
    const mockTabs = [
        { id: 'tab-1', title: 'Google', faviconUrl: 'https://google.com/favicon.ico', isLoading: false },
        { id: 'tab-2', title: 'GitHub', faviconUrl: 'https://github.com/favicon.ico', isLoading: false },
        { id: 'tab-3', title: 'Stack Overflow', faviconUrl: null, isLoading: false },
    ];

    const defaultProps = {
        tabs: mockTabs,
        activeTabId: 'tab-1',
        onTabClick: vi.fn(),
        onTabClose: vi.fn(),
        onNewTab: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('REGRESSION: Layout Order', () => {
        it('new tab button should appear AFTER tabs', () => {
            const { container } = render(<BrowserTabBar {...defaultProps} />);
            const children = Array.from(container.firstChild.childNodes);
            
            expect(children[0]).toHaveProperty('role', 'tablist');
            expect(children[1].getAttribute('aria-label')).toBe('Open new tab');
        });
    });

    describe('Tab Rendering', () => {
        it('renders all tabs', () => {
            render(<BrowserTabBar {...defaultProps} />);
            expect(screen.getByText('Google')).toBeTruthy();
            expect(screen.getByText('GitHub')).toBeTruthy();
            expect(screen.getByText('Stack Overflow')).toBeTruthy();
        });
    });

    describe('Active Tab Behavior', () => {
        it('marks active tab with aria-selected', () => {
            render(<BrowserTabBar {...defaultProps} activeTabId="tab-2" />);
            const tabs = screen.getAllByRole('tab');
            
            expect(tabs[0].getAttribute('aria-selected')).toBe('false');
            expect(tabs[1].getAttribute('aria-selected')).toBe('true');
            expect(tabs[2].getAttribute('aria-selected')).toBe('false');
        });
    });

    describe('Tab Interactions', () => {
        it('calls onTabClick when tab is clicked', () => {
            const onTabClick = vi.fn();
            render(<BrowserTabBar {...defaultProps} onTabClick={onTabClick} />);
            
            fireEvent.click(screen.getByText('GitHub').closest('[role="tab"]'));
            expect(onTabClick).toHaveBeenCalledWith('tab-2');
        });
    });

    describe('Close Button', () => {
        it('renders close button for multiple tabs', () => {
            render(<BrowserTabBar {...defaultProps} />);
            expect(screen.getAllByTitle('Close tab').length).toBe(3);
        });

        it('calls onTabClose when clicked', () => {
            const onTabClose = vi.fn();
            render(<BrowserTabBar {...defaultProps} onTabClose={onTabClose} />);
            
            fireEvent.click(screen.getAllByTitle('Close tab')[1]);
            expect(onTabClose).toHaveBeenCalledWith('tab-2');
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA roles', () => {
            const { container } = render(<BrowserTabBar {...defaultProps} />);
            expect(container.querySelector('[role="tablist"]')).toBeTruthy();
            expect(screen.getAllByRole('tab').length).toBe(3);
        });
    });
});
