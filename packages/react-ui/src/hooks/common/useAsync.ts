import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

export interface UseAsyncResult<T> extends AsyncState<T> {
    refetch: () => Promise<void>;
}

export function useAsync<T>(
    asyncFn: () => Promise<T>,
    dependencies: unknown[] = []
): UseAsyncResult<T> {
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        loading: true,
        error: null
    });

    const mountedRef = useRef(true);

    const execute = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const result = await asyncFn();
            if (mountedRef.current) {
                setState({ data: result, loading: false, error: null });
            }
        } catch (error) {
            if (mountedRef.current) {
                setState({
                    data: null,
                    loading: false,
                    error: error instanceof Error ? error : new Error('Unknown error')
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    useEffect(() => {
        mountedRef.current = true;
        execute();
        return () => { mountedRef.current = false; };
    }, [execute]);

    return {
        ...state,
        refetch: execute
    };
}
