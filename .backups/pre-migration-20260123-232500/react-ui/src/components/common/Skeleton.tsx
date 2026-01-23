import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
}

export function Skeleton({
    width = '100%',
    height = '1rem',
    borderRadius = 'var(--radius-sm, 6px)',
    className
}: SkeletonProps): React.ReactElement {
    return (
        <div
            className={`${styles.skeleton} ${className || ''}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
            }}
        />
    );
}
