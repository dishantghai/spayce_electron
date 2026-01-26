import React, { useEffect, memo } from 'react';
import { useDragDropUiStore } from '../../stores/dragDropUiStore';
import styles from './FlashItem.module.css';

interface FlashItemProps {
    itemId: string;
    accentColor: string;
    children: React.ReactNode;
}

const FLASH_DURATION = 700;

export const FlashItem = memo(function FlashItem({
    itemId,
    accentColor,
    children,
}: FlashItemProps): React.ReactElement {
    // Only subscribe to whether THIS item is flashing to minimize re-renders
    const isFlashing = useDragDropUiStore((state) => state.flashItemId === itemId);
    const setFlashItem = useDragDropUiStore((state) => state.setFlashItem);

    // Auto-clear flash after animation duration
    useEffect(() => {
        if (isFlashing) {
            const timer = setTimeout(() => {
                setFlashItem(null);
            }, FLASH_DURATION);

            return () => clearTimeout(timer);
        }
    }, [isFlashing, setFlashItem]);

    // Calculate flash color with 30% opacity
    const flashColor = isFlashing ? `${accentColor}4D` : undefined;

    return (
        <div
            data-testid="flash-item"
            data-flashing={isFlashing}
            className={isFlashing ? styles.flash : undefined}
            style={{
                '--flash-color': flashColor,
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
});

export default FlashItem;
