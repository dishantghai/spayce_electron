import React from 'react';
import styles from './DropIndicatorLine.module.css';

interface DropIndicatorLineProps {
    visible: boolean;
    accentColor: string;
    level?: number;
}

export function DropIndicatorLine({ visible, accentColor, level = 0 }: DropIndicatorLineProps): React.ReactElement {
    const indentPx = level * 24;

    return (
        <div
            data-testid="drop-indicator-line"
            className={`${styles.container} ${visible ? styles.visible : ''}`}
            style={{
                '--indicator-color': accentColor,
                '--indicator-indent': `${indentPx}px`,
            } as React.CSSProperties}
        >
            <div className={styles.content}>
                <div className={styles.terminal} />
                <div className={styles.line} />
            </div>
        </div>
    );
}

export default DropIndicatorLine;
