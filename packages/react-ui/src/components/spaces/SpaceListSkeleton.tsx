import React from 'react';
import { Skeleton } from '../common/Skeleton';
import styles from './SpaceListSkeleton.module.css';

export interface SpaceListSkeletonProps {
    count?: number;
}

export function SpaceListSkeleton({ count = 3 }: SpaceListSkeletonProps): React.ReactElement {
    return (
        <div className={styles.container}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={styles.spaceItem}>
                    <Skeleton width={20} height={20} borderRadius="var(--radius-sm, 6px)" />
                    <Skeleton width="70%" height={16} />
                </div>
            ))}
        </div>
    );
}
