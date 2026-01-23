import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { InvalidationProvider, useInvalidation } from '../../../src/hooks/common/InvalidationContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <InvalidationProvider>{children}</InvalidationProvider>
);

describe('Feature: 010 - InvalidationContext', () => {
    describe('AC1: InvalidationProvider wraps App component', () => {
        test('should provide context to children', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            expect(result.current).toHaveProperty('subscribe');
            expect(result.current).toHaveProperty('invalidate');
        });

        test('should throw error when useInvalidation is used outside provider', () => {
            expect(() => {
                renderHook(() => useInvalidation());
            }).toThrow('useInvalidation must be used within InvalidationProvider');
        });
    });

    describe('AC2: subscribe returns unsubscribe function', () => {
        test('should return a function when subscribing', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            const callback = vi.fn();
            const unsubscribe = result.current.subscribe('test-key', callback);
            expect(typeof unsubscribe).toBe('function');
        });

        test('should remove callback when unsubscribe is called', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            const callback = vi.fn();
            const unsubscribe = result.current.subscribe('test-key', callback);
            unsubscribe();
            act(() => {
                result.current.invalidate('test-key');
            });
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('AC3: invalidate calls all subscribers for key', () => {
        test('should call all callbacks subscribed to a key', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            result.current.subscribe('test-key', callback1);
            result.current.subscribe('test-key', callback2);
            act(() => {
                result.current.invalidate('test-key');
            });
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        test('should not call callbacks for different keys', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            const callback = vi.fn();
            result.current.subscribe('key-a', callback);
            act(() => {
                result.current.invalidate('key-b');
            });
            expect(callback).not.toHaveBeenCalled();
        });

        test('should handle errors in callbacks gracefully', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            const errorCallback = vi.fn(() => { throw new Error('Test error'); });
            const normalCallback = vi.fn();
            result.current.subscribe('test-key', errorCallback);
            result.current.subscribe('test-key', normalCallback);
            expect(() => {
                act(() => {
                    result.current.invalidate('test-key');
                });
            }).not.toThrow();
            expect(normalCallback).toHaveBeenCalled();
        });
    });

    describe('AC4: specific invalidation keys work', () => {
        test('should support space-items:{spaceId} pattern', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            const callback = vi.fn();
            result.current.subscribe('space-items:space-123', callback);
            act(() => {
                result.current.invalidate('space-items:space-123');
            });
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('AC5: global invalidation keys work', () => {
        test('should support spaces key', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            const callback = vi.fn();
            result.current.subscribe('spaces', callback);
            act(() => {
                result.current.invalidate('spaces');
            });
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('should support space-items key', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            const callback = vi.fn();
            result.current.subscribe('space-items', callback);
            act(() => {
                result.current.invalidate('space-items');
            });
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('should support pins key', () => {
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            const callback = vi.fn();
            result.current.subscribe('pins', callback);
            act(() => {
                result.current.invalidate('pins');
            });
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });
});
