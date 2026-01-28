import React, { useState, useCallback } from 'react';
import type { Space } from '../../types';
import { useDragDropUiStore, type DragData } from '../../stores/dragDropUiStore';
import styles from './DroppableSpaceCard.module.css';

export interface DroppableSpaceCardProps {
    space: Space;
    onAcceptItem: (data: DragData) => Promise<void>;
    children: React.ReactNode;
}

/**
 * DroppableSpaceCard - Wrapper that makes a space card a drop target.
 * Shows visual feedback (border highlight + glow) when items are dragged over.
 * Accepts drops from any source (sidebar or other cards) except same space.
 */
export function DroppableSpaceCard({
    space,
    onAcceptItem,
    children,
}: DroppableSpaceCardProps): React.ReactElement {
    const [isHovering, setIsHovering] = useState(false);
    const { isDragging, dragData } = useDragDropUiStore();

    // Accept drops from different spaces only
    const canAccept = isDragging && dragData && dragData.spaceId !== space.id;

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (!canAccept) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsHovering(true);
    }, [canAccept]);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        if (!canAccept) return;
        e.preventDefault();
        setIsHovering(true);
    }, [canAccept]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        // Only trigger if leaving the card entirely (not entering a child)
        const relatedTarget = e.relatedTarget as Node | null;
        if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
            return;
        }
        setIsHovering(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);

        if (!canAccept || !dragData) return;

        await onAcceptItem(dragData);
    }, [canAccept, dragData, onAcceptItem]);

    const containerClasses = [
        styles.droppableCard,
        isHovering && canAccept && styles.dropTarget,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={containerClasses}
            style={{
                '--accent-color': space.accentColor,
            } as React.CSSProperties}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {children}
        </div>
    );
}
