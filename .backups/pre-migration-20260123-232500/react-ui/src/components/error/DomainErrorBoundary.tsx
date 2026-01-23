import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

export interface ErrorFallbackProps {
    error: Error | null;
    errorId: string | null;
    onRetry: () => void;
    onReload: () => void;
}

interface Props {
    children: ReactNode;
    fallback?: React.ComponentType<ErrorFallbackProps>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorId: string | null;
}

export class DomainErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorId: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            hasError: true,
            error,
            errorId
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error boundary caught:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorId: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback || ErrorFallback;

            return (
                <FallbackComponent
                    error={this.state.error}
                    errorId={this.state.errorId}
                    onRetry={this.handleRetry}
                    onReload={this.handleReload}
                />
            );
        }

        return this.props.children;
    }
}
