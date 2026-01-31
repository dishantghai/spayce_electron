import { useEffect, useState } from 'react';
import styles from './BrowserLoadingBar.module.css';

export interface BrowserLoadingBarProps {
    /** Loading progress from 0 to 1 */
    progress: number;
    /** Height in pixels (default: 2) */
    height?: number;
}

/**
 * Animated loading progress bar
 * Spec 019: Single Tab Browser MVP
 *
 * Features:
 * - Smooth animation between progress values
 * - Indeterminate animation when progress is 0
 * - Fades out when progress reaches 1
 */
export function BrowserLoadingBar({ progress, height = 2 }: BrowserLoadingBarProps) {
    const [displayProgress, setDisplayProgress] = useState(progress);
    const [isVisible, setIsVisible] = useState(true);

    // Smooth progress animation
    useEffect(() => {
        // Always move forward, never backward (looks janky)
        if (progress > displayProgress) {
            setDisplayProgress(progress);
        } else if (progress === 0) {
            // Reset for new load
            setDisplayProgress(0);
        }
    }, [progress, displayProgress]);

    // Handle fade out when complete
    useEffect(() => {
        if (displayProgress >= 1) {
            const timeout = setTimeout(() => {
                setIsVisible(false);
            }, 200); // Brief delay before fade out

            return () => clearTimeout(timeout);
        } else {
            setIsVisible(true);
        }
    }, [displayProgress]);

    if (!isVisible) return null;

    const isIndeterminate = displayProgress === 0;

    return (
        <div
            className={styles.loadingBar}
            style={{ height }}
            role="progressbar"
            aria-valuenow={Math.round(displayProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Page loading progress"
        >
            <div
                className={`${styles.progress} ${isIndeterminate ? styles.indeterminate : ''}`}
                style={{
                    width: isIndeterminate ? '30%' : `${displayProgress * 100}%`,
                }}
            />
        </div>
    );
}
