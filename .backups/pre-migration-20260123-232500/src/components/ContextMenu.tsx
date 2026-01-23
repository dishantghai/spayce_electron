import React, { useEffect, useRef, useCallback } from 'react';
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

    // Position menu and adjust if it overflows viewport
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

        // Flip horizontal if overflows right
        if (x + rect.width > viewport.width) {
            x = Math.max(0, viewport.width - rect.width - 8);
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

    return (
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
}
