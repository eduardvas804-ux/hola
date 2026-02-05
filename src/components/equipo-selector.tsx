'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Info } from 'lucide-react';
import { EQUIPOS_MAESTRO } from '@/lib/equipos-data';
import { ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';

export interface EquipoOption {
    codigo: string;
    tipo?: string;
    modelo?: string;
    serie?: string;
    marca?: string;
}

interface EquipoSelectorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    // Si se proporcionan opciones, usa esas en lugar de EQUIPOS_MAESTRO
    options?: EquipoOption[];
    // Mostrar icono del tipo de maquinaria
    showIcon?: boolean;
    // Campo a usar como valor (codigo o serie)
    valueField?: 'codigo' | 'serie';
    // Callback para mostrar info del equipo
    onInfoClick?: (codigo: string) => void;
    // Deshabilitar selector
    disabled?: boolean;
    // Clase CSS adicional
    className?: string;
}

export default function EquipoSelector({
    value,
    onChange,
    label = 'Equipo',
    placeholder = 'Todos los equipos...',
    options,
    showIcon = true,
    valueField = 'codigo',
    onInfoClick,
    disabled = false,
    className = ''
}: EquipoSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Usar opciones proporcionadas o equipos maestro
    const items = options || EQUIPOS_MAESTRO;

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtrar items por búsqueda
    const filteredItems = items.filter(item => {
        const term = search.toLowerCase();
        return (
            item.codigo?.toLowerCase().includes(term) ||
            item.serie?.toLowerCase().includes(term) ||
            item.modelo?.toLowerCase().includes(term) ||
            item.tipo?.toLowerCase().includes(term)
        );
    });

    // Obtener el item seleccionado
    const selectedItem = items.find(item =>
        valueField === 'codigo' ? item.codigo === value : item.serie === value
    );

    // Formatear texto de display
    function getDisplayText(item: typeof items[0]) {
        if (item.serie && item.modelo) {
            return `${item.codigo} - ${item.modelo} (${item.serie})`;
        }
        return item.codigo;
    }

    function handleSelect(item: typeof items[0]) {
        const newValue = valueField === 'codigo' ? item.codigo : (item.serie || item.codigo);
        onChange(newValue);
        setIsOpen(false);
        setSearch('');
    }

    function handleClear() {
        onChange('');
        setSearch('');
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full input flex items-center justify-between text-left ${
                        disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    <span className={value ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}>
                        {selectedItem ? getDisplayText(selectedItem) : placeholder}
                    </span>
                    <div className="flex items-center gap-1">
                        {value && !disabled && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="Limpiar"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </div>
                </button>

                {isOpen && !disabled && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden">
                        {/* Campo de búsqueda */}
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar código, serie o modelo..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Lista de opciones */}
                        <div className="overflow-y-auto max-h-60">
                            {/* Opción "Todos" */}
                            <button
                                type="button"
                                onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                    !value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                Todos
                            </button>

                            {filteredItems.map((item) => {
                                const itemValue = valueField === 'codigo' ? item.codigo : (item.serie || item.codigo);
                                const isSelected = value === itemValue;

                                return (
                                    <div
                                        key={item.codigo + (item.serie || '')}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${
                                            isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(item)}
                                            className="flex-1 flex items-center gap-2 text-left"
                                        >
                                            {showIcon && item.tipo && (
                                                <span className="text-base">
                                                    {ICONOS_MAQUINARIA[item.tipo as TipoMaquinaria] || '🔧'}
                                                </span>
                                            )}
                                            <span className="font-medium">{item.codigo}</span>
                                            {item.modelo && (
                                                <span className="text-gray-500 dark:text-gray-400">{item.tipo} {item.modelo}</span>
                                            )}
                                            {item.serie && (
                                                <span className="text-gray-400 dark:text-gray-500">({item.serie})</span>
                                            )}
                                        </button>
                                        {onInfoClick && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); onInfoClick(item.codigo); }}
                                                className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                                                title="Ver información del equipo"
                                            >
                                                <Info size={16} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {filteredItems.length === 0 && (
                                <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No se encontraron equipos
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
