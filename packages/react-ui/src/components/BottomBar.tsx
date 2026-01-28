import React, { useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Space } from '../types';
import styles from './BottomBar.module.css';

export interface BottomBarProps {
    spaces: Space[];
    activeSpaceIndex: number;
    onSpaceSelect: (index: number) => void;
    onAddSpace?: () => void;
    onSettingsClick?: () => void;
    userName?: string;
    onReorderSpaces?: (oldIndex: number, newIndex: number) => void;
}

export function BottomBar({
    spaces,
    activeSpaceIndex,
    onSpaceSelect,
    onAddSpace,
    onSettingsClick,
    userName = 'User',
    onReorderSpaces,
}: BottomBarProps): React.ReactElement {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [justDropped, setJustDropped] = useState(false);

    // F036: Calculate translateX offset for each icon to create gap animation
    const getTranslateOffset = (index: number): number => {
        if (draggedIndex === null || hoverIndex === null || draggedIndex === hoverIndex) {
            return 0;
        }

        const iconWidth = 28 + 8; // icon width + gap

        // Icon being dragged - no offset (it follows cursor)
        if (index === draggedIndex) {
            return 0;
        }

        // Icons between dragged position and hover position need to shift
        if (draggedIndex < hoverIndex) {
            // Dragging right: icons between draggedIndex and hoverIndex shift left
            if (index > draggedIndex && index <= hoverIndex) {
                return -iconWidth;
            }
        } else {
            // Dragging left: icons between hoverIndex and draggedIndex shift right
            if (index >= hoverIndex && index < draggedIndex) {
                return iconWidth;
            }
        }

        return 0;
    };

    return (
        <div className={styles.bottomBar}>
            {/* Space icons row */}
            <div
                className={styles.spacesRow}
                onMouseMove={() => {
                    // F036: Clear justDropped flag when mouse actually moves
                    if (justDropped) {
                        setJustDropped(false);
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                }}
                onDrop={(e) => {
                    console.log('[F036] spacesRow DROP detected');
                    e.preventDefault();
                    e.stopPropagation();

                    if (!onReorderSpaces) {
                        console.log('[F036] No onReorderSpaces handler');
                        return;
                    }

                    try {
                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                        console.log('[F036] Drop data:', data);

                        // Calculate which icon was dropped on based on hoverIndex
                        const targetIndex = hoverIndex !== null ? hoverIndex : data.sourceIndex;
                        console.log('[F036] Target index from hoverIndex:', targetIndex);

                        if (data.sourceIndex === targetIndex) {
                            console.log('[F036] Same position, no reorder needed');
                            setDraggedIndex(null);
                            setHoverIndex(null);
                            return;
                        }

                        // F036: Mark that drop just happened - no hover until mouse moves
                        setJustDropped(true);

                        console.log('[F036] Calling onReorderSpaces:', data.sourceIndex, '->', targetIndex);
                        onReorderSpaces(data.sourceIndex, targetIndex);
                    } catch (err) {
                        console.error('[F036] Failed to handle drop:', err);
                    } finally {
                        setDraggedIndex(null);
                        setHoverIndex(null);
                    }
                }}
            >
                {spaces.map((space, index) => (
                    <SpaceIcon
                        key={space.id}
                        space={space}
                        index={index}
                        isActive={index === activeSpaceIndex}
                        isDragging={draggedIndex === index}
                        translateOffset={getTranslateOffset(index)}
                        disableHover={justDropped}
                        onClick={() => onSpaceSelect(index)}
                        onReorder={onReorderSpaces}
                        onDragStateChange={(dragging, hovering, reset) => {
                            if (reset) {
                                setDraggedIndex(null);
                                setHoverIndex(null);
                            } else {
                                if (dragging !== undefined) setDraggedIndex(dragging);
                                if (hovering !== undefined) setHoverIndex(hovering);
                            }
                        }}
                    />
                ))}

                {/* Add space button */}
                <button
                    className={styles.addButton}
                    onClick={onAddSpace}
                    title="Add Space"
                >
                    <Plus size={10} />
                </button>
            </div>

            <div className={styles.divider} />

            {/* Profile button */}
            <button
                className={styles.profileButton}
                onClick={onSettingsClick}
                title="Settings"
            >
                <div className={styles.avatar}>
                    {userName.charAt(0).toUpperCase()}
                </div>
                <span className={styles.userName}>{userName}</span>
                <Settings size={14} className={styles.settingsIcon} />
            </button>
        </div>
    );
}

interface SpaceIconProps {
    space: Space;
    index: number;
    isActive: boolean;
    isDragging?: boolean;
    translateOffset?: number;
    disableHover?: boolean;
    isFocused?: boolean;
    onClick: () => void;
    onReorder?: (oldIndex: number, newIndex: number) => void;
    onDragStateChange?: (draggedIndex: number | undefined, hoverIndex: number | undefined, reset?: boolean) => void;
}

function SpaceIcon({ space, index, isActive, isDragging = false, translateOffset = 0, disableHover = false, isFocused = false, onClick, onReorder, onDragStateChange }: SpaceIconProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);

    // F036: Clear hover when dragging or when hover is disabled
    React.useEffect(() => {
        if (isDragging || disableHover) {
            setIsHovered(false);
        }
    }, [isDragging, disableHover]);

    // Get icon component from space iconName
    const getIconComponent = (iconName: string) => {
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
    };

    const IconComponent = getIconComponent(space.iconName);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Blur the button immediately to prevent lingering focus state
        e.currentTarget.blur();
        onClick();
    };

    // F036: Arc-style drag handlers - real-time reordering with gap
    const handleDragStart = (e: React.DragEvent) => {
        console.log('[F036] handleDragStart - index:', index, 'space:', space.name);
        console.log('[F036] onReorder exists:', !!onReorder, 'onDragStateChange exists:', !!onDragStateChange);

        if (!onReorder || !onDragStateChange) {
            console.log('[F036] Missing handlers, aborting drag');
            return;
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ spaceId: space.id, sourceIndex: index }));
        // Set dragged index, don't touch hover yet
        onDragStateChange(index, undefined, false);
        console.log('[F036] Drag started successfully');
    };

    const handleDragOver = (e: React.DragEvent) => {
        console.log('[F036] handleDragOver - index:', index);

        if (!onReorder || !onDragStateChange) {
            console.log('[F036] Missing handlers in dragOver');
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        console.log('[F036] dragOver - calling onDragStateChange with index:', index);
        // Update hover index to trigger translateX animation
        onDragStateChange(undefined, index, false);
    };

    const handleDragLeave = () => {
        // Don't clear hover on leave - only on drag end
    };

    const handleDrop = (e: React.DragEvent) => {
        console.log('[F036] handleDrop ENTERED - index:', index);

        if (!onReorder || !onDragStateChange) {
            console.log('[F036] Missing handlers in drop');
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        console.log('[F036] handleDrop called on index:', index);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            console.log('[F036] Drop data:', data);

            if (data.spaceId === space.id) {
                console.log('[F036] Cannot drop on self');
                return;
            }

            console.log('[F036] Calling onReorder:', data.sourceIndex, '->', index);
            onReorder(data.sourceIndex, index);
        } catch (err) {
            console.error('[F036] Failed to parse drag data:', err);
        } finally {
            console.log('[F036] Resetting drag state');
            onDragStateChange(undefined, undefined, true);
        }
    };

    const handleDragEnd = () => {
        console.log('[F036] handleDragEnd - index:', index);
        if (onDragStateChange) {
            onDragStateChange(undefined, undefined, true);
        }
    };

    return (
        <button
            className={`${styles.spaceIcon} ${isActive ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
            style={{
                backgroundColor: `${space.accentColor}26`,
                borderColor: isActive ? space.accentColor : (isHovered ? space.accentColor : 'transparent'),
                transform: `translateX(${translateOffset}px)`,
            }}
            draggable={true}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            onMouseEnter={() => !disableHover && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={space.name}
        >
            <IconComponent
                size={14}
                style={{ color: space.accentColor }}
            />
        </button>
    );
}
