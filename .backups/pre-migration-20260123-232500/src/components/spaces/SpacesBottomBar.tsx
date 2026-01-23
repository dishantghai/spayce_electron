import React, { useState, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Space } from '../../types';
import styles from './SpacesScreen.module.css';

export interface SpacesBottomBarProps {
    spaces: Space[];
    activeIndex: number;
    onSpaceSelect?: (index: number) => void;
    onAddSpace?: () => void;
    onReorderSpaces?: (oldIndex: number, newIndex: number) => void;
}

export function SpacesBottomBar({
    spaces,
    activeIndex,
    onSpaceSelect,
    onAddSpace,
    onReorderSpaces,
}: SpacesBottomBarProps): React.ReactElement {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropTargetSlot, setDropTargetSlot] = useState<number | null>(null);
    const rowRef = useRef<HTMLDivElement>(null);

    // Calculate drop slot based on drag position
    const calculateDropSlot = useCallback((clientX: number): number => {
        if (!rowRef.current) return 0;

        const rowRect = rowRef.current.getBoundingClientRect();
        const localX = clientX - rowRect.left;
        const estimatedItemWidth = 100; // Approximate button width

        let slot = Math.floor(localX / estimatedItemWidth);
        return Math.max(0, Math.min(slot, spaces.length));
    }, [spaces.length]);

    const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const slot = calculateDropSlot(e.clientX);
        if (slot !== dropTargetSlot) {
            setDropTargetSlot(slot);
        }
    }, [calculateDropSlot, dropTargetSlot]);

    const handleDragEnd = useCallback(() => {
        if (draggedIndex !== null && dropTargetSlot !== null) {
            let newIndex = dropTargetSlot;
            const oldIndex = draggedIndex;

            // Adjust for insertion point
            if (newIndex > oldIndex) {
                newIndex -= 1;
            }

            if (newIndex !== oldIndex && newIndex >= 0 && newIndex < spaces.length) {
                onReorderSpaces?.(oldIndex, newIndex);
            }
        }

        setDraggedIndex(null);
        setDropTargetSlot(null);
    }, [draggedIndex, dropTargetSlot, spaces.length, onReorderSpaces]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        handleDragEnd();
    }, [handleDragEnd]);

    return (
        <div
            ref={rowRef}
            className={styles.bottomNav}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={() => setDropTargetSlot(null)}
        >
            {spaces.map((space, index) => (
                <React.Fragment key={space.id}>
                    {/* Drop indicator before this item */}
                    <DropIndicator
                        isActive={
                            dropTargetSlot === index &&
                            draggedIndex !== null &&
                            draggedIndex !== index &&
                            (draggedIndex < index ? draggedIndex !== index - 1 : true)
                        }
                    />

                    {/* Space tab button */}
                    <SpaceTabButton
                        space={space}
                        isActive={index === activeIndex}
                        isDragging={draggedIndex === index}
                        onClick={() => onSpaceSelect?.(index)}
                        onDragStart={(e) => handleDragStart(index, e)}
                        onDragEnd={handleDragEnd}
                    />
                </React.Fragment>
            ))}

            {/* Drop indicator after last item */}
            <DropIndicator
                isActive={
                    dropTargetSlot === spaces.length &&
                    draggedIndex !== null &&
                    draggedIndex !== spaces.length - 1
                }
            />

            {/* Add space button */}
            <button
                className={styles.addSpaceButton}
                onClick={onAddSpace}
                title="Add Space"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}

interface SpaceTabButtonProps {
    space: Space;
    isActive: boolean;
    isDragging: boolean;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
}

function SpaceTabButton({
    space,
    isActive,
    isDragging,
    onClick,
    onDragStart,
    onDragEnd,
}: SpaceTabButtonProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);

    const IconComponent = getSpaceIcon(space.iconName);

    const buttonClasses = [
        styles.spaceTab,
        isActive && styles.spaceTabActive,
        isDragging && styles.spaceTabDragging,
    ].filter(Boolean).join(' ');

    return (
        <button
            className={buttonClasses}
            style={{ '--tab-color': space.accentColor } as React.CSSProperties}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title={space.name}
        >
            <span className={styles.spaceTabIcon}>
                <IconComponent
                    size={16}
                    style={{ color: isActive ? space.accentColor : '#9CA3AF' }}
                />
            </span>
            <span className={styles.spaceTabName}>{space.name}</span>
        </button>
    );
}

interface DropIndicatorProps {
    isActive: boolean;
}

function DropIndicator({ isActive }: DropIndicatorProps): React.ReactElement {
    return (
        <div
            className={`${styles.dropIndicator} ${isActive ? styles.dropIndicatorActive : ''}`}
        />
    );
}

function getSpaceIcon(iconName: string): React.ComponentType<any> {
    const iconMap: Record<string, React.ComponentType<any>> = {
        'briefcase': LucideIcons.Briefcase,
        'building': LucideIcons.Building,
        'laptop': LucideIcons.Laptop,
        'calendar': LucideIcons.Calendar,
        'clipboard': LucideIcons.Clipboard,
        'home': LucideIcons.Home,
        'heart': LucideIcons.Heart,
        'user': LucideIcons.User,
        'users': LucideIcons.Users,
        'smile': LucideIcons.Smile,
        'code': LucideIcons.Code,
        'terminal': LucideIcons.Terminal,
        'database': LucideIcons.Database,
        'cpu': LucideIcons.Cpu,
        'git-branch': LucideIcons.GitBranch,
        'palette': LucideIcons.Palette,
        'image': LucideIcons.Image,
        'music': LucideIcons.Music,
        'video': LucideIcons.Video,
        'camera': LucideIcons.Camera,
        'folder': LucideIcons.Folder,
        'layers': LucideIcons.Layers,
        'archive': LucideIcons.Archive,
        'bookmark': LucideIcons.Bookmark,
        'star': LucideIcons.Star,
        'book': LucideIcons.Book,
        'graduation-cap': LucideIcons.GraduationCap,
        'lightbulb': LucideIcons.Lightbulb,
        'brain': LucideIcons.Brain,
        'shopping-cart': LucideIcons.ShoppingCart,
        'dollar-sign': LucideIcons.DollarSign,
        'credit-card': LucideIcons.CreditCard,
        'mail': LucideIcons.Mail,
        'message-circle': LucideIcons.MessageCircle,
        'phone': LucideIcons.Phone,
        'plane': LucideIcons.Plane,
        'map': LucideIcons.Map,
        'compass': LucideIcons.Compass,
        'activity': LucideIcons.Activity,
        'dumbbell': LucideIcons.Dumbbell,
        'rocket': LucideIcons.Rocket,
        'trophy': LucideIcons.Trophy,
        'target': LucideIcons.Target,
        'zap': LucideIcons.Zap,
        'flame': LucideIcons.Flame,
    };
    return iconMap[iconName] || LucideIcons.Layers;
}
