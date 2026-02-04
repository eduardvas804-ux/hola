'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Truck, Wrench, FileText, Fuel, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useDebounce from '@/hooks/useDebounce';
import { ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';

interface SearchResult {
    id: string;
    type: 'maquinaria' | 'mantenimiento' | 'soat' | 'citv' | 'combustible';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    href: string;
    badge?: string;
    badgeColor?: string;
}

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const debouncedQuery = useDebounce(query, 300);

    // Keyboard shortcut: Ctrl+K or Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search logic
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            return;
        }

        const search = async () => {
            setLoading(true);
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !apiKey) {
                setLoading(false);
                return;
            }

            const headers = {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
            };

            try {
                const term = debouncedQuery.toLowerCase();
                const searchResults: SearchResult[] = [];

                // Search maquinaria
                const maqResponse = await fetch(
                    `${supabaseUrl}/rest/v1/maquinaria?select=*`,
                    { headers }
                );
                if (maqResponse.ok) {
                    const maquinaria = await maqResponse.json();
                    const filtered = maquinaria.filter((m: any) =>
                        m.codigo?.toLowerCase().includes(term) ||
                        m.tipo?.toLowerCase().includes(term) ||
                        m.modelo?.toLowerCase().includes(term) ||
                        m.marca?.toLowerCase().includes(term) ||
                        m.placa?.toLowerCase().includes(term) ||
                        m.serie?.toLowerCase().includes(term)
                    ).slice(0, 5);

                    filtered.forEach((m: any) => {
                        searchResults.push({
                            id: m.id,
                            type: 'maquinaria',
                            title: m.codigo,
                            subtitle: `${m.tipo} - ${m.marca} ${m.modelo}`,
                            icon: <span className="text-xl">{ICONOS_MAQUINARIA[m.tipo as TipoMaquinaria] || '🚜'}</span>,
                            href: `/maquinaria?codigo=${m.codigo}`,
                            badge: m.estado,
                            badgeColor: m.estado === 'OPERATIVO' ? 'bg-green-100 text-green-800' :
                                m.estado === 'EN MANTENIMIENTO' ? 'bg-amber-100 text-amber-800' :
                                    m.estado === 'INOPERATIVO' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800',
                        });
                    });
                }

                // Search mantenimientos
                const mttoResponse = await fetch(
                    `${supabaseUrl}/rest/v1/mantenimientos?select=*`,
                    { headers }
                );
                if (mttoResponse.ok) {
                    const mantenimientos = await mttoResponse.json();
                    const filtered = mantenimientos.filter((m: any) =>
                        m.codigo_maquina?.toLowerCase().includes(term) ||
                        m.tipo_mantenimiento?.toLowerCase().includes(term)
                    ).slice(0, 3);

                    filtered.forEach((m: any) => {
                        searchResults.push({
                            id: m.id,
                            type: 'mantenimiento',
                            title: m.codigo_maquina,
                            subtitle: `${m.tipo_mantenimiento} - Próximo: ${m.mantenimiento_proximo}h`,
                            icon: <Wrench size={20} className="text-amber-500" />,
                            href: `/mantenimientos?codigo=${m.codigo_maquina}`,
                            badge: m.estado_alerta,
                            badgeColor: m.estado_alerta === 'VENCIDO' ? 'bg-red-100 text-red-800' :
                                m.estado_alerta === 'URGENTE' ? 'bg-orange-100 text-orange-800' :
                                    m.estado_alerta === 'PROXIMO' ? 'bg-amber-100 text-amber-800' :
                                        'bg-green-100 text-green-800',
                        });
                    });
                }

                // Search SOAT
                const soatResponse = await fetch(
                    `${supabaseUrl}/rest/v1/soat?select=*`,
                    { headers }
                );
                if (soatResponse.ok) {
                    const soat = await soatResponse.json();
                    const filtered = soat.filter((s: any) =>
                        s.codigo?.toLowerCase().includes(term) ||
                        s.placa_serie?.toLowerCase().includes(term)
                    ).slice(0, 3);

                    filtered.forEach((s: any) => {
                        searchResults.push({
                            id: s.id,
                            type: 'soat',
                            title: `SOAT - ${s.codigo}`,
                            subtitle: `Vence: ${s.fecha_vencimiento} (${s.dias_restantes} días)`,
                            icon: <FileText size={20} className="text-blue-500" />,
                            href: `/soat?codigo=${s.codigo}`,
                            badge: s.dias_restantes <= 0 ? 'VENCIDO' :
                                s.dias_restantes <= 15 ? 'POR VENCER' : 'VIGENTE',
                            badgeColor: s.dias_restantes <= 0 ? 'bg-red-100 text-red-800' :
                                s.dias_restantes <= 15 ? 'bg-amber-100 text-amber-800' :
                                    'bg-green-100 text-green-800',
                        });
                    });
                }

                setResults(searchResults);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Error en búsqueda:', error);
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    // Navigation with keyboard
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            router.push(results[selectedIndex].href);
            setIsOpen(false);
            setQuery('');
        }
    }, [results, selectedIndex, router]);

    const handleResultClick = (href: string) => {
        router.push(href);
        setIsOpen(false);
        setQuery('');
    };

    const getTypeLabel = (type: SearchResult['type']) => {
        const labels = {
            maquinaria: 'Maquinaria',
            mantenimiento: 'Mantenimiento',
            soat: 'SOAT',
            citv: 'CITV',
            combustible: 'Combustible',
        };
        return labels[type];
    };

    return (
        <>
            {/* Search Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
            >
                <Search size={18} />
                <span className="hidden sm:inline text-sm">Buscar...</span>
                <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Search Modal */}
                    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <Search size={20} className="text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Buscar equipos, mantenimientos, documentos..."
                                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-lg"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                >
                                    <X size={18} className="text-gray-400" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-2 py-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 rounded"
                            >
                                ESC
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : results.length > 0 ? (
                                <div className="py-2">
                                    {results.map((result, index) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => handleResultClick(result.href)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === selectedIndex
                                                    ? 'bg-blue-50 dark:bg-blue-900/30'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                {result.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {result.title}
                                                    </p>
                                                    {result.badge && (
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${result.badgeColor}`}>
                                                            {result.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {result.subtitle}
                                                </p>
                                            </div>
                                            <span className="flex-shrink-0 text-xs text-gray-400 uppercase">
                                                {getTypeLabel(result.type)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : query ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <Search size={48} className="mb-3 opacity-50" />
                                    <p>No se encontraron resultados para "{query}"</p>
                                </div>
                            ) : (
                                <div className="py-6 px-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        Búsqueda rápida
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setQuery('excavadora')}
                                            className="flex items-center gap-2 p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Truck size={18} className="text-blue-500" />
                                            <span className="text-sm">Excavadoras</span>
                                        </button>
                                        <button
                                            onClick={() => setQuery('volquete')}
                                            className="flex items-center gap-2 p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Truck size={18} className="text-amber-500" />
                                            <span className="text-sm">Volquetes</span>
                                        </button>
                                        <button
                                            onClick={() => setQuery('vencido')}
                                            className="flex items-center gap-2 p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Wrench size={18} className="text-red-500" />
                                            <span className="text-sm">Mtto. Vencidos</span>
                                        </button>
                                        <button
                                            onClick={() => setQuery('soat')}
                                            className="flex items-center gap-2 p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <FileText size={18} className="text-green-500" />
                                            <span className="text-sm">Documentos SOAT</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd>
                                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd>
                                    navegar
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
                                    seleccionar
                                </span>
                            </div>
                            <span>{results.length} resultados</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
