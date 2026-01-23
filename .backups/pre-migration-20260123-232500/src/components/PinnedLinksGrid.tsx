import React, { useState } from 'react';
import { Pin, Link as LinkIcon } from 'lucide-react';
import type { SpaceItem } from '../types';
import styles from './PinnedLinksGrid.module.css';

export interface PinnedLinksGridProps {
    pinnedItems: SpaceItem[];
    spaceColor: string;
    onItemClick?: (item: SpaceItem) => void;
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
}

export function PinnedLinksGrid({
    pinnedItems,
    spaceColor,
    onItemClick,
    onItemContextMenu,
}: PinnedLinksGridProps): React.ReactElement {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (pinnedItems.length === 0) {
        return (
            <div className={styles.emptyHint}>
                <Pin size={12} className={styles.emptyIcon} />
                <span>Drop links here to pin</span>
            </div>
        );
    }

    return (
        <div className={styles.grid}>
            {pinnedItems.map((item) => {
                const isHovered = hoveredId === item.id;

                return (
                    <button
                        key={item.id}
                        className={styles.card}
                        style={{
                            borderColor: isHovered ? spaceColor : undefined,
                        }}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => onItemClick?.(item)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            onItemContextMenu?.(item, e);
                        }}
                        title={item.name}
                    >
                        {item.faviconUrl ? (
                            <img
                                src={item.faviconUrl}
                                alt=""
                                className={styles.favicon}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <LinkIcon
                                size={24}
                                style={{ color: spaceColor }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
