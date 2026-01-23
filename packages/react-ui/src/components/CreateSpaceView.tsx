import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Search, Check, ChevronDown, ChevronUp } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { SpayceColors, SpaceThemes } from '../theme';
import type { Space } from '../types';
import styles from './CreateSpaceView.module.css';

// Icon categories for organized display
const ICON_CATEGORIES: Record<string, string[]> = {
    'Work': ['briefcase', 'building', 'laptop', 'calendar', 'clipboard'],
    'Personal': ['home', 'heart', 'user', 'users', 'smile'],
    'Development': ['code', 'terminal', 'database', 'cpu', 'git-branch'],
    'Creative': ['palette', 'image', 'music', 'video', 'camera'],
    'Organization': ['folder', 'layers', 'archive', 'bookmark', 'star'],
    'Learning': ['book', 'graduation-cap', 'lightbulb', 'brain'],
    'Finance': ['shopping-cart', 'dollar-sign', 'credit-card'],
    'Communication': ['mail', 'message-circle', 'phone'],
    'Travel': ['plane', 'map', 'compass'],
    'Health': ['activity', 'dumbbell'],
    'Misc': ['rocket', 'trophy', 'target', 'zap', 'flame'],
};

// All available icons
const ALL_ICONS = Object.values(ICON_CATEGORIES).flat();

// Icon name mappings for display
const ICON_NAMES: Record<string, string> = {
    'briefcase': 'Briefcase', 'building': 'Building', 'laptop': 'Laptop',
    'calendar': 'Calendar', 'clipboard': 'Clipboard', 'home': 'Home',
    'heart': 'Heart', 'user': 'User', 'users': 'Users', 'smile': 'Smile',
    'code': 'Code', 'terminal': 'Terminal', 'database': 'Database',
    'cpu': 'CPU', 'git-branch': 'Git Branch', 'palette': 'Palette',
    'image': 'Image', 'music': 'Music', 'video': 'Video', 'camera': 'Camera',
    'folder': 'Folder', 'layers': 'Layers', 'archive': 'Archive',
    'bookmark': 'Bookmark', 'star': 'Star', 'book': 'Book',
    'graduation-cap': 'Graduation Cap', 'lightbulb': 'Lightbulb', 'brain': 'Brain',
    'shopping-cart': 'Shopping Cart', 'dollar-sign': 'Dollar Sign',
    'credit-card': 'Credit Card', 'mail': 'Mail', 'message-circle': 'Message Circle',
    'phone': 'Phone', 'plane': 'Plane', 'map': 'Map', 'compass': 'Compass',
    'activity': 'Activity', 'dumbbell': 'Dumbbell', 'rocket': 'Rocket',
    'trophy': 'Trophy', 'target': 'Target', 'zap': 'Zap', 'flame': 'Flame',
};

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

export function getIconComponent(iconName: string): React.ComponentType<any> {
    return ICON_MAP[iconName] || LucideIcons.Layers;
}

export interface CreateSpaceViewProps {
    existingSpaces: Space[];
    existingSpace?: Space | null; // For edit mode
    onCancel: () => void;
    onSuccess: (spaceData: { name: string; iconName: string; accentColor: string }) => void;
}

export function CreateSpaceView({
    existingSpaces,
    existingSpace,
    onCancel,
    onSuccess,
}: CreateSpaceViewProps): React.ReactElement {
    const isEditing = !!existingSpace;

    const [spaceName, setSpaceName] = useState(existingSpace?.name || '');
    const [selectedIcon, setSelectedIcon] = useState<string>(existingSpace?.iconName || 'layers');
    const [selectedColor, setSelectedColor] = useState<string>(existingSpace?.accentColor || SpaceThemes[0]);
    const [isIconPickerExpanded, setIsIconPickerExpanded] = useState(false);
    const [iconSearchQuery, setIconSearchQuery] = useState('');
    const [suggestedIcons, setSuggestedIcons] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initialize with random color for new spaces
    useEffect(() => {
        if (!isEditing) {
            const recentColors = existingSpaces.slice(0, 10).map(s => s.accentColor);
            const availableColors = SpaceThemes.filter(color => !recentColors.includes(color));
            const randomColor = availableColors.length > 0
                ? availableColors[Math.floor(Math.random() * availableColors.length)]
                : SpaceThemes[Math.floor(Math.random() * SpaceThemes.length)];
            setSelectedColor(randomColor);
        }
        setTimeout(() => nameInputRef.current?.focus(), 100);
    }, [isEditing, existingSpaces]);

    // Generate suggested icons based on space name
    useEffect(() => {
        if (!spaceName.trim()) {
            setSuggestedIcons([]);
            return;
        }
        const name = spaceName.toLowerCase();
        const suggestions: string[] = [];
        if (name.includes('work') || name.includes('job') || name.includes('office')) {
            suggestions.push('briefcase', 'building', 'laptop');
        }
        if (name.includes('personal') || name.includes('home') || name.includes('family')) {
            suggestions.push('home', 'heart', 'users');
        }
        if (name.includes('project') || name.includes('dev') || name.includes('code')) {
            suggestions.push('code', 'terminal', 'folder');
        }
        if (name.includes('creative') || name.includes('design') || name.includes('art')) {
            suggestions.push('palette', 'image', 'camera');
        }
        if (name.includes('learn') || name.includes('study') || name.includes('education')) {
            suggestions.push('book', 'graduation-cap', 'lightbulb');
        }
        setSuggestedIcons([...new Set(suggestions)].slice(0, 6));
    }, [spaceName]);

    const getFilteredIcons = useCallback(() => {
        if (!iconSearchQuery.trim()) return ALL_ICONS;
        const query = iconSearchQuery.toLowerCase();
        return ALL_ICONS.filter(icon => {
            const name = ICON_NAMES[icon]?.toLowerCase() || icon.toLowerCase();
            return icon.includes(query) || name.includes(query);
        });
    }, [iconSearchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!spaceName.trim()) {
            setError('Space name is required');
            return;
        }
        // Check for duplicates (except when editing the same space)
        const isDuplicate = existingSpaces.some(
            space => space.name.toLowerCase() === spaceName.trim().toLowerCase() &&
                (!isEditing || space.id !== existingSpace?.id)
        );
        if (isDuplicate) {
            setError('A space with this name already exists');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await onSuccess({
                name: spaceName.trim(),
                iconName: selectedIcon,
                accentColor: selectedColor,
            });
        } catch (err) {
            setError('Failed to save space. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const IconComponent = getIconComponent(selectedIcon);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onCancel} type="button">
                    <ArrowLeft size={20} />
                </button>
                <h2 className={styles.title}>{isEditing ? 'Edit Space' : 'Create a Space'}</h2>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div ref={scrollContainerRef} className={styles.scrollContent}>
                    {/* Preview Icon */}
                    <div className={styles.previewContainer}>
                        <div
                            className={styles.previewIcon}
                            style={{ backgroundColor: `${selectedColor}26`, color: selectedColor }}
                        >
                            <IconComponent size={36} />
                        </div>
                    </div>

                    {/* Space Name */}
                    <div className={styles.section}>
                        <label className={styles.label}>Space Name</label>
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={spaceName}
                            onChange={(e) => setSpaceName(e.target.value)}
                            placeholder="e.g., Work, Personal, Projects..."
                            className={styles.input}
                            style={{ borderColor: error ? SpayceColors.error : undefined }}
                        />
                        {error && <div className={styles.error}>{error}</div>}
                    </div>

                    {/* Icon Picker */}
                    <div className={styles.section}>
                        <label className={styles.label}>Icon</label>
                        <div
                            className={styles.iconPicker}
                            style={{
                                borderColor: isIconPickerExpanded ? selectedColor : SpayceColors.borderSubtle,
                                borderWidth: isIconPickerExpanded ? 2 : 1,
                            }}
                        >
                            <button
                                type="button"
                                className={styles.iconPickerHeader}
                                onClick={() => setIsIconPickerExpanded(!isIconPickerExpanded)}
                            >
                                <div
                                    className={styles.selectedIconPreview}
                                    style={{ backgroundColor: `${selectedColor}26`, color: selectedColor }}
                                >
                                    <IconComponent size={20} />
                                </div>
                                <span className={styles.iconPickerText}>
                                    {ICON_NAMES[selectedIcon] || 'Choose an icon'}
                                </span>
                                {isIconPickerExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {isIconPickerExpanded && (
                                <div className={styles.iconPickerContent}>
                                    <div className={styles.iconSearch}>
                                        <Search size={16} className={styles.searchIcon} />
                                        <input
                                            type="text"
                                            placeholder="Search icons..."
                                            value={iconSearchQuery}
                                            onChange={(e) => setIconSearchQuery(e.target.value)}
                                            className={styles.searchInput}
                                        />
                                    </div>

                                    {suggestedIcons.length > 0 && !iconSearchQuery && (
                                        <div className={styles.suggestedSection}>
                                            <div className={styles.sectionTitle} style={{ color: selectedColor }}>
                                                Suggested
                                            </div>
                                            <div className={styles.iconGrid}>
                                                {suggestedIcons.map((iconName) => {
                                                    const SuggestedIcon = getIconComponent(iconName);
                                                    return (
                                                        <IconButton
                                                            key={iconName}
                                                            icon={SuggestedIcon}
                                                            isSelected={selectedIcon === iconName}
                                                            color={selectedColor}
                                                            onClick={() => {
                                                                setSelectedIcon(iconName);
                                                                setIsIconPickerExpanded(false);
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.allIconsSection}>
                                        {iconSearchQuery ? (
                                            <div className={styles.iconGrid}>
                                                {getFilteredIcons().length === 0 ? (
                                                    <div className={styles.noResults}>No icons found</div>
                                                ) : (
                                                    getFilteredIcons().map((iconName) => {
                                                        const FilteredIcon = getIconComponent(iconName);
                                                        return (
                                                            <IconButton
                                                                key={iconName}
                                                                icon={FilteredIcon}
                                                                isSelected={selectedIcon === iconName}
                                                                color={selectedColor}
                                                                onClick={() => {
                                                                    setSelectedIcon(iconName);
                                                                    setIsIconPickerExpanded(false);
                                                                    setIconSearchQuery('');
                                                                }}
                                                            />
                                                        );
                                                    })
                                                )}
                                            </div>
                                        ) : (
                                            Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                                                <div key={category} className={styles.categorySection}>
                                                    <div className={styles.categoryTitle}>{category}</div>
                                                    <div className={styles.iconGrid}>
                                                        {icons.map((iconName) => {
                                                            const CategoryIcon = getIconComponent(iconName);
                                                            return (
                                                                <IconButton
                                                                    key={iconName}
                                                                    icon={CategoryIcon}
                                                                    isSelected={selectedIcon === iconName}
                                                                    color={selectedColor}
                                                                    onClick={() => {
                                                                        setSelectedIcon(iconName);
                                                                        setIsIconPickerExpanded(false);
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className={styles.section}>
                        <label className={styles.label}>Color Theme</label>
                        <div className={styles.colorGrid}>
                            <div className={styles.colorRow}>
                                {SpaceThemes.slice(0, 12).map((color) => (
                                    <ColorButton
                                        key={color}
                                        color={color}
                                        isSelected={selectedColor === color}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                            </div>
                            <div className={styles.colorRow}>
                                {SpaceThemes.slice(12).map((color) => (
                                    <ColorButton
                                        key={color}
                                        color={color}
                                        isSelected={selectedColor === color}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Position Indicator (only for create) */}
                    {!isEditing && (
                        <div className={styles.positionIndicator}>
                            <div className={styles.positionText}>
                                Will be added as Space #{existingSpaces.length + 1}
                            </div>
                            <div className={styles.dots}>
                                {Array.from({ length: Math.min(existingSpaces.length + 1, 10) }, (_, i) => (
                                    <div
                                        key={i}
                                        className={styles.dot}
                                        style={{
                                            backgroundColor: i === existingSpaces.length
                                                ? selectedColor
                                                : `${SpayceColors.textMuted}4D`,
                                            width: i === existingSpaces.length ? 8 : 5,
                                            height: i === existingSpaces.length ? 8 : 5,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className={styles.actions}>
                    <button
                        type="submit"
                        disabled={!spaceName.trim() || isLoading}
                        className={styles.createButton}
                        style={{
                            backgroundColor: selectedColor,
                            opacity: (!spaceName.trim() || isLoading) ? 0.5 : 1,
                        }}
                    >
                        {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Space'}
                    </button>
                    <button type="button" onClick={onCancel} className={styles.cancelButton}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

// Helper components
interface IconButtonProps {
    icon: React.ComponentType<any>;
    isSelected: boolean;
    color: string;
    onClick: () => void;
}

function IconButton({ icon: Icon, isSelected, color, onClick }: IconButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <button
            type="button"
            className={styles.iconButton}
            style={{
                backgroundColor: isSelected ? `${color}33` : isHovered ? SpayceColors.surfaceDark : 'transparent',
                borderColor: isSelected ? color : 'transparent',
                color: isSelected ? color : isHovered ? SpayceColors.textPrimary : SpayceColors.textMuted,
            }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Icon size={20} />
        </button>
    );
}

interface ColorButtonProps {
    color: string;
    isSelected: boolean;
    onClick: () => void;
}

function ColorButton({ color, isSelected, onClick }: ColorButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <button
            type="button"
            className={styles.colorButton}
            style={{
                backgroundColor: color,
                borderColor: isSelected ? '#FFFFFF' : isHovered ? '#FFFFFF66' : 'transparent',
                borderWidth: isSelected ? 3 : 2,
                boxShadow: (isSelected || isHovered) ? `0 0 12px ${color}66` : 'none',
            }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isSelected && <Check size={16} color="white" />}
        </button>
    );
}
