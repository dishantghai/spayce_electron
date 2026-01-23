import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Folder, FolderOpen } from 'lucide-react';
import type { Space, SpaceItem } from '../../types';
import { SpaceCard } from './SpaceCard';
import { SpacesBottomBar } from './SpacesBottomBar';
import styles from './SpacesScreen.module.css';

export interface SpacesScreenProps {
    spaces: Space[];
    activeSpaceIndex: number;
    selectedItemId?: string | null;
    isLoading?: boolean;
    error?: string | null;
    hasFocus?: boolean;
    onSpaceSelect?: (index: number) => void;
    onItemClick?: (item: SpaceItem, spaceId: string) => void;
    onItemContextMenu?: (item: SpaceItem, spaceId: string, event: React.MouseEvent) => void;
    onAddSpace?: () => void;
    onAddFolder?: (spaceId: string, parentId?: string | null) => void;
    onAddLink?: (spaceId: string, parentId?: string | null) => void;
    onReorderSpaces?: (oldIndex: number, newIndex: number) => void;
    onFocusChange?: (hasFocus: boolean) => void;
}

export function SpacesScreen({
    spaces,
    activeSpaceIndex,
    selectedItemId = null,
    isLoading = false,
    error = null,
    hasFocus = true,
    onSpaceSelect,
    onItemClick,
    onItemContextMenu,
    onAddSpace,
    onAddFolder,
    onAddLink,
    onReorderSpaces,
    onFocusChange,
}: SpacesScreenProps): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [keyboardSelectedItemId, setKeyboardSelectedItemId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Map<string, Set<string>>>(new Map());

    // Get expanded IDs for a specific space
    const getExpandedIds = useCallback((spaceId: string): Set<string> => {
        return expandedIds.get(spaceId) || new Set();
    }, [expandedIds]);

    // Update expanded IDs for a specific space
    const handleExpandedChange = useCallback((spaceId: string, newExpandedIds: Set<string>) => {
        setExpandedIds(prev => {
            const newMap = new Map(prev);
            newMap.set(spaceId, newExpandedIds);
            return newMap;
        });
    }, []);

    // Scroll to active space when it changes
    useEffect(() => {
        if (!scrollContainerRef.current || spaces.length === 0) return;

        const container = scrollContainerRef.current;
        const cardElements = container.children;
        if (activeSpaceIndex >= 0 && activeSpaceIndex < cardElements.length) {
            const cardElement = cardElements[activeSpaceIndex] as HTMLElement;
            const containerRect = container.getBoundingClientRect();
            const cardRect = cardElement.getBoundingClientRect();

            // Check if card is not fully visible
            const isLeftHidden = cardRect.left < containerRect.left;
            const isRightHidden = cardRect.right > containerRect.right;

            if (isLeftHidden || isRightHidden) {
                // Center the card in view
                const scrollLeft = cardElement.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
                container.scrollTo({
                    left: Math.max(0, scrollLeft),
                    behavior: 'smooth',
                });
            }
        }
    }, [activeSpaceIndex, spaces.length]);

    // Keyboard navigation - only active when hasFocus is true
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if SpacesScreen doesn't have focus
            if (!hasFocus) return;

            // Skip if in input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const activeSpace = spaces[activeSpaceIndex];
            if (!activeSpace) return;

            switch (e.key) {
                case '[':
                    e.preventDefault();
                    if (spaces.length > 0) {
                        const newIndex = (activeSpaceIndex - 1 + spaces.length) % spaces.length;
                        onSpaceSelect?.(newIndex);
                    }
                    break;

                case ']':
                    e.preventDefault();
                    if (spaces.length > 0) {
                        const newIndex = (activeSpaceIndex + 1) % spaces.length;
                        onSpaceSelect?.(newIndex);
                    }
                    break;

                case 'Tab':
                    e.preventDefault();
                    if (spaces.length > 0) {
                        if (e.shiftKey) {
                            const newIndex = (activeSpaceIndex - 1 + spaces.length) % spaces.length;
                            onSpaceSelect?.(newIndex);
                        } else {
                            const newIndex = (activeSpaceIndex + 1) % spaces.length;
                            onSpaceSelect?.(newIndex);
                        }
                    }
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    navigateToNextItem(activeSpace);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    navigateToPreviousItem(activeSpace);
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    expandOrEnterFolder(activeSpace);
                    break;

                case 'ArrowLeft':
                    e.preventDefault();
                    collapseOrExitFolder(activeSpace);
                    break;

                case 'Enter':
                    e.preventDefault();
                    activateSelectedItem(activeSpace);
                    break;

                case 'Escape':
                    e.preventDefault();
                    setKeyboardSelectedItemId(null);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [spaces, activeSpaceIndex, keyboardSelectedItemId, expandedIds, onSpaceSelect, hasFocus]);

    // Flatten items respecting expanded state
    const flattenItems = useCallback((items: SpaceItem[], spaceId: string): SpaceItem[] => {
        const result: SpaceItem[] = [];
        const spaceExpandedIds = getExpandedIds(spaceId);

        const addItems = (itemList: SpaceItem[]) => {
            for (const item of itemList) {
                result.push(item);
                if ((item.type === 'folder' || item.type === 'localFolder') && spaceExpandedIds.has(item.id)) {
                    addItems(item.children);
                }
            }
        };

        addItems(items);
        return result;
    }, [getExpandedIds]);

    // Navigate to next item
    const navigateToNextItem = useCallback((space: Space) => {
        const items = flattenItems(space.rootItems, space.id);
        if (items.length === 0) return;

        if (!keyboardSelectedItemId) {
            setKeyboardSelectedItemId(items[0].id);
            return;
        }

        const currentIndex = items.findIndex(i => i.id === keyboardSelectedItemId);
        if (currentIndex < items.length - 1) {
            setKeyboardSelectedItemId(items[currentIndex + 1].id);
        }
    }, [keyboardSelectedItemId, flattenItems]);

    // Navigate to previous item
    const navigateToPreviousItem = useCallback((space: Space) => {
        const items = flattenItems(space.rootItems, space.id);
        if (items.length === 0) return;

        if (!keyboardSelectedItemId) {
            setKeyboardSelectedItemId(items[items.length - 1].id);
            return;
        }

        const currentIndex = items.findIndex(i => i.id === keyboardSelectedItemId);
        if (currentIndex > 0) {
            setKeyboardSelectedItemId(items[currentIndex - 1].id);
        }
    }, [keyboardSelectedItemId, flattenItems]);

    // Expand folder or enter it
    const expandOrEnterFolder = useCallback((space: Space) => {
        if (!keyboardSelectedItemId) return;

        const items = flattenItems(space.rootItems, space.id);
        const item = items.find(i => i.id === keyboardSelectedItemId);
        if (!item || (item.type !== 'folder' && item.type !== 'localFolder')) return;

        const spaceExpandedIds = getExpandedIds(space.id);
        if (!spaceExpandedIds.has(item.id)) {
            // Expand folder
            const newSet = new Set(spaceExpandedIds);
            newSet.add(item.id);
            handleExpandedChange(space.id, newSet);
        } else if (item.children.length > 0) {
            // Enter folder - select first child
            setKeyboardSelectedItemId(item.children[0].id);
        }
    }, [keyboardSelectedItemId, flattenItems, getExpandedIds, handleExpandedChange]);

    // Collapse folder or go to parent
    const collapseOrExitFolder = useCallback((space: Space) => {
        if (!keyboardSelectedItemId) return;

        const items = flattenItems(space.rootItems, space.id);
        const item = items.find(i => i.id === keyboardSelectedItemId);
        if (!item) return;

        const spaceExpandedIds = getExpandedIds(space.id);

        if ((item.type === 'folder' || item.type === 'localFolder') && spaceExpandedIds.has(item.id)) {
            // Collapse folder
            const newSet = new Set(spaceExpandedIds);
            newSet.delete(item.id);
            handleExpandedChange(space.id, newSet);
        } else {
            // Go to parent
            const parent = findParentItem(space.rootItems, keyboardSelectedItemId);
            if (parent) {
                setKeyboardSelectedItemId(parent.id);
            }
        }
    }, [keyboardSelectedItemId, flattenItems, getExpandedIds, handleExpandedChange]);

    // Find parent of an item
    const findParentItem = (items: SpaceItem[], itemId: string, parent: SpaceItem | null = null): SpaceItem | null => {
        for (const item of items) {
            if (item.id === itemId) return parent;
            if (item.children.length > 0) {
                const found = findParentItem(item.children, itemId, item);
                if (found !== null) return found;
            }
        }
        return null;
    };

    // Activate selected item (Enter key)
    const activateSelectedItem = useCallback((space: Space) => {
        if (!keyboardSelectedItemId) return;

        const items = flattenItems(space.rootItems, space.id);
        const item = items.find(i => i.id === keyboardSelectedItemId);
        if (!item) return;

        if (item.type === 'folder' || item.type === 'localFolder') {
            // Toggle folder expansion
            const spaceExpandedIds = getExpandedIds(space.id);
            const newSet = new Set(spaceExpandedIds);
            if (newSet.has(item.id)) {
                newSet.delete(item.id);
            } else {
                newSet.add(item.id);
            }
            handleExpandedChange(space.id, newSet);
        } else {
            // Open item (link)
            onItemClick?.(item, space.id);
        }
    }, [keyboardSelectedItemId, flattenItems, getExpandedIds, handleExpandedChange, onItemClick]);

    // Handle item click - also sets focus to this card
    const handleItemClick = useCallback((item: SpaceItem, spaceId: string) => {
        // Find the space index for this item
        const spaceIndex = spaces.findIndex(s => s.id === spaceId);
        if (spaceIndex !== -1 && spaceIndex !== activeSpaceIndex) {
            onSpaceSelect?.(spaceIndex);
        }
        setKeyboardSelectedItemId(item.id);
        onFocusChange?.(true);
        onItemClick?.(item, spaceId);
    }, [onItemClick, spaces, activeSpaceIndex, onSpaceSelect, onFocusChange]);

    // Handle card select - brings card into focus for keyboard nav
    const handleCardSelect = useCallback((index: number) => {
        onSpaceSelect?.(index);
        onFocusChange?.(true);
        // Don't clear keyboard selection when clicking card - keep it if clicking same card
        if (index !== activeSpaceIndex) {
            setKeyboardSelectedItemId(null);
        }
    }, [onSpaceSelect, onFocusChange, activeSpaceIndex]);

    // Calculate card width based on container width (fit 3 cards)
    const [cardWidth, setCardWidth] = useState(288);

    useEffect(() => {
        const updateCardWidth = () => {
            if (scrollContainerRef.current) {
                const containerWidth = scrollContainerRef.current.clientWidth - 48; // Subtract padding
                const calculatedWidth = Math.max(288, (containerWidth / 3) - 20);
                setCardWidth(Math.min(400, calculatedWidth)); // Cap at 400px
            }
        };

        updateCardWidth();
        window.addEventListener('resize', updateCardWidth);
        return () => window.removeEventListener('resize', updateCardWidth);
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className={styles.spacesScreen}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner} />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={styles.spacesScreen}>
                <div className={styles.errorContainer}>
                    Error loading spaces: {error}
                </div>
            </div>
        );
    }

    // Empty state - Pixel-perfect from Flutter WorkspaceZeroState
    if (spaces.length === 0) {
        return (
            <div className={styles.spacesScreen}>
                <div className={styles.emptyState}>
                    {/* Illustration */}
                    <div className={styles.emptyStateIllustration}>
                        {/* Decorative dots */}
                        <div className={styles.emptyStateDot} />
                        <div className={styles.emptyStateDot} />
                        <div className={styles.emptyStateDot} />
                        <div className={styles.emptyStateDot} />
                        {/* Plus icon */}
                        <div className={styles.emptyStateIllustrationPlus}>
                            <Plus size={16} />
                        </div>
                        {/* Folder icon */}
                        <div className={styles.emptyStateIllustrationFolder}>
                            <Folder size={28} />
                        </div>
                    </div>

                    {/* Welcome heading */}
                    <h1 className={styles.emptyStateHeading}>
                        Welcome to your Spaces
                    </h1>

                    {/* Description */}
                    <p className={styles.emptyStateDescription}>
                        This is your new command center. Create a space to start organizing your files, managing your learning resources, and building your next big project.
                    </p>

                    {/* Primary button */}
                    <button className={styles.emptyStateButton} onClick={onAddSpace}>
                        <Plus size={18} />
                        Create Space
                    </button>

                    {/* Secondary button */}
                    <button className={styles.emptyStateSecondaryButton} onClick={onAddSpace}>
                        <FolderOpen size={18} />
                        Open existing folder
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={styles.spacesScreen}
            tabIndex={0}
        >
            {/* Cards Container */}
            <div ref={scrollContainerRef} className={styles.cardsContainer}>
                {spaces.map((space, index) => (
                    <div
                        key={space.id}
                        className={styles.cardWrapper}
                        style={{
                            width: `${cardWidth}px`,
                            '--space-accent-color': space.accentColor,
                        } as React.CSSProperties}
                    >
                        <SpaceCard
                            space={space}
                            spaceIndex={index}
                            isSelected={index === activeSpaceIndex}
                            selectedItemId={selectedItemId}
                            keyboardSelectedItemId={keyboardSelectedItemId}
                            expandedIds={getExpandedIds(space.id)}
                            onSelect={() => handleCardSelect(index)}
                            onItemClick={handleItemClick}
                            onItemContextMenu={onItemContextMenu}
                            onExpandedChange={(ids) => handleExpandedChange(space.id, ids)}
                            onAddFolder={onAddFolder}
                            onAddLink={onAddLink}
                        />
                    </div>
                ))}
            </div>

            {/* Bottom Navigation Bar */}
            <div className={styles.bottomNavContainer}>
                <SpacesBottomBar
                    spaces={spaces}
                    activeIndex={activeSpaceIndex}
                    onSpaceSelect={onSpaceSelect}
                    onAddSpace={onAddSpace}
                    onReorderSpaces={onReorderSpaces}
                />
            </div>
        </div>
    );
}
