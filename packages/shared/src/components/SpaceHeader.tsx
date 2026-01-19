import React, { useState } from 'react';
import { Pencil, FolderPlus, Link, StickyNote, Download } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Space } from '../types';
import styles from './SpaceHeader.module.css';

// Icon component mapping
const ICON_MAP: Record<string, React.ComponentType<any>> = {
    'briefcase': LucideIcons.Briefcase, 'building': LucideIcons.Building,
    'laptop': LucideIcons.Laptop, 'calendar': LucideIcons.Calendar,
    'clipboard': LucideIcons.Clipboard, 'home': LucideIcons.Home,
    'heart': LucideIcons.Heart, 'user': LucideIcons.User,
    'users': LucideIcons.Users, 'smile': LucideIcons.Smile,
    'code': LucideIcons.Code, 'terminal': LucideIcons.Terminal,
    'database': LucideIcons.Database, 'cpu': LucideIcons.Cpu,
    'git-branch': LucideIcons.GitBranch, 'palette': LucideIcons.Palette,
    'image': LucideIcons.Image, 'music': LucideIcons.Music,
    'video': LucideIcons.Video, 'camera': LucideIcons.Camera,
    'folder': LucideIcons.Folder, 'layers': LucideIcons.Layers,
    'archive': LucideIcons.Archive, 'bookmark': LucideIcons.Bookmark,
    'star': LucideIcons.Star, 'book': LucideIcons.Book,
    'graduation-cap': LucideIcons.GraduationCap, 'lightbulb': LucideIcons.Lightbulb,
    'brain': LucideIcons.Brain, 'shopping-cart': LucideIcons.ShoppingCart,
    'dollar-sign': LucideIcons.DollarSign, 'credit-card': LucideIcons.CreditCard,
    'mail': LucideIcons.Mail, 'message-circle': LucideIcons.MessageCircle,
    'phone': LucideIcons.Phone, 'plane': LucideIcons.Plane,
    'map': LucideIcons.Map, 'compass': LucideIcons.Compass,
    'activity': LucideIcons.Activity, 'dumbbell': LucideIcons.Dumbbell,
    'rocket': LucideIcons.Rocket, 'trophy': LucideIcons.Trophy,
    'target': LucideIcons.Target, 'zap': LucideIcons.Zap,
    'flame': LucideIcons.Flame,
};

function getIconComponent(iconName: string): React.ComponentType<any> {
    return ICON_MAP[iconName] || LucideIcons.Layers;
}

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
                {React.createElement(getIconComponent(space.iconName), {
                    size: 14,
                    style: { color: space.accentColor }
                })}
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
