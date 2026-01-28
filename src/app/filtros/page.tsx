'use client';

import { useState, useEffect } from 'react';
import {
    Filter,
    Search,
    ShoppingCart,
    Download,
    Printer,
    Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';

const DEMO_FILTROS = [
    { id: '1', maquinaria_codigo: 'EXC-01', maquinaria_descripcion: 'EXCAVADORA 320D (FAL10955)', filtro_separador_1: '438-5386', cantidad_sep_1: 1, filtro_combustible_1: '1R-0751', cantidad_comb_1: 2, filtro_aceite_motor: '1R-0739', cantidad_aceite: 1, filtro_aire_primario: '131-8822', cantidad_aire_prim: 1, filtro_aire_secundario: '131-8821', cantidad_aire_sec: 1 },
    { id: '2', maquinaria_codigo: 'MOT-01', maquinaria_descripcion: 'MOTONIVELADORA 135H (8WN00983)', filtro_separador_1: '326-1643', cantidad_sep_1: 1, filtro_combustible_1: '1R-0750', cantidad_comb_1: 1, filtro_aceite_motor: '1R-0716', cantidad_aceite: 2, filtro_aire_primario: '6I-2501', cantidad_aire_prim: 1, filtro_aire_secundario: '6I-2502', cantidad_aire_sec: 1 },
    { id: '3', maquinaria_codigo: 'CAR-01', maquinaria_descripcion: 'CARGADOR FRONTAL 950H (MTN00312)', filtro_separador_1: '326-1643', cantidad_sep_1: 1, filtro_combustible_1: '1R-0751', cantidad_comb_1: 2, filtro_aceite_motor: '1R-0739', cantidad_aceite: 1, filtro_aire_primario: '6I-2501', cantidad_aire_prim: 1, filtro_aire_secundario: '6I-2502', cantidad_aire_sec: 1 },
    { id: '4', maquinaria_codigo: 'VOL-01', maquinaria_descripcion: 'VOLQUETE ACTROS 3336K (WDB9302)', filtro_separador_1: 'A0004771302', cantidad_sep_1: 1, filtro_combustible_1: 'A0004700469', cantidad_comb_1: 1, filtro_aceite_motor: 'A4721800109', cantidad_aceite: 1, filtro_aire_primario: 'A0040942404', cantidad_aire_prim: 1, filtro_aire_secundario: 'A0040942504', cantidad_aire_sec: 1 },
    { id: '5', maquinaria_codigo: 'CIST-01', maquinaria_descripcion: 'CISTERNA DE AGUA FM (YV2RT20)', filtro_separador_1: '21380475', cantidad_sep_1: 1, filtro_combustible_1: '22480372', cantidad_comb_1: 1, filtro_aceite_motor: '21707134', cantidad_aceite: 1, filtro_aire_primario: '21386644', cantidad_aire_prim: 1, filtro_aire_secundario: '21834210', cantidad_aire_sec: 1 },
    { id: '6', maquinaria_codigo: 'RET-01', maquinaria_descripcion: 'RETROEXCAVADORA 420F (CAT42098)', filtro_separador_1: '361-9554', cantidad_sep_1: 1, filtro_combustible_1: '326-1644', cantidad_comb_1: 1, filtro_aceite_motor: '1R-0716', cantidad_aceite: 1, filtro_aire_primario: '131-8902', cantidad_aire_prim: 1, filtro_aire_secundario: '131-8903', cantidad_aire_sec: 1 },
];

export default function FiltrosPage() {
    const [filtros, setFiltros] = useState<any[]>(DEMO_FILTROS);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showListaCompras, setShowListaCompras] = useState(false);
    const [usingDemo, setUsingDemo] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const supabase = createClient();
            const { data, error } = await supabase.from('filtros').select('*');

            if (error || !data?.length) {
                setUsingDemo(true);
                setFiltros(DEMO_FILTROS);
            } else {
                setUsingDemo(false);
                setFiltros(data);
            }
        } catch {
            setUsingDemo(true);
            setFiltros(DEMO_FILTROS);
        } finally {
            setLoading(false);
        }
    }

    const filteredFiltros = filtros.filter(f =>
        f.maquinaria_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.maquinaria_descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    function toggleSelect(id: string) {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    }

    function selectAll() {
        if (selectedItems.length === filteredFiltros.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredFiltros.map(f => f.id));
        }
    }

    // Generar lista de compras consolidada
    function generarListaCompras() {
        const listaConsolidada: Record<string, { codigo: string; descripcion: string; cantidad: number }> = {};

        const selectedFiltros = filtros.filter(f => selectedItems.includes(f.id));

        selectedFiltros.forEach(f => {
            // Separador
            if (f.filtro_separador_1) {
                if (!listaConsolidada[f.filtro_separador_1]) {
                    listaConsolidada[f.filtro_separador_1] = { codigo: f.filtro_separador_1, descripcion: 'Filtro Separador', cantidad: 0 };
                }
                listaConsolidada[f.filtro_separador_1].cantidad += f.cantidad_sep_1 || 1;
            }
            // Combustible
            if (f.filtro_combustible_1) {
                if (!listaConsolidada[f.filtro_combustible_1]) {
                    listaConsolidada[f.filtro_combustible_1] = { codigo: f.filtro_combustible_1, descripcion: 'Filtro Combustible', cantidad: 0 };
                }
                listaConsolidada[f.filtro_combustible_1].cantidad += f.cantidad_comb_1 || 1;
            }
            // Aceite
            if (f.filtro_aceite_motor) {
                if (!listaConsolidada[f.filtro_aceite_motor]) {
                    listaConsolidada[f.filtro_aceite_motor] = { codigo: f.filtro_aceite_motor, descripcion: 'Filtro Aceite Motor', cantidad: 0 };
                }
                listaConsolidada[f.filtro_aceite_motor].cantidad += f.cantidad_aceite || 1;
            }
            // Aire Primario
            if (f.filtro_aire_primario) {
                if (!listaConsolidada[f.filtro_aire_primario]) {
                    listaConsolidada[f.filtro_aire_primario] = { codigo: f.filtro_aire_primario, descripcion: 'Filtro Aire Primario', cantidad: 0 };
                }
                listaConsolidada[f.filtro_aire_primario].cantidad += f.cantidad_aire_prim || 1;
            }
            // Aire Secundario
            if (f.filtro_aire_secundario) {
                if (!listaConsolidada[f.filtro_aire_secundario]) {
                    listaConsolidada[f.filtro_aire_secundario] = { codigo: f.filtro_aire_secundario, descripcion: 'Filtro Aire Secundario', cantidad: 0 };
                }
                listaConsolidada[f.filtro_aire_secundario].cantidad += f.cantidad_aire_sec || 1;
            }
        });

        return Object.values(listaConsolidada);
    }

    const listaCompras = generarListaCompras();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Filtros</h1>
                    <p className="text-gray-500 mt-1">Catálogo de filtros y generador de lista de compras</p>
                </div>
                <div className="flex gap-3">
                    {usingDemo && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium">
                            ⚠️ Modo Demo
                        </span>
                    )}
                    {selectedItems.length > 0 && (
                        <button
                            onClick={() => setShowListaCompras(true)}
                            className="btn btn-secondary"
                        >
                            <ShoppingCart size={20} />
                            Lista de Compras ({selectedItems.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Search & Select All */}
            <div className="card p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por código o descripción..."
                                className="input pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={selectAll}
                        className="btn btn-outline"
                    >
                        <Check size={18} />
                        {selectedItems.length === filteredFiltros.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </button>
                </div>
            </div>

            {/* Catálogo de Filtros */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredFiltros.map((f) => (
                    <div
                        key={f.id}
                        className={`card p-5 cursor-pointer transition-all ${selectedItems.includes(f.id)
                                ? 'ring-2 ring-blue-500 bg-blue-50'
                                : 'hover:shadow-lg'
                            }`}
                        onClick={() => toggleSelect(f.id)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedItems.includes(f.id) ? 'bg-blue-500 text-white' : 'bg-gray-100'
                                    }`}>
                                    {selectedItems.includes(f.id) ? <Check size={24} /> : <Filter size={20} className="text-gray-500" />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{f.maquinaria_codigo}</p>
                                    <p className="text-sm text-gray-500">{f.maquinaria_descripcion}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs mb-1">Separador</p>
                                <p className="font-mono font-medium">{f.filtro_separador_1 || '-'}</p>
                                <p className="text-xs text-gray-400">Cant: {f.cantidad_sep_1 || 0}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs mb-1">Combustible</p>
                                <p className="font-mono font-medium">{f.filtro_combustible_1 || '-'}</p>
                                <p className="text-xs text-gray-400">Cant: {f.cantidad_comb_1 || 0}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs mb-1">Aceite Motor</p>
                                <p className="font-mono font-medium">{f.filtro_aceite_motor || '-'}</p>
                                <p className="text-xs text-gray-400">Cant: {f.cantidad_aceite || 0}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs mb-1">Aire Primario</p>
                                <p className="font-mono font-medium">{f.filtro_aire_primario || '-'}</p>
                                <p className="text-xs text-gray-400">Cant: {f.cantidad_aire_prim || 0}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Lista de Compras */}
            {showListaCompras && (
                <div className="modal-overlay" onClick={() => setShowListaCompras(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <ShoppingCart size={24} />
                                    Lista de Compras Consolidada
                                </h2>
                                <button onClick={() => setShowListaCompras(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                                    ×
                                </button>
                            </div>
                            <p className="text-gray-500 mt-1">{selectedItems.length} equipos seleccionados</p>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Código Filtro</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Descripción</th>
                                        <th className="text-center py-3 px-2 font-semibold text-gray-700">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaCompras.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-2 font-mono font-medium">{item.codigo}</td>
                                            <td className="py-3 px-2 text-gray-600">{item.descripcion}</td>
                                            <td className="py-3 px-2 text-center">
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                                                    {item.cantidad}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-between items-center">
                            <p className="text-gray-500">
                                Total: <span className="font-bold text-gray-800">{listaCompras.length} tipos de filtros</span>
                            </p>
                            <div className="flex gap-3">
                                <button className="btn btn-outline">
                                    <Download size={18} />
                                    Exportar Excel
                                </button>
                                <button className="btn btn-primary">
                                    <Printer size={18} />
                                    Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
