import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState, serializeExpandedIdsMap, deserializeExpandedIdsMap } from '../../src/hooks/usePersistedState';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('B003: usePersistedState Hook', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    describe('AC1: Basic state persistence', () => {
        test('should return default value when localStorage is empty', () => {
            const { result } = renderHook(() =>
                usePersistedState('test-key', 'default-value')
            );
            expect(result.current[0]).toBe('default-value');
        });

        test('should persist value to localStorage on state change', () => {
            const { result } = renderHook(() =>
                usePersistedState('test-key', 'initial')
            );

            act(() => {
                result.current[1]('updated');
            });

            expect(result.current[0]).toBe('updated');
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify('updated')
            );
        });

        test('should restore value from localStorage on mount', () => {
            localStorageMock.setItem('test-key', JSON.stringify('stored-value'));

            const { result } = renderHook(() =>
                usePersistedState('test-key', 'default')
            );

            expect(result.current[0]).toBe('stored-value');
        });

        test('should handle number values correctly', () => {
            const { result } = renderHook(() =>
                usePersistedState('number-key', 0)
            );

            act(() => {
                result.current[1](42);
            });

            expect(result.current[0]).toBe(42);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'number-key',
                JSON.stringify(42)
            );
        });

        test('should handle boolean values correctly', () => {
            const { result } = renderHook(() =>
                usePersistedState('bool-key', true)
            );

            act(() => {
                result.current[1](false);
            });

            expect(result.current[0]).toBe(false);
        });

        test('should handle object values correctly', () => {
            const defaultObj = { a: 1, b: 'test' };
            const { result } = renderHook(() =>
                usePersistedState('obj-key', defaultObj)
            );

            const newObj = { a: 2, b: 'updated' };
            act(() => {
                result.current[1](newObj);
            });

            expect(result.current[0]).toEqual(newObj);
        });
    });

    describe('AC2: Error handling and graceful fallback', () => {
        test('should fallback to default when localStorage has invalid JSON', () => {
            localStorageMock.setItem('bad-key', 'not-valid-json{{{');

            const { result } = renderHook(() =>
                usePersistedState('bad-key', 'fallback')
            );

            expect(result.current[0]).toBe('fallback');
        });

        test('should fallback to default when localStorage throws on getItem', () => {
            const originalGetItem = localStorageMock.getItem;
            localStorageMock.getItem = vi.fn(() => {
                throw new Error('Storage error');
            });

            const { result } = renderHook(() =>
                usePersistedState('error-key', 'fallback')
            );

            expect(result.current[0]).toBe('fallback');

            localStorageMock.getItem = originalGetItem;
        });

        test('should not throw when localStorage.setItem fails', () => {
            const originalSetItem = localStorageMock.setItem;
            localStorageMock.setItem = vi.fn(() => {
                throw new Error('Quota exceeded');
            });

            const { result } = renderHook(() =>
                usePersistedState('quota-key', 'initial')
            );

            // Should not throw
            expect(() => {
                act(() => {
                    result.current[1]('new-value');
                });
            }).not.toThrow();

            // State should still update in memory
            expect(result.current[0]).toBe('new-value');

            localStorageMock.setItem = originalSetItem;
        });
    });

    describe('AC3: Functional updates', () => {
        test('should support functional updates like useState', () => {
            const { result } = renderHook(() =>
                usePersistedState('counter', 0)
            );

            act(() => {
                result.current[1](prev => prev + 1);
            });

            expect(result.current[0]).toBe(1);

            act(() => {
                result.current[1](prev => prev + 10);
            });

            expect(result.current[0]).toBe(11);
        });
    });

    describe('AC4: Key prefix support', () => {
        test('should use spayce:ui: prefix by default for UI state', () => {
            const { result } = renderHook(() =>
                usePersistedState('spayce:ui:sidebarMode', 'fixed')
            );

            act(() => {
                result.current[1]('floating');
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'spayce:ui:sidebarMode',
                JSON.stringify('floating')
            );
        });
    });
});

describe('B003: Map<string, Set<string>> Serialization', () => {
    describe('serializeExpandedIdsMap', () => {
        test('should serialize empty Map to empty object', () => {
            const map = new Map<string, Set<string>>();
            const result = serializeExpandedIdsMap(map);
            expect(result).toBe('{}');
        });

        test('should serialize Map with entries correctly', () => {
            const map = new Map<string, Set<string>>();
            map.set('space1', new Set(['id1', 'id2']));
            map.set('space2', new Set(['id3']));

            const result = serializeExpandedIdsMap(map);
            const parsed = JSON.parse(result);

            expect(parsed.space1).toEqual(['id1', 'id2']);
            expect(parsed.space2).toEqual(['id3']);
        });

        test('should handle empty Sets', () => {
            const map = new Map<string, Set<string>>();
            map.set('space1', new Set());

            const result = serializeExpandedIdsMap(map);
            const parsed = JSON.parse(result);

            expect(parsed.space1).toEqual([]);
        });
    });

    describe('deserializeExpandedIdsMap', () => {
        test('should deserialize empty object to empty Map', () => {
            const result = deserializeExpandedIdsMap('{}');
            expect(result.size).toBe(0);
        });

        test('should deserialize object with arrays to Map with Sets', () => {
            const json = JSON.stringify({
                space1: ['id1', 'id2'],
                space2: ['id3'],
            });

            const result = deserializeExpandedIdsMap(json);

            expect(result.get('space1')).toEqual(new Set(['id1', 'id2']));
            expect(result.get('space2')).toEqual(new Set(['id3']));
        });

        test('should return empty Map for invalid JSON', () => {
            const result = deserializeExpandedIdsMap('invalid{json');
            expect(result.size).toBe(0);
        });

        test('should return empty Map for null/undefined', () => {
            const result1 = deserializeExpandedIdsMap(null as any);
            const result2 = deserializeExpandedIdsMap(undefined as any);

            expect(result1.size).toBe(0);
            expect(result2.size).toBe(0);
        });

        test('should handle corrupted data gracefully', () => {
            // Object with non-array values
            const json = JSON.stringify({
                space1: 'not-an-array',
                space2: 123,
            });

            const result = deserializeExpandedIdsMap(json);
            // Should skip invalid entries or return empty
            expect(result.size).toBe(0);
        });
    });

    describe('Round-trip serialization', () => {
        test('should preserve data through serialize/deserialize cycle', () => {
            const original = new Map<string, Set<string>>();
            original.set('space-abc', new Set(['folder-1', 'folder-2', 'folder-3']));
            original.set('space-xyz', new Set(['item-a']));

            const serialized = serializeExpandedIdsMap(original);
            const deserialized = deserializeExpandedIdsMap(serialized);

            expect(deserialized.size).toBe(2);
            expect(deserialized.get('space-abc')).toEqual(new Set(['folder-1', 'folder-2', 'folder-3']));
            expect(deserialized.get('space-xyz')).toEqual(new Set(['item-a']));
        });
    });
});
