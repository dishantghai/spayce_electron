import React from 'react';
import { Folder, Link as LinkIcon } from 'lucide-react';
import type { SpaceItem } from '../../types';
import { SpaceItemType, } from '../../types';
import { SpayceColors } from '../../theme';
import styles from './DragPreview.module.css';

interface DragPreviewProps {
    items: SpaceItem[];
    accentColor: string;
    isSquare?: boolean;
}

export function DragPreview({ items, accentColor, isSquare }: DragPreviewProps): React.ReactElement {
    if (items.length === 0) {
        return <div data-testid="drag-preview" />;
    }

    if (items.length === 1) {
        return (
            <div data-testid="drag-preview">
                <SingleItemPreview item={items[0]} accentColor={accentColor} isSquare={isSquare} />
            </div>
        );
    }

    return (
        <div data-testid="drag-preview">
            <MultiItemPreview items={items} accentColor={accentColor} isSquare={isSquare} />
        </div>
    );
}

interface SingleItemPreviewProps {
    item: SpaceItem;
    accentColor: string;
    isSquare?: boolean;
}

export function SingleItemPreview({ item, accentColor, isSquare }: SingleItemPreviewProps): React.ReactElement {
    const isFolder = item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;

    if (isSquare) {
        return (
            <div
                data-testid="square-preview"
                className={styles.squarePreview}
                style={{
                    borderColor: accentColor,
                    backgroundColor: `${accentColor}33`, // 20% opacity
                }}
            >
                {item.faviconUrl ? (
                    <img
                        src={item.faviconUrl}
                        alt=""
                        className={styles.squareFavicon}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <LinkIcon size={24} color={accentColor} />
                )}
            </div>
        );
    }

    return (
        <div
            data-testid="single-item-preview"
            className={styles.rectanglePreview}
            style={{
                borderColor: `${accentColor}80`, // 50% opacity
            }}
        >
            <span className={styles.icon}>
                {isFolder ? (
                    <Folder size={16} color={accentColor} />
                ) : (
                    <LinkIcon size={16} color={SpayceColors.textSecondary} />
                )}
            </span>
            <span className={styles.name}>{item.name}</span>
        </div>
    );
}

interface MultiItemPreviewProps {
    items: SpaceItem[];
    accentColor: string;
    isSquare?: boolean;
}

export function MultiItemPreview({ items, accentColor, isSquare }: MultiItemPreviewProps): React.ReactElement {
    if (items.length === 0) {
        return <div data-testid="multi-item-preview" />;
    }

    return (
        <div data-testid="multi-item-preview" className={styles.multiPreviewContainer}>
            {/* Background stacked cards */}
            {items.length > 2 && (
                <div
                    className={styles.stackedCard}
                    style={{
                        left: 8,
                        top: 8,
                        opacity: 0.3,
                        borderColor: `${accentColor}4D`, // 30% opacity
                    }}
                />
            )}
            {items.length > 1 && (
                <div
                    className={styles.stackedCard}
                    style={{
                        left: 4,
                        top: 4,
                        opacity: 0.5,
                        borderColor: `${accentColor}80`, // 50% opacity
                    }}
                />
            )}
            {/* Main preview with count badge */}
            <div className={styles.mainPreview}>
                <SingleItemPreview item={items[0]} accentColor={accentColor} isSquare={isSquare} />
                <div
                    className={styles.countBadge}
                    style={{ backgroundColor: accentColor }}
                >
                    {items.length}
                </div>
            </div>
        </div>
    );
}

export default DragPreview;
