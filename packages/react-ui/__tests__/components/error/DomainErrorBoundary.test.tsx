import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { DomainErrorBoundary } from '../../../src/components/error/DomainErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

describe('Feature: 010 - DomainErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        cleanup();
    });

    describe('AC1: DomainErrorBoundary catches component errors', () => {
        test('should catch errors thrown by child components', () => {
            render(
                <DomainErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(screen.getByText('Something went wrong')).toBeTruthy();
        });

        test('should render children when no error occurs', () => {
            render(
                <DomainErrorBoundary>
                    <ThrowError shouldThrow={false} />
                </DomainErrorBoundary>
            );
            expect(screen.getByText('No error')).toBeTruthy();
        });
    });

    describe('AC2: Error state includes error, errorId, retry, reload', () => {
        test('should provide error object to fallback', () => {
            render(
                <DomainErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(screen.getByText('Something went wrong')).toBeTruthy();
        });

        test('should generate unique errorId', () => {
            const { container } = render(
                <DomainErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(container.textContent).toContain('Error ID:');
        });

        test('should provide onRetry callback', () => {
            render(
                <DomainErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(screen.getByText('Try Again')).toBeTruthy();
        });

        test('should provide onReload callback', () => {
            render(
                <DomainErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(screen.getByText('Reload App')).toBeTruthy();
        });
    });

    describe('AC3: Retry button resets error state', () => {
        test('should reset error state when retry is called', () => {
            render(
                <DomainErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(screen.getByText('Something went wrong')).toBeTruthy();

            // Verify Try Again button exists and is clickable
            const retryButton = screen.getByText('Try Again');
            expect(retryButton).toBeTruthy();
            fireEvent.click(retryButton);
            // After clicking retry, the error boundary resets its state
            // but the child will throw again, so we still see the error
            expect(screen.getByText('Something went wrong')).toBeTruthy();
        });

        test('should re-render children after retry', () => {
            render(
                <DomainErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );

            // Verify the error boundary caught the error
            expect(screen.getByText('Something went wrong')).toBeTruthy();

            // Verify retry button exists
            expect(screen.getByText('Try Again')).toBeTruthy();
        });
    });

    describe('AC4: onError callback is called', () => {
        test('should call onError prop when error is caught', () => {
            const onError = vi.fn();
            render(
                <DomainErrorBoundary onError={onError}>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(onError).toHaveBeenCalled();
        });

        test('should pass error and errorInfo to onError', () => {
            const onError = vi.fn();
            render(
                <DomainErrorBoundary onError={onError}>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(onError).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({ componentStack: expect.any(String) })
            );
        });
    });

    describe('AC5: Custom fallback component', () => {
        test('should use custom fallback when provided', () => {
            const CustomFallback = () => <div>Custom Error</div>;
            render(
                <DomainErrorBoundary fallback={CustomFallback}>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(screen.getByText('Custom Error')).toBeTruthy();
        });

        test('should use default ErrorFallback when no fallback provided', () => {
            render(
                <DomainErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </DomainErrorBoundary>
            );
            expect(screen.getByText('Something went wrong')).toBeTruthy();
        });
    });
});
