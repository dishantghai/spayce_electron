import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon } from 'lucide-react';
import { SpayceColors } from '../theme';
import styles from './ContextMenu.module.css';

export interface ContextMenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    isDestructive?: boolean;
    isDivider?: boolean;
    isDisabled?: boolean;
}

export interface ContextMenuProps {
    items: ContextMenuItem[];
    position: { x: number; y: number };
    onItemClick: (itemId: string) => void;
    onClose: () => void;
}

/**
 * ContextMenu - A context menu that appears at cursor position.
 * Handles positioning, keyboard navigation, and click-outside-to-close.
 */
export function ContextMenu({
    items,
    position,
    onItemClick,
    onClose,
}: ContextMenuProps): React.ReactElement {
    const menuRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

    // Position menu and adjust if it overflows viewport or sidebar bounds
    // B005 FIX: In fixed sidebar mode, WebContentsView renders on top of HTML,
    // so we must keep context menu within sidebar bounds (left 320px)
    useEffect(() => {
        if (!menuRef.current) return;

        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        let x = position.x;
        let y = position.y;

        // B005 FIX: Detect if we're in a constrained sidebar area
        // If click is within sidebar bounds (x < 320) and menu would overflow,
        // flip menu to open LEFT of cursor instead of right
        const SIDEBAR_WIDTH = 320;
        const isInSidebarArea = position.x < SIDEBAR_WIDTH;

        if (isInSidebarArea) {
            // In sidebar area - keep menu within sidebar bounds
            // If menu would extend past sidebar edge, flip to left of cursor
            if (x + rect.width > SIDEBAR_WIDTH - 8) {
                // Position menu to the LEFT of cursor
                x = Math.max(8, position.x - rect.width);
            }
        } else {
            // Normal viewport-based overflow handling
            if (x + rect.width > viewport.width) {
                x = Math.max(0, viewport.width - rect.width - 8);
            }
        }

        // Flip vertical if overflows bottom
        if (y + rect.height > viewport.height) {
            y = Math.max(0, viewport.height - rect.height - 8);
        }

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
    }, [position]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const selectableItems = items.filter(
                (item) => !item.isDivider && !item.isDisabled
            );

            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex((prev) => {
                    const nextIndex = prev + 1;
                    return nextIndex >= selectableItems.length ? 0 : nextIndex;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex((prev) => {
                    const nextIndex = prev - 1;
                    return nextIndex < 0 ? selectableItems.length - 1 : nextIndex;
                });
            } else if (e.key === 'Enter' && focusedIndex >= 0) {
                e.preventDefault();
                const item = selectableItems[focusedIndex];
                if (item) {
                    onItemClick(item.id);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [items, focusedIndex, onItemClick, onClose]);

    const handleItemClick = useCallback(
        (itemId: string) => {
            onItemClick(itemId);
            onClose();
        },
        [onItemClick, onClose]
    );

    const selectableItems = items.filter((item) => !item.isDivider && !item.isDisabled);

    // B005 FIX: Use Portal to render at document.body level
    // This prevents clipping by parent containers with overflow:hidden (like fixed sidebar)
    const menuContent = (
        <div ref={menuRef} className={styles.contextMenu} role="menu">
            {items.map((item, index) => {
                if (item.isDivider) {
                    return <div key={`divider-${index}`} className={styles.divider} />;
                }

                const selectableIndex = selectableItems.findIndex((i) => i.id === item.id);
                const isFocused = selectableIndex === focusedIndex;

                return (
                    <button
                        key={item.id}
                        className={`${styles.menuItem} ${item.isDestructive ? styles.menuItemDestructive : ''
                            } ${isFocused ? styles.menuItemFocused : ''} ${item.isDisabled ? styles.menuItemDisabled : ''
                            }`}
                        onClick={() => !item.isDisabled && handleItemClick(item.id)}
                        onMouseEnter={() => setFocusedIndex(selectableIndex)}
                        disabled={item.isDisabled}
                        role="menuitem"
                    >
                        <item.icon
                            size={16}
                            color={
                                item.isDestructive
                                    ? SpayceColors.error
                                    : SpayceColors.textSecondary
                            }
                        />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </div>
    );

    // Render via portal to escape overflow:hidden containers
    return createPortal(menuContent, document.body);
}
