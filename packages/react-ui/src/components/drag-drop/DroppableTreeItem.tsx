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
    isExpanded?: boolean;
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
    isExpanded = false,
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
        addDragExpandedFolder,
        validateDrop,
    } = useDragDropUiStore();

    // F032: Accept drops from same context OR cross-space drops from different context
    // Cross-space drops are allowed when dragData.spaceId !== this item's spaceId
    const isAcceptableDrop = useDragDropUiStore((state) => {
        if (!state.dragData) return false;
        const isSameContext = state.dragData.source === dropContext;
        const isCrossSpace = state.dragData.spaceId !== spaceId;
        // Accept if same context (normal reorder) OR cross-space from different context
        return isSameContext || isCrossSpace;
    });

    const isDropTarget = useDragDropUiStore((state) =>
        state.dropIndicator?.targetId === item.id && isAcceptableDrop
    );
    const dropPosition = useDragDropUiStore((state) =>
        state.dropIndicator?.targetId === item.id && isAcceptableDrop
            ? state.dropIndicator.position
            : null
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const autoExpandTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isHovering, setIsHovering] = useState(false);

    const isFolder = item.type === SpaceItemType.folder;
    // F032: Valid drop target if same context OR cross-space drop
    const isFromSameContext = dragData?.source === dropContext;
    const isCrossSpaceDrop = dragData && dragData.spaceId !== spaceId;
    const canAcceptDrop = isFromSameContext || isCrossSpaceDrop;
    const isValidDropTarget = dragData && canAcceptDrop ? validateDrop(dragData, item.id, ancestorIds) : false;

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

        console.log(`[DragEnter] Item: ${item.name} (${item.id})`);

        if (!isDragging || !isValidDropTarget) {
            console.log(`[DragEnter] Skipped - isDragging: ${isDragging}, isValidDropTarget: ${isValidDropTarget}`);
            return;
        }

        setIsHovering(true);

        // Auto-expand folder after delay
        if (isFolder && !isExpanded) {
            // CRITICAL: Clear any existing timer to prevent orphaned timers firing after drag ends
            if (autoExpandTimerRef.current) {
                console.log(`[DragEnter] Clearing previous timer for: ${item.name}`);
                clearTimeout(autoExpandTimerRef.current);
            }

            console.log(`[DragEnter] Setting auto-expand timer for folder: ${item.name}`);
            autoExpandTimerRef.current = setTimeout(() => {
                console.log(`[DragEnter] Auto-expanding folder: ${item.name} (${item.id})`);
                addDragExpandedFolder(item.id);
            }, AUTO_EXPAND_DELAY);
        }
    }, [isDragging, isValidDropTarget, isFolder, isExpanded, item.id, item.name, addDragExpandedFolder]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        console.log(`[DragLeave] Item: ${item.name} (${item.id})`);

        // Only handle if leaving the container entirely
        const relatedTarget = e.relatedTarget as Node | null;
        if (containerRef.current?.contains(relatedTarget)) {
            console.log(`[DragLeave] Skipped - still inside container`);
            return;
        }

        console.log(`[DragLeave] Left container - clearing drop indicator`);
        setIsHovering(false);
        lastPositionRef.current = null;
        clearDropIndicator();

        // Clear auto-expand timer
        if (autoExpandTimerRef.current) {
            console.log(`[DragLeave] Clearing auto-expand timer for: ${item.name}`);
            clearTimeout(autoExpandTimerRef.current);
            autoExpandTimerRef.current = null;
        }

        // DO NOT clear dragExpandedFolder here!
        // When moving from parent to child, this fires but we want the folder to stay expanded.
        // The folder will be cleared on endDrag() or handleDrop() instead.
        console.log(`[DragLeave] NOT clearing dragExpandedFolder (will clear on drop/end)`);
    }, [clearDropIndicator, item.id, item.name]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        console.log(`[Drop] ========== DROP EVENT START ==========`);
        console.log(`[Drop] Target: ${item.name} (${item.id})`);

        if (!isDragging || !dragData || !isValidDropTarget) {
            console.log(`[Drop] Rejected - isDragging: ${isDragging}, dragData: ${!!dragData}, isValidDropTarget: ${isValidDropTarget}`);
            return;
        }

        const position = calculateDropPosition(e);
        console.log(`[Drop] Position: ${position}`);

        // Clear timers and state
        if (autoExpandTimerRef.current) {
            console.log(`[Drop] Clearing auto-expand timer`);
            clearTimeout(autoExpandTimerRef.current);
            autoExpandTimerRef.current = null;
        }

        console.log(`[Drop] Clearing hover state and indicators`);
        setIsHovering(false);
        clearDropIndicator();
        // NOTE: Do NOT call clearDragExpandedFolders() here!
        // The folders need to stay expanded until they're persisted to base expandedIds.
        // endDrag() will be called by DraggableTreeItem.handleDragEnd() after the drop completes,
        // and by that point TreeView will have committed the folders to base state.

        console.log(`[Drop] Calling onDrop handler (dragExpandedFolders preserved for commit)`);
        // Pass dragData so the handler knows which item was dragged
        onDrop?.(item.id, position);
        console.log(`[Drop] ========== DROP EVENT END ==========`);
    }, [isDragging, dragData, isValidDropTarget, calculateDropPosition, clearDropIndicator, onDrop, item.id, item.name]);

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
