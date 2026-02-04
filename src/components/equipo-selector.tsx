'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { EQUIPOS_MAESTRO, Equipo, getCodigoPorSerie } from '@/lib/equipos-data';
import { ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';

interface EquipoSelectorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    // Si se proporcionan opciones, usa esas en lugar de EQUIPOS_MAESTRO
    options?: { codigo: string; tipo?: string; modelo?: string; serie?: string }[];
    // Mostrar icono del tipo de maquinaria
    showIcon?: boolean;
    // Campo a usar como valor (codigo o serie)
    valueField?: 'codigo' | 'serie';
}

export default function EquipoSelector({
    value,
    onChange,
    label = 'Equipo',
    placeholder = 'Todos los equipos...',
    options,
    showIcon = true,
    valueField = 'codigo'
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
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full input flex items-center justify-between text-left"
                >
                    <span className={value ? 'text-gray-800' : 'text-gray-400'}>
                        {selectedItem ? getDisplayText(selectedItem) : placeholder}
                    </span>
                    <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                        {/* Campo de búsqueda */}
                        <div className="p-2 border-b sticky top-0 bg-white">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar código, serie o modelo..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                                    !value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                }`}
                            >
                                Todos
                            </button>

                            {filteredItems.map((item) => {
                                const itemValue = valueField === 'codigo' ? item.codigo : (item.serie || item.codigo);
                                const isSelected = value === itemValue;

                                return (
                                    <button
                                        key={item.codigo + (item.serie || '')}
                                        type="button"
                                        onClick={() => handleSelect(item)}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                            isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                        }`}
                                    >
                                        {showIcon && item.tipo && (
                                            <span className="text-base">
                                                {ICONOS_MAQUINARIA[item.tipo as TipoMaquinaria] || ''}
                                            </span>
                                        )}
                                        <span className="font-medium">{item.codigo}</span>
                                        {item.modelo && (
                                            <span className="text-gray-500">{item.tipo} {item.modelo}</span>
                                        )}
                                        {item.serie && (
                                            <span className="text-gray-400">({item.serie})</span>
                                        )}
                                    </button>
                                );
                            })}

                            {filteredItems.length === 0 && (
                                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                    No se encontraron equipos
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Botón limpiar */}
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-8 top-8 p-1 text-gray-400 hover:text-gray-600"
                    title="Limpiar filtro"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
