import React from 'react';
import type { ErrorFallbackProps } from './DomainErrorBoundary';
import styles from './ErrorFallback.module.css';

export function ErrorFallback({
    error,
    errorId,
    onRetry,
    onReload
}: ErrorFallbackProps): React.ReactElement {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconContainer}>
                    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <h2 className={styles.title}>Something went wrong</h2>

                <p className={styles.message}>
                    An unexpected error occurred. You can try to recover or reload the application.
                </p>

                {isDevelopment && error && (
                    <div className={styles.errorDetails}>
                        <p className={styles.errorMessage}>{error.message}</p>
                        {errorId && (
                            <p className={styles.errorId}>Error ID: {errorId}</p>
                        )}
                    </div>
                )}

                <div className={styles.actions}>
                    <button className={styles.buttonSecondary} onClick={onRetry}>
                        Try Again
                    </button>
                    <button className={styles.buttonPrimary} onClick={onReload}>
                        Reload App
                    </button>
                </div>
            </div>
        </div>
    );
}
