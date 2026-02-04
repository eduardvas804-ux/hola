'use client';

import { useState, useCallback, useEffect } from 'react';

interface UseDataFetchOptions<T> {
    initialData?: T;
    autoFetch?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
}

interface UseDataFetchReturn<T> {
    data: T | undefined;
    loading: boolean;
    error: Error | null;
    fetch: () => Promise<void>;
    refresh: () => Promise<void>;
    setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

export default function useDataFetch<T>(
    fetchFn: () => Promise<T>,
    options: UseDataFetchOptions<T> = {}
): UseDataFetchReturn<T> {
    const { initialData, autoFetch = true, onSuccess, onError } = options;

    const [data, setData] = useState<T | undefined>(initialData);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchFn();
            setData(result);
            onSuccess?.(result);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Error desconocido');
            setError(error);
            onError?.(error);
        } finally {
            setLoading(false);
        }
    }, [fetchFn, onSuccess, onError]);

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        loading,
        error,
        fetch: fetchData,
        refresh: fetchData,
        setData,
    };
}

// Hook para cargar datos con cache en memoria
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useDataFetchWithCache<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    options: UseDataFetchOptions<T> & { cacheDuration?: number } = {}
): UseDataFetchReturn<T> {
    const { cacheDuration = CACHE_DURATION, ...restOptions } = options;

    const [data, setData] = useState<T | undefined>(() => {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheDuration) {
            return cached.data;
        }
        return options.initialData;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        // Check cache first
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheDuration) {
            setData(cached.data);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await fetchFn();
            setData(result);
            cache.set(cacheKey, { data: result, timestamp: Date.now() });
            restOptions.onSuccess?.(result);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Error desconocido');
            setError(error);
            restOptions.onError?.(error);
        } finally {
            setLoading(false);
        }
    }, [cacheKey, cacheDuration, fetchFn]); // eslint-disable-line react-hooks/exhaustive-deps

    const refresh = useCallback(async () => {
        cache.delete(cacheKey);
        await fetchData();
    }, [cacheKey, fetchData]);

    useEffect(() => {
        if (restOptions.autoFetch !== false) {
            fetchData();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        loading,
        error,
        fetch: fetchData,
        refresh,
        setData,
    };
}

// Función para invalidar cache
export function invalidateCache(key?: string) {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
}
