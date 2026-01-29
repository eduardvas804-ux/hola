'use client';

import { useState, useEffect } from 'react';
import { fetchTable } from '@/lib/api';
import { ICONOS_MAQUINARIA } from '@/lib/types';
import { Search, Filter, Download, ShoppingCart, Check, ExternalLink, Printer } from 'lucide-react';
import Link from 'next/link';
import { exportToExcel, formatFiltrosForExport } from '@/lib/export';

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
            const data = await fetchTable<any>('filtros');
            if (data?.length > 0) {
                setUsingDemo(false);
                setFiltros(data);
            } else {
                setUsingDemo(true);
                setFiltros(DEMO_FILTROS);
            }
        } catch {
            setUsingDemo(true);
            setFiltros(DEMO_FILTROS);
        } finally {
            setLoading(false);
        }
    }

    const filteredFiltros = filtros.filter(f => {
        const search = searchTerm.toLowerCase();
        return (
            f.maquinaria_codigo.toLowerCase().includes(search) ||
            f.maquinaria_descripcion.toLowerCase().includes(search) ||
            (f.filtro_separador_1 || '').toLowerCase().includes(search) ||
            (f.filtro_separador_2 || '').toLowerCase().includes(search) ||
            (f.filtro_combustible_1 || '').toLowerCase().includes(search) ||
            (f.filtro_combustible_2 || '').toLowerCase().includes(search) ||
            (f.filtro_aceite_motor || '').toLowerCase().includes(search) ||
            (f.filtro_aire_primario || '').toLowerCase().includes(search) ||
            (f.filtro_aire_secundario || '').toLowerCase().includes(search)
        );
    });

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

    function handleExport() {
        const dataToExport = formatFiltrosForExport(filtros);
        exportToExcel(dataToExport, 'Filtros_' + new Date().toISOString().split('T')[0], 'Filtros');
    }

    function handleExportListaCompras() {
        const lista = generarListaCompras();
        exportToExcel(lista.map(item => ({
            'CÓDIGO FILTRO': item.codigo,
            'DESCRIPCIÓN': item.descripcion,
            'CANTIDAD': item.cantidad
        })), 'Lista_Compras_' + new Date().toISOString().split('T')[0], 'Lista_Compras');
    }

    function handlePrint() {
        const lista = generarListaCompras();
        const selectedFiltros = filtros.filter(f => selectedItems.includes(f.id));

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lista de Compras - Filtros</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1E3A5F; padding-bottom: 20px; }
                    .header h1 { color: #1E3A5F; font-size: 24px; }
                    .header p { color: #666; margin-top: 5px; }
                    .date { text-align: right; color: #666; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: #1E3A5F; color: white; padding: 12px 8px; text-align: left; }
                    td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
                    tr:hover { background: #f5f5f5; }
                    .cantidad { text-align: center; font-weight: bold; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
                    .footer p { color: #666; font-size: 12px; }
                    .equipos { margin-top: 30px; }
                    .equipos h3 { color: #1E3A5F; margin-bottom: 10px; }
                    .equipos ul { list-style: none; columns: 2; }
                    .equipos li { padding: 5px 0; font-size: 12px; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LISTA DE COMPRAS - FILTROS</h1>
                    <p>MAQUINARIA PRO - Grupo Vásquez</p>
                </div>
                <div class="date">Fecha: ${new Date().toLocaleDateString('es-PE')}</div>

                <table>
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Código Filtro</th>
                            <th>Descripción</th>
                            <th style="text-align: center;">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lista.map((item, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td><strong>${item.codigo}</strong></td>
                                <td>${item.descripcion}</td>
                                <td class="cantidad">${item.cantidad}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="equipos">
                    <h3>Equipos Seleccionados (${selectedFiltros.length}):</h3>
                    <ul>
                        ${selectedFiltros.map(f => `<li>• ${f.maquinaria_codigo} - ${f.maquinaria_descripcion}</li>`).join('')}
                    </ul>
                </div>

                <div class="footer">
                    <p>Total: ${lista.length} tipos de filtros</p>
                    <p>Generado el ${new Date().toLocaleString('es-PE')}</p>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }

    // Generar lista de compras consolidada
    function generarListaCompras() {
        const listaConsolidada: Record<string, { codigo: string; descripcion: string; cantidad: number }> = {};

        const selectedFiltros = filtros.filter(f => selectedItems.includes(f.id));

        selectedFiltros.forEach(f => {
            // Helper para agregar filtro
            const addFilter = (codigo: string, desc: string, cant: number) => {
                if (!codigo) return;
                if (!listaConsolidada[codigo]) {
                    listaConsolidada[codigo] = { codigo, descripcion: desc, cantidad: 0 };
                }
                listaConsolidada[codigo].cantidad += cant || 1;
            };

            addFilter(f.filtro_separador_1, 'Filtro Separador', f.cantidad_sep_1);
            addFilter(f.filtro_separador_2, 'Filtro Separador 2', f.cantidad_sep_2);
            addFilter(f.filtro_combustible_1, 'Filtro Combustible', f.cantidad_comb_1);
            addFilter(f.filtro_combustible_2, 'Filtro Combustible 2', f.cantidad_comb_2);
            addFilter(f.filtro_aceite_motor, 'Filtro Aceite Motor', f.cantidad_aceite);
            addFilter(f.filtro_aire_primario, 'Filtro Aire Primario', f.cantidad_aire_prim);
            addFilter(f.filtro_aire_secundario, 'Filtro Aire Secundario', f.cantidad_aire_sec);
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
                    <button onClick={handleExport} className="btn btn-outline">
                        <Download size={18} />
                        Exportar
                    </button>
                    {usingDemo && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium">
                            ⚠️ Demo
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

            {/* Barra de códigos deslizable */}
            <div className="card p-4">
                <p className="text-sm text-gray-500 mb-3">Filtrar por equipo:</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    <button
                        onClick={() => setSearchTerm('')}
                        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            searchTerm === ''
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Todos
                    </button>
                    {filtros.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setSearchTerm(f.maquinaria_codigo)}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                searchTerm === f.maquinaria_codigo
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {f.maquinaria_codigo}
                        </button>
                    ))}
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
                                placeholder="Buscar por código de máquina o código de filtro..."
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
                                    <Link
                                        href={`/maquinaria?search=${f.maquinaria_codigo}`}
                                        className="text-sm text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {f.maquinaria_descripcion}
                                        <ExternalLink size={12} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs mb-1">Separador 1</p>
                                <p className="font-mono font-medium">{f.filtro_separador_1 || '-'}</p>
                                <p className="text-xs text-gray-400">Cant: {f.cantidad_sep_1 || 0}</p>
                            </div>
                            {f.filtro_separador_2 && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-gray-500 text-xs mb-1">Separador 2</p>
                                    <p className="font-mono font-medium">{f.filtro_separador_2}</p>
                                    <p className="text-xs text-gray-400">Cant: {f.cantidad_sep_2 || 0}</p>
                                </div>
                            )}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs mb-1">Combustible 1</p>
                                <p className="font-mono font-medium">{f.filtro_combustible_1 || '-'}</p>
                                <p className="text-xs text-gray-400">Cant: {f.cantidad_comb_1 || 0}</p>
                            </div>
                            {f.filtro_combustible_2 && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-gray-500 text-xs mb-1">Combustible 2</p>
                                    <p className="font-mono font-medium">{f.filtro_combustible_2}</p>
                                    <p className="text-xs text-gray-400">Cant: {f.cantidad_comb_2 || 0}</p>
                                </div>
                            )}
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
                            {f.filtro_aire_secundario && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-gray-500 text-xs mb-1">Aire Secundario</p>
                                    <p className="font-mono font-medium">{f.filtro_aire_secundario}</p>
                                    <p className="text-xs text-gray-400">Cant: {f.cantidad_aire_sec || 0}</p>
                                </div>
                            )}
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
                                <button onClick={handleExportListaCompras} className="btn btn-outline">
                                    <Download size={18} />
                                    Exportar Excel
                                </button>
                                <button onClick={handlePrint} className="btn btn-primary">
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
