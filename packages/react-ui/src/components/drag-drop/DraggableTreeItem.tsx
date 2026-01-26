import React, { useCallback, useState, useRef, useEffect, memo } from 'react';
import type { SpaceItem } from '../../types';
import { useDragDropUiStore, type DragData, type DragSource } from '../../stores/dragDropUiStore';
import { DragPreview } from './DragPreview';

interface DraggableTreeItemProps {
    item: SpaceItem;
    spaceId: string;
    parentId: string | null;
    index: number;
    level: number;
    accentColor: string;
    ancestorIds: string[];
    selectedItems?: SpaceItem[];
    /** Context where this draggable is rendered */
    dragSource?: DragSource;
    children: React.ReactNode;
}

export const DraggableTreeItem = memo(function DraggableTreeItem({
    item,
    spaceId,
    parentId,
    index,
    level,
    accentColor,
    ancestorIds,
    selectedItems,
    dragSource = 'sidebar',
    children,
}: DraggableTreeItemProps): React.ReactElement {
    // Only subscribe to whether THIS item is being dragged to minimize re-renders
    const isBeingDragged = useDragDropUiStore((state) =>
        state.isDragging && state.dragData?.item.id === item.id
    );
    const startDrag = useDragDropUiStore((state) => state.startDrag);
    const endDrag = useDragDropUiStore((state) => state.endDrag);

    const [isThisDragging, setIsThisDragging] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
    const dragPreviewRef = useRef<HTMLDivElement | null>(null);

    const itemsToDrag = selectedItems && selectedItems.length > 0 ? selectedItems : [item];

    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        const dragDataPayload: DragData = {
            item,
            items: itemsToDrag,
            spaceId,
            parentId,
            sourceIndex: index,
            source: dragSource,
            ancestorIds,
        };

        e.dataTransfer.setData('application/json', JSON.stringify(dragDataPayload));
        e.dataTransfer.effectAllowed = 'move';

        // Create a custom drag image
        if (dragPreviewRef.current) {
            // Position the drag image with offset (16px right, 8px down)
            e.dataTransfer.setDragImage(dragPreviewRef.current, -16, -8);
        }

        setIsThisDragging(true);
        startDrag(dragDataPayload);
    }, [item, itemsToDrag, spaceId, parentId, index, dragSource, ancestorIds, startDrag]);

    const handleDragEnd = useCallback(() => {
        setIsThisDragging(false);
        endDrag();
    }, [endDrag]);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (e.clientX !== 0 || e.clientY !== 0) {
            setPreviewPosition({ x: e.clientX + 16, y: e.clientY + 8 });
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isThisDragging) {
                endDrag();
            }
        };
    }, [isThisDragging, endDrag]);

    return (
        <>
            <div
                data-testid="draggable-tree-item"
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrag={handleDrag}
                style={{
                    opacity: isBeingDragged ? 0.4 : 1,
                    cursor: 'grab',
                }}
            >
                {children}
            </div>
            {/* Hidden drag preview for setDragImage */}
            <div
                ref={dragPreviewRef}
                style={{
                    position: 'fixed',
                    top: -9999,
                    left: -9999,
                    pointerEvents: 'none',
                }}
            >
                <DragPreview items={itemsToDrag} accentColor={accentColor} />
            </div>
        </>
    );
});

export default DraggableTreeItem;
