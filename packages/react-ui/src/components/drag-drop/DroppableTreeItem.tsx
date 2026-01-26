import React, { useCallback, useRef, useEffect, useState, memo } from 'react';
import type { SpaceItem } from '../../types';
import { SpaceItemType } from '../../types';
import { useDragDropUiStore, type DropPosition, type DragSource } from '../../stores/dragDropUiStore';
import { DropIndicatorLine } from './DropIndicatorLine';

interface DroppableTreeItemProps {
    item: SpaceItem;
    spaceId: string;
    parentId: string | null;
    index: number;
    level: number;
    accentColor: string;
    ancestorIds: string[];
    children: React.ReactNode;
    /** Context where this droppable is rendered - only accepts drops from same context */
    dropContext?: DragSource;
    onDrop?: (targetId: string, position: DropPosition) => void;
}

const AUTO_EXPAND_DELAY = 800;

export const DroppableTreeItem = memo(function DroppableTreeItem({
    item,
    spaceId,
    parentId,
    index,
    level,
    accentColor,
    ancestorIds,
    children,
    dropContext = 'sidebar',
    onDrop,
}: DroppableTreeItemProps): React.ReactElement {
    // Use single store subscription with shallow comparison for better performance
    const {
        isDragging,
        dragData,
        setDropIndicator,
        clearDropIndicator,
        setDragExpandedFolder,
        clearDragExpandedFolder,
        validateDrop,
    } = useDragDropUiStore();

    // Only subscribe to dropIndicator when this item is the target AND drag source matches context
    const isDropTarget = useDragDropUiStore((state) =>
        state.dropIndicator?.targetId === item.id && state.dragData?.source === dropContext
    );
    const dropPosition = useDragDropUiStore((state) =>
        state.dropIndicator?.targetId === item.id && state.dragData?.source === dropContext
            ? state.dropIndicator.position
            : null
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const autoExpandTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isHovering, setIsHovering] = useState(false);

    const isFolder = item.type === SpaceItemType.folder;
    // Only valid drop target if drag source matches this context
    const isFromSameContext = dragData?.source === dropContext;
    const isValidDropTarget = dragData && isFromSameContext ? validateDrop(dragData, item.id, ancestorIds) : false;

    const calculateDropPosition = useCallback((e: React.DragEvent<HTMLDivElement>): DropPosition => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect || rect.height === 0) return 'after';

        const relativeY = e.clientY - rect.top;
        const height = rect.height;
        const ratio = relativeY / height;

        if (isFolder) {
            // 20/60/20 split for folders
            if (ratio < 0.2) return 'before';
            if (ratio > 0.8) return 'after';
            return 'inside';
        } else {
            // 50/50 split for links
            return ratio < 0.5 ? 'before' : 'after';
        }
    }, [isFolder]);

    // Track last position to avoid unnecessary updates
    const lastPositionRef = useRef<DropPosition | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isDragging || !dragData || !isValidDropTarget) {
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
            return;
        }

        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        const position = calculateDropPosition(e);

        // Only update if position changed or target changed to reduce flickering
        if (lastPositionRef.current !== position || !isDropTarget) {
            lastPositionRef.current = position;
            setDropIndicator({
                targetId: item.id,
                position,
                spaceId,
                targetIndex: index,
                targetParentId: parentId,
            });
        }
    }, [isDragging, dragData, isValidDropTarget, calculateDropPosition, setDropIndicator, item.id, spaceId, index, parentId, isDropTarget]);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isDragging || !isValidDropTarget) return;

        setIsHovering(true);

        // Auto-expand folder after delay
        if (isFolder && !item.isExpanded) {
            autoExpandTimerRef.current = setTimeout(() => {
                setDragExpandedFolder(item.id);
            }, AUTO_EXPAND_DELAY);
        }
    }, [isDragging, isValidDropTarget, isFolder, item.isExpanded, item.id, setDragExpandedFolder]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        // Only handle if leaving the container entirely
        const relatedTarget = e.relatedTarget as Node | null;
        if (containerRef.current?.contains(relatedTarget)) return;

        setIsHovering(false);
        lastPositionRef.current = null;
        clearDropIndicator();

        // Clear auto-expand timer
        if (autoExpandTimerRef.current) {
            clearTimeout(autoExpandTimerRef.current);
            autoExpandTimerRef.current = null;
        }
    }, [clearDropIndicator]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isDragging || !dragData || !isValidDropTarget) return;

        const position = calculateDropPosition(e);

        // Clear timers and state
        if (autoExpandTimerRef.current) {
            clearTimeout(autoExpandTimerRef.current);
            autoExpandTimerRef.current = null;
        }

        setIsHovering(false);
        clearDropIndicator();
        clearDragExpandedFolder();

        onDrop?.(item.id, position);
    }, [isDragging, dragData, isValidDropTarget, calculateDropPosition, clearDropIndicator, clearDragExpandedFolder, onDrop, item.id]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoExpandTimerRef.current) {
                clearTimeout(autoExpandTimerRef.current);
            }
        };
    }, []);

    const showBeforeIndicator = isDropTarget && dropPosition === 'before';
    const showAfterIndicator = isDropTarget && dropPosition === 'after';
    const showInsideHighlight = isDropTarget && dropPosition === 'inside';

    return (
        <div
            ref={containerRef}
            data-testid="droppable-tree-item"
            data-valid-drop={isValidDropTarget}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <DropIndicatorLine
                visible={showBeforeIndicator}
                accentColor={accentColor}
                level={level}
            />
            <div
                data-testid="drop-target-content"
                style={{
                    backgroundColor: showInsideHighlight ? `${accentColor}20` : 'transparent',
                    borderRadius: showInsideHighlight ? '8px' : '0',
                    transition: 'background-color 150ms ease',
                }}
            >
                {children}
            </div>
            <DropIndicatorLine
                visible={showAfterIndicator}
                accentColor={accentColor}
                level={level}
            />
        </div>
    );
});

export default DroppableTreeItem;
