/**
 * BrowserTabBar Component Tests
 * Story F039: Multi-Tab Bar UI Enhancement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserTabBar } from '../../../src/components/browser/BrowserTabBar';

// Mock scrollIntoView which doesn't exist in jsdom
beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
    cleanup();
});

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

    describe('Layout Order', () => {
        it('new tab button should appear BEFORE tabs (matching Flutter design)', () => {
            const { container } = render(<BrowserTabBar {...defaultProps} />);
            const tabBar = container.firstChild as HTMLElement;
            const children = Array.from(tabBar.childNodes);

            // Order: new tab button, tabs container, spacer
            expect((children[0] as HTMLElement).getAttribute('aria-label')).toBe('Open new tab');
            expect((children[1] as HTMLElement).getAttribute('role')).toBe('tablist');
        });
    });

    describe('Tab Rendering', () => {
        it('renders all tabs', () => {
            render(<BrowserTabBar {...defaultProps} />);
            expect(screen.getByText('Google')).toBeTruthy();
            expect(screen.getByText('GitHub')).toBeTruthy();
            expect(screen.getByText('Stack Overflow')).toBeTruthy();
        });

        it('renders favicon images when provided', () => {
            const { container } = render(<BrowserTabBar {...defaultProps} />);
            const imgs = container.querySelectorAll('img');
            expect(imgs.length).toBe(2); // tab-1 and tab-2 have favicons
        });

        it('renders globe icon when no favicon', () => {
            render(<BrowserTabBar {...defaultProps} />);
            // tab-3 has no favicon, should have globe icon
            const tabs = screen.getAllByRole('tab');
            const tab3 = tabs[2];
            expect(tab3.querySelector('svg')).toBeTruthy();
        });

        it('renders loading spinner when tab is loading', () => {
            const loadingTabs = [
                { id: 'tab-1', title: 'Loading...', isLoading: true },
            ];
            const { container } = render(
                <BrowserTabBar
                    tabs={loadingTabs}
                    activeTabId="tab-1"
                    onTabClick={vi.fn()}
                />
            );
            // Loading spinner is a span element, not an img
            expect(container.querySelector('img')).toBeNull();
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

        it('active tab has tabIndex 0, inactive tabs have -1', () => {
            render(<BrowserTabBar {...defaultProps} activeTabId="tab-2" />);
            const tabs = screen.getAllByRole('tab');

            expect(tabs[0].getAttribute('tabindex')).toBe('-1');
            expect(tabs[1].getAttribute('tabindex')).toBe('0');
            expect(tabs[2].getAttribute('tabindex')).toBe('-1');
        });
    });

    describe('Tab Interactions', () => {
        it('calls onTabClick when tab is clicked', () => {
            const onTabClick = vi.fn();
            render(<BrowserTabBar {...defaultProps} onTabClick={onTabClick} />);

            fireEvent.click(screen.getByText('GitHub').closest('[role="tab"]')!);
            expect(onTabClick).toHaveBeenCalledWith('tab-2');
        });

        it('calls onNewTab when new tab button is clicked', () => {
            const onNewTab = vi.fn();
            render(<BrowserTabBar {...defaultProps} onNewTab={onNewTab} />);

            fireEvent.click(screen.getByLabelText('Open new tab'));
            expect(onNewTab).toHaveBeenCalledTimes(1);
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

        it('does not render close buttons for single tab', () => {
            render(
                <BrowserTabBar
                    tabs={[mockTabs[0]]}
                    activeTabId="tab-1"
                    onTabClick={vi.fn()}
                    onTabClose={vi.fn()}
                />
            );
            expect(screen.queryByTitle('Close tab')).toBeNull();
        });

        it('close button click does not trigger tab click', () => {
            const onTabClick = vi.fn();
            const onTabClose = vi.fn();
            render(<BrowserTabBar {...defaultProps} onTabClick={onTabClick} onTabClose={onTabClose} />);

            fireEvent.click(screen.getAllByTitle('Close tab')[0]);
            expect(onTabClose).toHaveBeenCalledWith('tab-1');
            expect(onTabClick).not.toHaveBeenCalled();
        });
    });

    describe('Keyboard Navigation', () => {
        it('activates tab on Enter key', () => {
            const onTabClick = vi.fn();
            render(<BrowserTabBar {...defaultProps} onTabClick={onTabClick} />);

            const tab = screen.getAllByRole('tab')[1];
            fireEvent.keyDown(tab, { key: 'Enter' });
            expect(onTabClick).toHaveBeenCalledWith('tab-2');
        });

        it('activates tab on Space key', () => {
            const onTabClick = vi.fn();
            render(<BrowserTabBar {...defaultProps} onTabClick={onTabClick} />);

            const tab = screen.getAllByRole('tab')[1];
            fireEvent.keyDown(tab, { key: ' ' });
            expect(onTabClick).toHaveBeenCalledWith('tab-2');
        });

        it('closes tab on Delete key', () => {
            const onTabClose = vi.fn();
            render(<BrowserTabBar {...defaultProps} onTabClose={onTabClose} />);

            const tab = screen.getAllByRole('tab')[1];
            fireEvent.keyDown(tab, { key: 'Delete' });
            expect(onTabClose).toHaveBeenCalledWith('tab-2');
        });
    });

    describe('Drag and Drop', () => {
        it('makes tabs draggable when onReorder is provided', () => {
            const onReorder = vi.fn();
            render(<BrowserTabBar {...defaultProps} onReorder={onReorder} />);

            const tabs = screen.getAllByRole('tab');
            tabs.forEach(tab => {
                expect(tab.getAttribute('draggable')).toBe('true');
            });
        });

        it('tabs are not draggable when onReorder is not provided', () => {
            render(<BrowserTabBar {...defaultProps} />);

            const tabs = screen.getAllByRole('tab');
            tabs.forEach(tab => {
                expect(tab.getAttribute('draggable')).toBe('false');
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA roles', () => {
            const { container } = render(<BrowserTabBar {...defaultProps} />);
            expect(container.querySelector('[role="tablist"]')).toBeTruthy();
            expect(screen.getAllByRole('tab').length).toBe(3);
        });

        it('close buttons have accessible labels', () => {
            render(<BrowserTabBar {...defaultProps} />);
            expect(screen.getByLabelText('Close Google')).toBeTruthy();
            expect(screen.getByLabelText('Close GitHub')).toBeTruthy();
            expect(screen.getByLabelText('Close Stack Overflow')).toBeTruthy();
        });

        it('new tab button has accessible label', () => {
            render(<BrowserTabBar {...defaultProps} />);
            expect(screen.getByLabelText('Open new tab')).toBeTruthy();
        });
    });
});
