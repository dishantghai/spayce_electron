import { useState, useEffect, useCallback } from 'react';

/**
 * B003: Custom hook for persisting state to localStorage
 * 
 * Works like useState but automatically persists to localStorage
 * and restores on component mount.
 * 
 * @param key - The localStorage key to use
 * @param defaultValue - Default value if no stored value exists
 * @returns Tuple of [value, setValue] like useState
 */
export function usePersistedState<T>(
    key: string,
    defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    // Initialize state from localStorage or use default
    const [state, setState] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored !== null) {
                return JSON.parse(stored) as T;
            }
        } catch (error) {
            // Invalid JSON or storage error - use default
            console.warn(`[usePersistedState] Failed to read ${key}:`, error);
        }
        return defaultValue;
    });

    // Persist to localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            // Quota exceeded or other storage error - state still works in memory
            console.warn(`[usePersistedState] Failed to persist ${key}:`, error);
        }
    }, [key, state]);

    // Wrapper for setState that supports functional updates
    const setPersistedState = useCallback((value: T | ((prev: T) => T)) => {
        setState(prev => {
            const newValue = typeof value === 'function'
                ? (value as (prev: T) => T)(prev)
                : value;
            return newValue;
        });
    }, []);

    return [state, setPersistedState];
}

/**
 * Serialize a Map<string, Set<string>> to JSON string for localStorage
 * Used for sidebarExpandedIdsMap persistence
 */
export function serializeExpandedIdsMap(map: Map<string, Set<string>>): string {
    const obj: Record<string, string[]> = {};
    map.forEach((set, key) => {
        obj[key] = Array.from(set);
    });
    return JSON.stringify(obj);
}

/**
 * Deserialize JSON string back to Map<string, Set<string>>
 * Returns empty Map on invalid input
 */
export function deserializeExpandedIdsMap(json: string | null | undefined): Map<string, Set<string>> {
    if (!json) {
        return new Map();
    }

    try {
        const obj = JSON.parse(json);
        const map = new Map<string, Set<string>>();

        if (typeof obj !== 'object' || obj === null) {
            return new Map();
        }

        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                map.set(key, new Set(value as string[]));
            } else {
                // Invalid entry - skip and return empty to be safe
                return new Map();
            }
        }

        return map;
    } catch (error) {
        console.warn('[deserializeExpandedIdsMap] Failed to parse:', error);
        return new Map();
    }
}

/**
 * Custom hook specifically for Map<string, Set<string>> persistence
 * Used for sidebarExpandedIdsMap
 */
export function usePersistedExpandedIdsMap(
    key: string,
    defaultValue: Map<string, Set<string>> = new Map()
): [Map<string, Set<string>>, (value: Map<string, Set<string>> | ((prev: Map<string, Set<string>>) => Map<string, Set<string>>)) => void] {
    // Initialize from localStorage
    const [state, setState] = useState<Map<string, Set<string>>>(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored !== null) {
                return deserializeExpandedIdsMap(stored);
            }
        } catch (error) {
            console.warn(`[usePersistedExpandedIdsMap] Failed to read ${key}:`, error);
        }
        return defaultValue;
    });

    // Persist to localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem(key, serializeExpandedIdsMap(state));
        } catch (error) {
            console.warn(`[usePersistedExpandedIdsMap] Failed to persist ${key}:`, error);
        }
    }, [key, state]);

    // Wrapper for setState
    const setPersistedState = useCallback((value: Map<string, Set<string>> | ((prev: Map<string, Set<string>>) => Map<string, Set<string>>)) => {
        setState(prev => {
            const newValue = typeof value === 'function' ? value(prev) : value;
            return newValue;
        });
    }, []);

    return [state, setPersistedState];
}

// Storage key constants for consistency
export const STORAGE_KEYS = {
    SIDEBAR_MODE: 'spayce:ui:sidebarMode',
    SIDEBAR_VISIBLE: 'spayce:ui:sidebarVisible',
    ACTIVE_TAB: 'spayce:ui:activeTab',
    SIDEBAR_ACTIVE_SPACE_INDEX: 'spayce:ui:sidebarActiveSpaceIndex',
    SPACES_SCREEN_ACTIVE_SPACE_INDEX: 'spayce:ui:spacesScreenActiveSpaceIndex',
    SIDEBAR_EXPANDED_IDS: 'spayce:ui:sidebarExpandedIds',
    FOCUS_CONTEXT: 'spayce:ui:focusContext',
} as const;
