'use client';

import { useState, useEffect } from 'react';
import { fetchTable, deleteRow, registrarCambio } from '@/lib/api';
import { Search, Download, ShoppingCart, Check, Printer, ChevronDown, X, Trash2 } from 'lucide-react';
import { exportToExcel, formatFiltrosForExport } from '@/lib/export';
import { EQUIPOS_MAESTRO, getCodigoReal, getSerieReal, getTipoReal, getModeloReal, getEquipoPorCodigoOSerie } from '@/lib/equipos-data';
import { useAuth } from '@/components/auth-provider';
import { puedeEliminar } from '@/lib/permisos';
import { Role, Filtro, Maquinaria } from '@/lib/types';

const DEMO_FILTROS = [
    { id: '1', maquinaria_codigo: 'EXC-01', filtro_separador_1: '438-5386', cantidad_sep_1: 1, filtro_combustible_1: '1R-0751', cantidad_comb_1: 2, filtro_aceite_motor: '1R-0739', cantidad_aceite: 1, filtro_aire_primario: '131-8822', cantidad_aire_prim: 1, filtro_aire_secundario: '131-8821', cantidad_aire_sec: 1 },
    { id: '2', maquinaria_codigo: 'MOT-01', filtro_separador_1: '326-1643', cantidad_sep_1: 1, filtro_combustible_1: '1R-0750', cantidad_comb_1: 1, filtro_aceite_motor: '1R-0716', cantidad_aceite: 2, filtro_aire_primario: '6I-2501', cantidad_aire_prim: 1, filtro_aire_secundario: '6I-2502', cantidad_aire_sec: 1 },
    { id: '3', maquinaria_codigo: 'CARG-04', filtro_separador_1: '326-1643', cantidad_sep_1: 1, filtro_combustible_1: '1R-0751', cantidad_comb_1: 2, filtro_aceite_motor: '1R-0739', cantidad_aceite: 1, filtro_aire_primario: '6I-2501', cantidad_aire_prim: 1, filtro_aire_secundario: '6I-2502', cantidad_aire_sec: 1 },
    { id: '4', maquinaria_codigo: 'VOLQ-01', filtro_separador_1: 'A0004771302', cantidad_sep_1: 1, filtro_combustible_1: 'A0004700469', cantidad_comb_1: 1, filtro_aceite_motor: 'A4721800109', cantidad_aceite: 1, filtro_aire_primario: 'A0040942404', cantidad_aire_prim: 1, filtro_aire_secundario: 'A0040942504', cantidad_aire_sec: 1 },
    { id: '5', maquinaria_codigo: 'CIST-01', filtro_separador_1: '21380475', cantidad_sep_1: 1, filtro_combustible_1: '22480372', cantidad_comb_1: 1, filtro_aceite_motor: '21707134', cantidad_aceite: 1, filtro_aire_primario: '21386644', cantidad_aire_prim: 1, filtro_aire_secundario: '21834210', cantidad_aire_sec: 1 },
    { id: '6', maquinaria_codigo: 'RETRO-01', filtro_separador_1: '361-9554', cantidad_sep_1: 1, filtro_combustible_1: '326-1644', cantidad_comb_1: 1, filtro_aceite_motor: '1R-0716', cantidad_aceite: 1, filtro_aire_primario: '131-8902', cantidad_aire_prim: 1, filtro_aire_secundario: '131-8903', cantidad_aire_sec: 1 },
];

export default function FiltrosPage() {
    const [filtros, setFiltros] = useState<Filtro[]>(DEMO_FILTROS as Filtro[]);
    const [equiposList, setEquiposList] = useState<Maquinaria[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCodigo, setFilterCodigo] = useState('');
    const [showCodigoFilter, setShowCodigoFilter] = useState(false);
    const [searchCodigo, setSearchCodigo] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showListaCompras, setShowListaCompras] = useState(false);
    const [usingDemo, setUsingDemo] = useState(true);
    const { profile, user } = useAuth();
    const userRole = profile?.rol as Role;

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const data = await fetchTable<Filtro>('filtros');
            if (data?.length > 0) {
                setUsingDemo(false);
                setFiltros(data);
            } else {
                setUsingDemo(true);
                setFiltros(DEMO_FILTROS as Filtro[]);
            }
        } catch {
            setUsingDemo(true);
            setFiltros(DEMO_FILTROS as Filtro[]);
        } finally {
            setLoading(false);
        }

        // Cargar lista de maquinaria
        try {
            const maquinariaData = await fetchTable<Maquinaria>('maquinaria', '&order=codigo');
            if (maquinariaData && maquinariaData.length > 0) {
                setEquiposList(maquinariaData);
            }
        } catch (e) {
            console.error('Error loading machinery for filters:', e);
        }
    }

    const filteredFiltros = filtros.filter(f => {
        if (filterCodigo && f.maquinaria_codigo !== filterCodigo) return false;

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const codigo = getCodigoReal(f.maquinaria_codigo).toLowerCase();
            const serie = getSerieReal(f.maquinaria_codigo).toLowerCase();
            return (
                f.maquinaria_codigo.toLowerCase().includes(search) ||
                codigo.includes(search) ||
                serie.includes(search) ||
                (f.filtro_separador_1 || '').toLowerCase().includes(search) ||
                (f.filtro_combustible_1 || '').toLowerCase().includes(search) ||
                (f.filtro_aceite_motor || '').toLowerCase().includes(search) ||
                (f.filtro_aire_primario || '').toLowerCase().includes(search)
            );
        }
        return true;
    });

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este registro de filtros?')) return;

        const itemToDelete = filtros.find(f => f.id === id);
        const usuarioInfo = {
            id: user?.id || 'demo',
            email: user?.email || 'demo@demo.com',
            nombre: profile?.nombre_completo || 'Usuario Demo'
        };

        if (usingDemo) {
            setFiltros(prev => prev.filter(f => f.id !== id));
            setSelectedItems(prev => prev.filter(i => i !== id));
            return;
        }

        try {
            await deleteRow('filtros', id);
            if (itemToDelete) {
                await registrarCambio('filtros', 'DELETE', itemToDelete.maquinaria_codigo, itemToDelete, null, usuarioInfo);
            }
            fetchData();
            setSelectedItems(prev => prev.filter(i => i !== id));
        } catch (error) {
            console.error('Error:', error);
        }
    }

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
                    .date { text-align: right; color: #666; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: #1E3A5F; color: white; padding: 12px 8px; text-align: left; }
                    td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
                    .cantidad { text-align: center; font-weight: bold; }
                    .equipos { margin-top: 30px; }
                    .equipos h3 { color: #1E3A5F; margin-bottom: 10px; }
                    .equipos ul { list-style: none; columns: 2; }
                    .equipos li { padding: 5px 0; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LISTA DE COMPRAS - FILTROS</h1>
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
                        ${selectedFiltros.map(f => `<li>• ${getCodigoReal(f.maquinaria_codigo)} (${getSerieReal(f.maquinaria_codigo)})</li>`).join('')}
                    </ul>
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }

    function generarListaCompras() {
        const listaConsolidada: Record<string, { codigo: string; descripcion: string; cantidad: number }> = {};
        const selectedFiltros = filtros.filter(f => selectedItems.includes(f.id));

        selectedFiltros.forEach(f => {
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
                    <p className="text-gray-500 mt-1">Catálogo de filtros por equipo</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="btn btn-outline">
                        <Download size={18} />
                        Exportar
                    </button>
                    {usingDemo && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium">
                            Demo
                        </span>
                    )}
                    {selectedItems.length > 0 && (
                        <button onClick={() => setShowListaCompras(true)} className="btn btn-secondary">
                            <ShoppingCart size={20} />
                            Lista ({selectedItems.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros de búsqueda */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    {/* Dropdown filtro por código */}
                    <div className="relative sm:w-72">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowCodigoFilter(!showCodigoFilter)}
                                className="w-full input flex items-center justify-between text-left"
                            >
                                <span className={filterCodigo ? 'text-gray-800' : 'text-gray-400'}>
                                    {filterCodigo ? `${filterCodigo} - ${getTipoReal(filterCodigo)} ${getModeloReal(filterCodigo)} (${getSerieReal(filterCodigo)})` : 'Todos los equipos...'}
                                </span>
                                <ChevronDown size={18} className={`text-gray-400 transition-transform ${showCodigoFilter ? 'rotate-180' : ''}`} />
                            </button>

                            {showCodigoFilter && (
                                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                                    <div className="p-2 border-b sticky top-0 bg-white">
                                        <div className="relative">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar código o serie..."
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={searchCodigo}
                                                onChange={(e) => setSearchCodigo(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-60">
                                        <button
                                            onClick={() => { setFilterCodigo(''); setShowCodigoFilter(false); setSearchCodigo(''); }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${!filterCodigo ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                        >
                                            Todos
                                        </button>
                                        {equiposList.length > 0 ? (
                                            equiposList.map(eq => (
                                                <button
                                                    key={eq.id}
                                                    onClick={() => { setFilterCodigo(eq.codigo); setShowCodigoFilter(false); setSearchCodigo(''); }}
                                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${filterCodigo === eq.codigo ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                                >
                                                    <span className="font-medium">{eq.codigo}</span>
                                                    <span className="text-gray-500 ml-2">{eq.tipo} {eq.modelo}</span>
                                                    <span className="text-gray-400 ml-1">({eq.serie})</span>
                                                </button>
                                            ))
                                        ) : (
                                            EQUIPOS_MAESTRO
                                                .filter(eq => {
                                                    const term = searchCodigo.toLowerCase();
                                                    return eq.codigo.toLowerCase().includes(term) ||
                                                        eq.serie.toLowerCase().includes(term) ||
                                                        eq.tipo.toLowerCase().includes(term) ||
                                                        eq.modelo.toLowerCase().includes(term);
                                                })
                                                .map(eq => (
                                                    <button
                                                        key={eq.codigo}
                                                        onClick={() => { setFilterCodigo(eq.codigo); setShowCodigoFilter(false); setSearchCodigo(''); }}
                                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${filterCodigo === eq.codigo ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                                    >
                                                        <span className="font-medium">{eq.codigo}</span>
                                                        <span className="text-gray-500 ml-2">{eq.tipo} {eq.modelo}</span>
                                                        <span className="text-gray-400 ml-1">({eq.serie})</span>
                                                    </button>
                                                ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Búsqueda */}
                    <div className="flex-1 min-w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar filtro</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Código de filtro, serie..."
                                className="input pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {(filterCodigo || searchTerm) && (
                        <button
                            onClick={() => { setFilterCodigo(''); setSearchTerm(''); }}
                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                        >
                            <X size={16} /> Limpiar
                        </button>
                    )}
                    <button onClick={selectAll} className="btn btn-outline">
                        <Check size={18} />
                        {selectedItems.length === filteredFiltros.length ? 'Deseleccionar' : 'Seleccionar Todo'}
                    </button>
                </div>
            </div>

            {/* Catálogo de Filtros - Nuevo diseño */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFiltros.map((f) => (
                    <div
                        key={f.id}
                        className={`card overflow-hidden transition-all ${selectedItems.includes(f.id)
                            ? 'ring-2 ring-blue-500 bg-blue-50/50'
                            : 'hover:shadow-lg'
                            }`}
                    >
                        {/* Header del card - Código, Tipo y Serie */}
                        <div
                            className={`p-4 cursor-pointer ${selectedItems.includes(f.id) ? 'bg-blue-500 text-white' : 'bg-slate-800 text-white'}`}
                            onClick={() => toggleSelect(f.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">{getCodigoReal(f.maquinaria_codigo)}</h3>
                                    <p className={`text-sm ${selectedItems.includes(f.id) ? 'text-blue-100' : 'text-slate-300'}`}>
                                        {getTipoReal(f.maquinaria_codigo)} {getModeloReal(f.maquinaria_codigo)}
                                    </p>
                                    <p className={`text-xs ${selectedItems.includes(f.id) ? 'text-blue-200' : 'text-slate-400'}`}>
                                        Serie: {getSerieReal(f.maquinaria_codigo) || 'N/A'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedItems.includes(f.id) && (
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            <Check size={20} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contenido - Filtros */}
                        <div className="p-4 space-y-2">
                            {f.filtro_separador_1 && (
                                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500">Separador</p>
                                        <p className="font-mono font-semibold">{f.filtro_separador_1}</p>
                                    </div>
                                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold">x{f.cantidad_sep_1 || 1}</span>
                                </div>
                            )}
                            {f.filtro_combustible_1 && (
                                <div className="flex justify-between items-center py-2 px-3 bg-amber-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-amber-600">Combustible</p>
                                        <p className="font-mono font-semibold">{f.filtro_combustible_1}</p>
                                    </div>
                                    <span className="bg-amber-200 text-amber-700 px-2 py-1 rounded text-xs font-bold">x{f.cantidad_comb_1 || 1}</span>
                                </div>
                            )}
                            {f.filtro_aceite_motor && (
                                <div className="flex justify-between items-center py-2 px-3 bg-yellow-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-yellow-600">Aceite Motor</p>
                                        <p className="font-mono font-semibold">{f.filtro_aceite_motor}</p>
                                    </div>
                                    <span className="bg-yellow-200 text-yellow-700 px-2 py-1 rounded text-xs font-bold">x{f.cantidad_aceite || 1}</span>
                                </div>
                            )}
                            {f.filtro_aire_primario && (
                                <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-blue-600">Aire Primario</p>
                                        <p className="font-mono font-semibold">{f.filtro_aire_primario}</p>
                                    </div>
                                    <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-bold">x{f.cantidad_aire_prim || 1}</span>
                                </div>
                            )}
                            {f.filtro_aire_secundario && (
                                <div className="flex justify-between items-center py-2 px-3 bg-sky-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-sky-600">Aire Secundario</p>
                                        <p className="font-mono font-semibold">{f.filtro_aire_secundario}</p>
                                    </div>
                                    <span className="bg-sky-200 text-sky-700 px-2 py-1 rounded text-xs font-bold">x{f.cantidad_aire_sec || 1}</span>
                                </div>
                            )}

                            {/* Botón eliminar */}
                            {puedeEliminar(userRole, 'filtros') && (
                                <div className="pt-2 border-t mt-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                                        className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Eliminar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredFiltros.length === 0 && (
                <div className="card p-12 text-center">
                    <p className="text-gray-500">No se encontraron filtros</p>
                </div>
            )}

            {/* Modal Lista de Compras */}
            {showListaCompras && (
                <div className="modal-overlay" onClick={() => setShowListaCompras(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <ShoppingCart size={24} />
                                    Lista de Compras
                                </h2>
                                <button onClick={() => setShowListaCompras(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <p className="text-gray-500 mt-1">{selectedItems.length} equipos seleccionados</p>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 font-semibold">Código</th>
                                        <th className="text-left py-3 px-2 font-semibold">Tipo</th>
                                        <th className="text-center py-3 px-2 font-semibold">Cant.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaCompras.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-100">
                                            <td className="py-3 px-2 font-mono font-bold">{item.codigo}</td>
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
                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                            <p className="text-gray-500">Total: <span className="font-bold">{listaCompras.length} filtros</span></p>
                            <div className="flex gap-3">
                                <button onClick={handleExportListaCompras} className="btn btn-outline">
                                    <Download size={18} />
                                    Excel
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
