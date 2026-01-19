import React, { useState } from 'react';
import { Plus, Settings } from 'lucide-react';
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
    onClick: () => void;
}

function SpaceIcon({ space, isActive, onClick }: SpaceIconProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            className={`${styles.spaceIcon} ${isActive ? styles.active : ''}`}
            style={{
                backgroundColor: `${space.accentColor}26`,
                borderColor: isActive || isHovered ? space.accentColor : 'transparent',
            }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={space.name}
        >
            <span style={{ fontSize: 14 }}>🚀</span>
        </button>
    );
}
