/**
 * F023: Sortable pinned card component using @dnd-kit
 * Provides smooth drag-and-drop reordering with proper animations
 * Also supports native drag to unpin and move to tree
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link as LinkIcon } from 'lucide-react';
import type { SpaceItem } from '../types';
import type { DragData } from '../stores/dragDropUiStore';
import { extractDomain, getGoogleFaviconUrl } from '../services/FaviconCache';
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

export interface SortablePinnedCardProps {
    item: SpaceItem;
    spaceColor: string;
    spaceId: string;
    onItemClick?: (item: SpaceItem) => void;
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
}

export function SortablePinnedCard({
    item,
    spaceColor,
    spaceId,
    onItemClick,
    onItemContextMenu,
}: SortablePinnedCardProps): React.ReactElement {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const [isHovered, setIsHovered] = React.useState(false);

    // Native drag support for dragging to tree (to unpin and relocate)
    const handleNativeDragStart = React.useCallback((e: React.DragEvent) => {
        const dragData: DragData = {
            item,
            items: [item],
            spaceId,
            parentId: null,
            sourceIndex: 0,
            source: 'pins-grid',
            ancestorIds: [],
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
    }, [item, spaceId]);

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        borderColor: isHovered ? spaceColor : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    const faviconSrc = getFaviconUrl(item);

    return (
        <button
            ref={setNodeRef}
            style={style}
            className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
            {...attributes}
            {...listeners}
            draggable
            onDragStart={handleNativeDragStart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onItemClick?.(item)}
            onContextMenu={(e) => {
                e.preventDefault();
                onItemContextMenu?.(item, e);
            }}
            onDragOver={(e) => e.preventDefault()}
            title={item.name}
        >
            {faviconSrc ? (
                <img
                    src={faviconSrc}
                    alt=""
                    className={styles.favicon}
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            ) : (
                <LinkIcon size={24} style={{ color: spaceColor }} />
            )}
        </button>
    );
}
