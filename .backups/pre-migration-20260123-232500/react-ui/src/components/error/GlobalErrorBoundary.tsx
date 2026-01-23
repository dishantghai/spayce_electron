import React from 'react';
import { DomainErrorBoundary } from './DomainErrorBoundary';

interface Props {
    children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: Props): React.ReactElement {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
        if (process.env.NODE_ENV === 'production') {
            console.error('Global error:', error, errorInfo);
        }
    };

    return (
        <DomainErrorBoundary onError={handleError}>
            {children}
        </DomainErrorBoundary>
    );
}
