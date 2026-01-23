import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useEventBusInvalidation } from './useEventBusInvalidation';

type InvalidationCallback = () => void | Promise<void>;

export interface InvalidationContextValue {
    subscribe: (key: string, callback: InvalidationCallback) => () => void;
    invalidate: (key: string) => void;
}

const InvalidationContext = createContext<InvalidationContextValue | null>(null);

export interface InvalidationProviderProps {
    children: React.ReactNode;
}

export function InvalidationProvider({ children }: InvalidationProviderProps): React.ReactElement {
    const subscribersRef = useRef<Map<string, Set<InvalidationCallback>>>(new Map());

    const subscribe = useCallback((key: string, callback: InvalidationCallback) => {
        if (!subscribersRef.current.has(key)) {
            subscribersRef.current.set(key, new Set());
        }
        subscribersRef.current.get(key)!.add(callback);

        return () => {
            subscribersRef.current.get(key)?.delete(callback);
        };
    }, []);

    const invalidate = useCallback((key: string) => {
        const callbacks = subscribersRef.current.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error(`Invalidation callback error for key '${key}':`, error);
                }
            });
        }
    }, []);

    // Connect to event bus for automatic invalidation
    useEventBusInvalidation(invalidate);

    return (
        <InvalidationContext.Provider value={{ subscribe, invalidate }}>
            {children}
        </InvalidationContext.Provider>
    );
}

export function useInvalidation(): InvalidationContextValue {
    const context = useContext(InvalidationContext);
    if (!context) {
        throw new Error('useInvalidation must be used within InvalidationProvider');
    }
    return context;
}
