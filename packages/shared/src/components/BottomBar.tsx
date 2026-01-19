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
}

export function BottomBar({
    spaces,
    activeSpaceIndex,
    onSpaceSelect,
    onAddSpace,
    onSettingsClick,
    userName = 'User',
}: BottomBarProps): React.ReactElement {
    return (
        <div className={styles.bottomBar}>
            {/* Space icons row */}
            <div className={styles.spacesRow}>
                {spaces.map((space, index) => (
                    <SpaceIcon
                        key={space.id}
                        space={space}
                        isActive={index === activeSpaceIndex}
                        onClick={() => onSpaceSelect(index)}
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
            <button className={styles.profileButton} onClick={onSettingsClick}>
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
    isActive: boolean;
    isFocused?: boolean;
    onClick: () => void;
}

function SpaceIcon({ space, isActive, isFocused = false, onClick }: SpaceIconProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);

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

    return (
        <button
            className={`${styles.spaceIcon} ${isActive ? styles.active : ''}`}
            style={{
                backgroundColor: `${space.accentColor}26`,
                borderColor: isActive || isHovered ? space.accentColor : 'transparent',
            }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
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
