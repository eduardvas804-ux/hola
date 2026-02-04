'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Maquinaria, Mantenimiento, SOAT, CITV, Filtro } from '@/lib/types';

// ============================================
// TYPES & CONFIGURATION
// ============================================

type TableName = 'maquinaria' | 'mantenimientos' | 'soat' | 'citv' | 'filtros' | 'combustible' | 'historial';

interface TableTypeMap {
    maquinaria: Maquinaria;
    mantenimientos: Mantenimiento;
    soat: SOAT;
    citv: CITV;
    filtros: Filtro;
    combustible: CombustibleRecord;
    historial: HistorialRecord;
}

interface CombustibleRecord {
    id: string;
    fecha: string;
    codigo_maquina: string;
    galones: number;
    horometro: number;
    operador: string;
    observaciones?: string;
}

interface HistorialRecord {
    id: string;
    tabla: string;
    accion: string;
    registro_id: string;
    datos_anteriores: Record<string, unknown> | null;
    datos_nuevos: Record<string, unknown> | null;
    usuario_email: string;
    created_at: string;
}

interface QueryState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    isStale: boolean;
    lastFetched: number | null;
}

interface UseSupabaseOptions {
    autoFetch?: boolean;
    cacheTime?: number; // ms
    staleTime?: number; // ms
    retryCount?: number;
    retryDelay?: number; // ms
    orderBy?: string;
    filter?: string;
}

// ============================================
// GLOBAL CACHE
// ============================================

interface CacheEntry<T> {
    data: T[];
    timestamp: number;
    query: string;
}

const globalCache = new Map<string, CacheEntry<unknown>>();
const subscribers = new Map<string, Set<() => void>>();

function getCacheKey(table: string, query: string): string {
    return `${table}:${query}`;
}

function notifySubscribers(table: string) {
    const tableSubscribers = subscribers.get(table);
    if (tableSubscribers) {
        tableSubscribers.forEach(callback => callback());
    }
}

export function invalidateTable(table: TableName) {
    // Remove all cache entries for this table
    for (const key of globalCache.keys()) {
        if (key.startsWith(`${table}:`)) {
            globalCache.delete(key);
        }
    }
    notifySubscribers(table);
}

export function invalidateAllCache() {
    globalCache.clear();
    subscribers.forEach((_, table) => notifySubscribers(table));
}

// ============================================
// MAIN HOOK
// ============================================

const DEFAULT_OPTIONS: Required<UseSupabaseOptions> = {
    autoFetch: true,
    cacheTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 30 * 1000, // 30 seconds
    retryCount: 3,
    retryDelay: 1000,
    orderBy: '',
    filter: '',
};

export default function useSupabase<T extends TableName>(
    table: T,
    options: UseSupabaseOptions = {}
): QueryState<TableTypeMap[T]> & {
    refetch: () => Promise<void>;
    mutate: (newData: TableTypeMap[T][]) => void;
} {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const query = `order=${opts.orderBy}${opts.filter ? `&${opts.filter}` : ''}`;
    const cacheKey = getCacheKey(table, query);

    const [state, setState] = useState<QueryState<TableTypeMap[T]>>(() => {
        const cached = globalCache.get(cacheKey) as CacheEntry<TableTypeMap[T]> | undefined;
        if (cached) {
            const isStale = Date.now() - cached.timestamp > opts.staleTime;
            return {
                data: cached.data,
                loading: isStale,
                error: null,
                isStale,
                lastFetched: cached.timestamp,
            };
        }
        return {
            data: [],
            loading: opts.autoFetch,
            error: null,
            isStale: true,
            lastFetched: null,
        };
    });

    const retryCountRef = useRef(0);
    const mountedRef = useRef(true);

    const fetchData = useCallback(async (forceRefresh = false) => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !apiKey) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Supabase no configurado',
            }));
            return;
        }

        // Check cache if not forcing refresh
        if (!forceRefresh) {
            const cached = globalCache.get(cacheKey) as CacheEntry<TableTypeMap[T]> | undefined;
            if (cached && Date.now() - cached.timestamp < opts.staleTime) {
                setState({
                    data: cached.data,
                    loading: false,
                    error: null,
                    isStale: false,
                    lastFetched: cached.timestamp,
                });
                return;
            }
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const url = `${supabaseUrl}/rest/v1/${table}?select=*${query ? `&${query}` : ''}`;
            const response = await fetch(url, {
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json() as TableTypeMap[T][];

            if (!mountedRef.current) return;

            // Update cache
            globalCache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                query,
            });

            retryCountRef.current = 0;

            setState({
                data,
                loading: false,
                error: null,
                isStale: false,
                lastFetched: Date.now(),
            });

        } catch (err) {
            if (!mountedRef.current) return;

            const error = err instanceof Error ? err.message : 'Error desconocido';

            // Retry logic
            if (retryCountRef.current < opts.retryCount) {
                retryCountRef.current++;
                setTimeout(() => {
                    if (mountedRef.current) {
                        fetchData(forceRefresh);
                    }
                }, opts.retryDelay * retryCountRef.current);
                return;
            }

            setState(prev => ({
                ...prev,
                loading: false,
                error,
            }));
        }
    }, [table, query, cacheKey, opts.staleTime, opts.retryCount, opts.retryDelay]);

    // Subscribe to table changes
    useEffect(() => {
        if (!subscribers.has(table)) {
            subscribers.set(table, new Set());
        }
        const tableSubscribers = subscribers.get(table)!;

        const callback = () => fetchData(true);
        tableSubscribers.add(callback);

        return () => {
            tableSubscribers.delete(callback);
        };
    }, [table, fetchData]);

    // Auto fetch on mount
    useEffect(() => {
        mountedRef.current = true;
        if (opts.autoFetch) {
            fetchData();
        }
        return () => {
            mountedRef.current = false;
        };
    }, [opts.autoFetch, fetchData]);

    // Optimistic update
    const mutate = useCallback((newData: TableTypeMap[T][]) => {
        globalCache.set(cacheKey, {
            data: newData,
            timestamp: Date.now(),
            query,
        });
        setState(prev => ({
            ...prev,
            data: newData,
        }));
    }, [cacheKey, query]);

    return {
        ...state,
        refetch: () => fetchData(true),
        mutate,
    };
}

// ============================================
// MUTATION HOOKS
// ============================================

interface MutationState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

export function useSupabaseMutation<T extends TableName>(table: T) {
    const [state, setState] = useState<MutationState>({
        loading: false,
        error: null,
        success: false,
    });

    const getHeaders = useCallback(() => {
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        return {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        };
    }, []);

    const getUrl = useCallback(() => {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}`;
    }, [table]);

    const insert = useCallback(async (data: Partial<TableTypeMap[T]>): Promise<TableTypeMap[T] | null> => {
        setState({ loading: true, error: null, success: false });
        try {
            const response = await fetch(getUrl(), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            const result = await response.json();
            invalidateTable(table);
            setState({ loading: false, error: null, success: true });
            return result[0] || null;
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Error al insertar';
            setState({ loading: false, error, success: false });
            return null;
        }
    }, [table, getUrl, getHeaders]);

    const update = useCallback(async (id: string, data: Partial<TableTypeMap[T]>): Promise<TableTypeMap[T] | null> => {
        setState({ loading: true, error: null, success: false });
        try {
            const response = await fetch(`${getUrl()}?id=eq.${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            const result = await response.json();
            invalidateTable(table);
            setState({ loading: false, error: null, success: true });
            return result[0] || null;
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Error al actualizar';
            setState({ loading: false, error, success: false });
            return null;
        }
    }, [table, getUrl, getHeaders]);

    const remove = useCallback(async (id: string): Promise<boolean> => {
        setState({ loading: true, error: null, success: false });
        try {
            const response = await fetch(`${getUrl()}?id=eq.${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            invalidateTable(table);
            setState({ loading: false, error: null, success: true });
            return true;
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Error al eliminar';
            setState({ loading: false, error, success: false });
            return false;
        }
    }, [table, getUrl, getHeaders]);

    const bulkInsert = useCallback(async (data: Partial<TableTypeMap[T]>[]): Promise<TableTypeMap[T][]> => {
        setState({ loading: true, error: null, success: false });
        try {
            const response = await fetch(getUrl(), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            const result = await response.json();
            invalidateTable(table);
            setState({ loading: false, error: null, success: true });
            return result;
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Error al insertar';
            setState({ loading: false, error, success: false });
            return [];
        }
    }, [table, getUrl, getHeaders]);

    return {
        ...state,
        insert,
        update,
        remove,
        bulkInsert,
        reset: () => setState({ loading: false, error: null, success: false }),
    };
}

// ============================================
// PRELOAD HELPER
// ============================================

export async function preloadTable<T extends TableName>(
    table: T,
    orderBy: string = ''
): Promise<TableTypeMap[T][]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !apiKey) return [];

    try {
        const query = orderBy ? `&order=${orderBy}` : '';
        const response = await fetch(
            `${supabaseUrl}/rest/v1/${table}?select=*${query}`,
            {
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        );

        if (!response.ok) return [];

        const data = await response.json();
        const cacheKey = getCacheKey(table, `order=${orderBy}`);
        globalCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            query: `order=${orderBy}`,
        });

        return data;
    } catch {
        return [];
    }
}
