/**
 * F022/F023: PinnedLinksGrid with @dnd-kit for smooth drag-and-drop reordering
 * Battle-tested library providing silky smooth animations
 */
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    MeasuringStrategy,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Star, Link as LinkIcon } from 'lucide-react';
import type { SpaceItem } from '../types';
import { SpaceItemType } from '../types';
import { useDragDropUiStore } from '../stores/dragDropUiStore';
import type { DragData } from '../stores/dragDropUiStore';
import { extractDomain, getGoogleFaviconUrl } from '../services/FaviconCache';
import { SortablePinnedCard } from './SortablePinnedCard';
import styles from './PinnedLinksGrid.module.css';

// Get favicon URL - use stored base64 or Google Favicon Service
function getFaviconUrl(item: SpaceItem): string | null {
    if (item.faviconUrl?.startsWith('data:')) {
        return item.faviconUrl;
    }
    if (item.path) {
        const domain = extractDomain(item.path);
        if (domain) {
            return getGoogleFaviconUrl(domain);
        }
    }
    return null;
}

const MAX_PINS = 15;
const CARD_SIZE = 48;
const SPACING = 8;
const COLUMNS = 5;
const PADDING = 6;

export interface PinnedLinksGridProps {
    pinnedItems: SpaceItem[];
    spaceColor: string;
    spaceId: string;
    onItemClick?: (item: SpaceItem) => void;
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
    onPinItem?: (itemId: string, position: number) => Promise<boolean>;
    /** F023: Optimistic reorder - called synchronously, parent handles UI update */
    onReorderPins?: (oldIndex: number, newIndex: number) => void;
}

function calculateDropIndex(
    clientX: number,
    clientY: number,
    gridRect: DOMRect,
    pinnedCount: number
): number {
    const cellWidth = CARD_SIZE + SPACING;
    const cellHeight = CARD_SIZE + SPACING;

    const adjustedX = clientX - gridRect.left - PADDING;
    const adjustedY = clientY - gridRect.top - PADDING;

    const col = Math.floor((adjustedX + cellWidth / 2) / cellWidth);
    const row = Math.floor((adjustedY + cellHeight / 2) / cellHeight);

    const clampedCol = Math.max(0, Math.min(col, COLUMNS - 1));
    const clampedRow = Math.max(0, Math.min(row, 2));

    return Math.min(clampedRow * COLUMNS + clampedCol, pinnedCount);
}

function canAcceptDrop(dragData: DragData | null, pinnedCount: number, gridSpaceId?: string): boolean {
    if (!dragData) return false;
    if (dragData.item.type !== SpaceItemType.link) return false;
    // Only accept items from the same space
    if (gridSpaceId && dragData.spaceId !== gridSpaceId) return false;
    if (!dragData.item.isPinned && pinnedCount >= MAX_PINS) return false;
    return true;
}

export function PinnedLinksGrid({
    pinnedItems,
    spaceColor,
    spaceId,
    onItemClick,
    onItemContextMenu,
    onPinItem,
    onReorderPins,
}: PinnedLinksGridProps): React.ReactElement {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isDropTarget, setIsDropTarget] = useState(false);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

    const { dragData, setOverPinsGrid, isDragging: isExternalDragging } = useDragDropUiStore();

    // Memoize item IDs for SortableContext
    const itemIds = useMemo(() => pinnedItems.map(item => item.id), [pinnedItems]);

    // Get active item for drag overlay
    const activeItem = useMemo(
        () => pinnedItems.find(item => item.id === activeId),
        [activeId, pinnedItems]
    );

    // Configure sensors with activation constraints
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag start - track which item is being dragged
    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    // Handle drag end - reorder items
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = pinnedItems.findIndex(item => item.id === active.id);
        const newIndex = pinnedItems.findIndex(item => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            // Call the reorder callback - parent handles optimistic UI update
            onReorderPins?.(oldIndex, newIndex);
        }
    }, [pinnedItems, onReorderPins]);

    // Handle external drops (from sidebar tree)
    const handleExternalDragEnter = useCallback((e: React.DragEvent) => {
        // Only handle if not already in internal dnd-kit drag
        if (activeId) return;

        e.preventDefault();
        e.stopPropagation();

        if (cleanupTimerRef.current) {
            clearTimeout(cleanupTimerRef.current);
            cleanupTimerRef.current = null;
        }

        if (dragData && !canAcceptDrop(dragData, pinnedItems.length, spaceId)) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }

        setIsDropTarget(true);
        setOverPinsGrid(true, 0);
    }, [activeId, dragData, pinnedItems.length, spaceId, setOverPinsGrid]);

    const handleExternalDragOver = useCallback((e: React.DragEvent) => {
        // Only handle if not in internal dnd-kit drag
        if (activeId) return;

        e.preventDefault();
        e.stopPropagation();

        if (dragData && !canAcceptDrop(dragData, pinnedItems.length, spaceId)) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }

        e.dataTransfer.dropEffect = 'move';
        setIsDropTarget(true);

        if (gridRef.current) {
            const rect = gridRef.current.getBoundingClientRect();
            const index = calculateDropIndex(e.clientX, e.clientY, rect, pinnedItems.length);
            setDropIndex(index);
            setOverPinsGrid(true, index);
        }
    }, [activeId, dragData, pinnedItems.length, spaceId, setOverPinsGrid]);

    const handleExternalDragLeave = useCallback((e: React.DragEvent) => {
        if (activeId) return;

        const relatedTarget = e.relatedTarget as Node | null;
        if (gridRef.current?.contains(relatedTarget)) {
            return;
        }

        // Use requestAnimationFrame for smoother cleanup - prevents visible state flash
        // while still allowing brief hover-over-gap scenarios
        if (cleanupTimerRef.current) {
            clearTimeout(cleanupTimerRef.current);
        }
        cleanupTimerRef.current = setTimeout(() => {
            // Double RAF ensures cleanup happens after any pending re-entry events
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsDropTarget(false);
                    setDropIndex(null);
                    setOverPinsGrid(false);
                });
            });
        }, 16); // ~1 frame delay, much shorter than 100ms
    }, [activeId, setOverPinsGrid]);

    const handleExternalDrop = useCallback((e: React.DragEvent) => {
        // Only handle external drops (not internal dnd-kit)
        if (activeId) return;

        e.preventDefault();
        e.stopPropagation();

        if (cleanupTimerRef.current) {
            clearTimeout(cleanupTimerRef.current);
            cleanupTimerRef.current = null;
        }

        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) {
            setIsDropTarget(false);
            setDropIndex(null);
            setOverPinsGrid(false);
            return;
        }

        const targetIndex = dropIndex ?? pinnedItems.length;

        setIsDropTarget(false);
        setDropIndex(null);
        setOverPinsGrid(false);

        try {
            const data = JSON.parse(dataStr) as DragData;

            // Check if item is ACTUALLY in the pins grid (not just database flag)
            const isActuallyInGrid = pinnedItems.some(p => p.id === data.item.id);

            if (!isActuallyInGrid && onPinItem) {
                onPinItem(data.item.id, targetIndex).catch(err => {
                    console.error('Failed to pin item:', err);
                });
            }
        } catch (err) {
            console.error('Failed to process drop:', err);
        }
    }, [activeId, dropIndex, pinnedItems, onPinItem, setOverPinsGrid]);

    const isEmpty = pinnedItems.length === 0;

    // Show larger drop zone when empty
    if (isEmpty) {
        const showHighlight = isDropTarget || (isExternalDragging && canAcceptDrop(dragData, 0, spaceId));
        return (
            <div
                ref={gridRef}
                className={`${styles.emptyDropZone} ${showHighlight ? styles.emptyDropZoneActive : ''}`}
                style={showHighlight ? {
                    borderColor: spaceColor,
                    backgroundColor: `${spaceColor}0D`
                } : undefined}
                onDragEnter={handleExternalDragEnter}
                onDragOver={handleExternalDragOver}
                onDragLeave={handleExternalDragLeave}
                onDrop={handleExternalDrop}
            >
                <Star size={20} className={styles.emptyDropZoneIcon} style={showHighlight ? { color: spaceColor } : undefined} />
                <span className={styles.emptyDropZoneTitle}>Drag to add Favorites</span>
                <span className={styles.emptyDropZoneSubtitle}>Favorites keep your most used sites and apps close</span>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            measuring={{
                droppable: {
                    strategy: MeasuringStrategy.Always,
                },
            }}
        >
            <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                <div
                    ref={gridRef}
                    className={`${styles.grid} ${isDropTarget ? styles.dropTarget : ''}`}
                    style={isDropTarget ? { borderColor: spaceColor, borderWidth: '2px' } : undefined}
                    onDragEnter={handleExternalDragEnter}
                    onDragOver={handleExternalDragOver}
                    onDragLeave={handleExternalDragLeave}
                    onDrop={handleExternalDrop}
                >
                    {/* External drop preview */}
                    {isDropTarget && dragData && !dragData.item.isPinned && dropIndex !== null && (
                        <div
                            key="drop-preview"
                            className={styles.dropPreview}
                            style={{
                                borderColor: spaceColor,
                                backgroundColor: `${spaceColor}33`,
                                order: dropIndex,
                            }}
                        >
                            {(() => {
                                const faviconSrc = getFaviconUrl(dragData.item);
                                return faviconSrc ? (
                                    <img src={faviconSrc} alt="" className={styles.favicon} />
                                ) : (
                                    <LinkIcon size={24} style={{ color: spaceColor }} />
                                );
                            })()}
                        </div>
                    )}

                    {/* Sortable pinned cards */}
                    {pinnedItems.map((item) => (
                        <SortablePinnedCard
                            key={item.id}
                            item={item}
                            spaceColor={spaceColor}
                            spaceId={spaceId}
                            onItemClick={onItemClick}
                            onItemContextMenu={onItemContextMenu}
                        />
                    ))}
                </div>
            </SortableContext>

            {/* Drag overlay - shows the dragged item following cursor */}
            <DragOverlay>
                {activeItem ? (
                    <div
                        className={styles.card}
                        style={{
                            borderColor: spaceColor,
                            cursor: 'grabbing',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        {(() => {
                            const faviconSrc = getFaviconUrl(activeItem);
                            return faviconSrc ? (
                                <img src={faviconSrc} alt="" className={styles.favicon} />
                            ) : (
                                <LinkIcon size={24} style={{ color: spaceColor }} />
                            );
                        })()}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
