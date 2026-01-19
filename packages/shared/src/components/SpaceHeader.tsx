import React, { useState } from 'react';
import { Pencil, FolderPlus, Link, StickyNote, Download } from 'lucide-react';
import type { Space } from '../types';
import styles from './SpaceHeader.module.css';

export interface SpaceHeaderProps {
    space: Space;
    onEditSpace?: (space: Space) => void;
    onAddFolder?: (spaceId: string) => void;
    onAddLink?: (spaceId: string) => void;
    onContextMenu?: (space: Space, event: React.MouseEvent) => void;
}

export function SpaceHeader({
    space,
    onEditSpace,
    onAddFolder,
    onAddLink,
    onContextMenu,
}: SpaceHeaderProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        onContextMenu?.(space, e);
    };

    return (
        <div
            className={`${styles.header} ${isHovered ? styles.hovered : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={handleContextMenu}
        >
            {/* Space icon */}
            <div
                className={styles.iconContainer}
                style={{ backgroundColor: `${space.accentColor}26` }}
            >
                <span
                    className={styles.iconEmoji}
                    style={{ color: space.accentColor }}
                >
                    🚀
                </span>
            </div>

            {/* Space name */}
            <h2
                className={styles.name}
                style={{ color: space.accentColor }}
            >
                {space.name.toUpperCase()}
            </h2>

            {/* Edit button (on hover) */}
            <button
                className={`${styles.editButton} ${isHovered ? styles.visible : ''}`}
                onClick={() => onEditSpace?.(space)}
                title="Edit space"
            >
                <Pencil size={14} />
            </button>

            <div className={styles.spacer} />

            {/* Action icons (on hover) */}
            <div className={`${styles.actions} ${isHovered ? styles.visible : ''}`}>
                <button
                    className={styles.actionButton}
                    onClick={() => onAddFolder?.(space.id)}
                    title="Add Folder"
                >
                    <FolderPlus size={14} />
                </button>
                <button
                    className={styles.actionButton}
                    onClick={() => onAddLink?.(space.id)}
                    title="Add Link"
                >
                    <Link size={14} />
                </button>
                <button
                    className={styles.actionButton}
                    disabled
                    title="Add Note (Coming Soon)"
                >
                    <StickyNote size={14} />
                </button>
                <button
                    className={styles.actionButton}
                    disabled
                    title="Import (Coming Soon)"
                >
                    <Download size={14} />
                </button>
            </div>
        </div>
    );
}
