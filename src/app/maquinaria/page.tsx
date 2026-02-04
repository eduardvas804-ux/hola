'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Clock,
    Filter,
    X,
    Save,
    RefreshCw,
    Download,
    CheckSquare,
    Square,
    ChevronDown
} from 'lucide-react';
import { fetchTable, insertRow, updateRow, deleteRow, deleteRows, registrarCambio } from '@/lib/api';
import { Maquinaria, TipoMaquinaria, EstadoMaquinaria, ICONOS_MAQUINARIA, EMPRESAS } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { exportToExcel, formatMaquinariaForExport } from '@/lib/export';
import { useAuth } from '@/components/auth-provider';
import { getSeriePorCodigo, getCodigoConSerie, getCodigoPorSerie, getEquipoPorSerie, EQUIPOS_MAESTRO } from '@/lib/equipos-data';
import { useToast } from '@/components/toast-provider';
import EquipoInfoCard from '@/components/equipo-info-card';

const TIPOS: TipoMaquinaria[] = [
    'EXCAVADORA', 'MOTONIVELADORA', 'CARGADOR FRONTAL', 'RETROEXCAVADORA',
    'RODILLO LISO', 'VOLQUETE', 'CISTERNA DE AGUA', 'CISTERNA DE COMBUSTIBLE', 'CAMIONETA'
];

const ESTADOS: EstadoMaquinaria[] = ['OPERATIVO', 'EN MANTENIMIENTO', 'INOPERATIVO', 'ALQUILADO'];

const DEMO_MAQUINARIA = [
    { id: '1', item: 1, serie: 'FAL10955', tipo: 'EXCAVADORA', modelo: '320D', marca: 'CATERPILLAR', año: 2012, codigo: 'EXC-01', empresa: 'JORGE LUIS VASQUEZ CUSMA', operador: 'JOSE ABANTO', tramo: 'CVP KM 25', estado: 'OPERATIVO', horas_actuales: 15612, alerta_mtto: false, updated_at: '2026-01-28' },
    { id: '2', item: 2, serie: '8WN00983', tipo: 'MOTONIVELADORA', modelo: '135H', marca: 'CATERPILLAR', año: 2010, codigo: 'MOT-01', empresa: 'JOMEX CONSTRUCTORA S.A.C', operador: 'CARLOS RUIZ', tramo: 'TONGOT', estado: 'OPERATIVO', horas_actuales: 12450, alerta_mtto: true, updated_at: '2026-01-27' },
    { id: '3', item: 3, serie: 'MTN00312', tipo: 'CARGADOR FRONTAL', modelo: '950H', marca: 'CATERPILLAR', año: 2011, codigo: 'CAR-01', empresa: 'JORGE LUIS VASQUEZ CUSMA', operador: 'PEDRO SILVA', tramo: 'ALMACEN', estado: 'EN MANTENIMIENTO', horas_actuales: 8900, alerta_mtto: true, updated_at: '2026-01-26' },
    { id: '4', item: 4, serie: 'WDB9302', tipo: 'VOLQUETE', modelo: 'ACTROS 3336K', marca: 'MERCEDES BENZ', año: 2015, codigo: 'VOL-01', empresa: 'JLMX VASQUEZ EJECUTORES E.I.R.L', operador: 'MIGUEL TORRES', tramo: 'CVP KM 30', estado: 'OPERATIVO', horas_actuales: 45000, alerta_mtto: false, updated_at: '2026-01-28' },
    { id: '5', item: 5, serie: 'YV2RT20', tipo: 'CISTERNA DE AGUA', modelo: 'FM', marca: 'VOLVO', año: 2018, codigo: 'CIST-01', empresa: 'JORGE LUIS VASQUEZ CUSMA', operador: 'JORG VASQUEZ', tramo: 'AV BAMBAMARCA (CHOTA)', estado: 'OPERATIVO', horas_actuales: 23500, alerta_mtto: false, updated_at: '2026-01-28' },
    { id: '6', item: 6, serie: 'CAT53312', tipo: 'RODILLO LISO', modelo: 'CS-533E', marca: 'CATERPILLAR', año: 2013, codigo: 'ROD-01', empresa: 'JOMEX CONSTRUCTORA S.A.C', operador: 'SIN ASIGNAR', tramo: 'ALMACEN', estado: 'INOPERATIVO', horas_actuales: 5600, alerta_mtto: false, updated_at: '2026-01-20' },
    { id: '7', item: 7, serie: 'CAT42098', tipo: 'RETROEXCAVADORA', modelo: '420F', marca: 'CATERPILLAR', año: 2016, codigo: 'RET-01', empresa: 'JORGE LUIS VASQUEZ CUSMA', operador: 'LUIS MENDEZ', tramo: 'PROYECTO NORTE', estado: 'OPERATIVO', horas_actuales: 9800, alerta_mtto: false, updated_at: '2026-01-28' },
    { id: '8', item: 8, serie: 'FORD8821', tipo: 'CAMIONETA', modelo: 'RANGER XLT', marca: 'FORD', año: 2020, codigo: 'CAM-01', empresa: 'JORGE LUIS VASQUEZ CUSMA', operador: 'ADMIN', tramo: 'OFICINA CENTRAL', estado: 'OPERATIVO', horas_actuales: 120000, alerta_mtto: false, updated_at: '2026-01-28' },
];

export default function MaquinariaPage() {
    const [maquinaria, setMaquinaria] = useState<Maquinaria[]>(DEMO_MAQUINARIA as Maquinaria[]);
    const [filteredData, setFilteredData] = useState<Maquinaria[]>(DEMO_MAQUINARIA as Maquinaria[]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showHorasModal, setShowHorasModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Maquinaria | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCodigo, setFilterCodigo] = useState('');
    const { profile, user } = useAuth();
    const toast = useToast();
    const [showCodigoFilter, setShowCodigoFilter] = useState(false);
    const [showEquipoInfo, setShowEquipoInfo] = useState<string | null>(null);
    const [searchCodigo, setSearchCodigo] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [newHoras, setNewHoras] = useState('');
    const [usingDemo, setUsingDemo] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const emptyForm = {
        item: 0,
        serie: '',
        tipo: 'EXCAVADORA' as TipoMaquinaria,
        modelo: '',
        marca: '',
        año: new Date().getFullYear(),
        codigo: '',
        empresa: EMPRESAS[0],
        operador: '',
        tramo: '',
        estado: 'OPERATIVO' as EstadoMaquinaria,
        horas_actuales: 0,
        alerta_mtto: false,
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterData();
    }, [searchTerm, filterCodigo, filterTipo, filterEstado, maquinaria]);

    // Códigos únicos para dropdown
    const codigosUnicos = [...new Set(maquinaria.map(m => m.codigo))].sort();

    async function fetchData() {
        try {
            const data = await fetchTable<Maquinaria>('maquinaria', '&order=item');
            if (data?.length > 0) {
                setUsingDemo(false);
                setMaquinaria(data);
            } else {
                setUsingDemo(true);
                setMaquinaria(DEMO_MAQUINARIA as Maquinaria[]);
            }
        } catch {
            setUsingDemo(true);
            setMaquinaria(DEMO_MAQUINARIA as Maquinaria[]);
        } finally {
            setLoading(false);
        }
    }

    function filterData() {
        let result = [...maquinaria];

        // Filtrar por código seleccionado
        if (filterCodigo) {
            result = result.filter(m => m.codigo === filterCodigo);
        }

        // Filtrar por búsqueda de texto
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(m =>
                m.codigo?.toLowerCase().includes(term) ||
                m.serie?.toLowerCase().includes(term) ||
                m.modelo?.toLowerCase().includes(term) ||
                m.operador?.toLowerCase().includes(term)
            );
        }

        if (filterTipo) {
            result = result.filter(m => m.tipo === filterTipo);
        }

        if (filterEstado) {
            result = result.filter(m => m.estado === filterEstado);
        }

        setFilteredData(result);
    }

    function openCreateModal() {
        setFormData({ ...emptyForm, item: maquinaria.length + 1 });
        setEditingItem(null);
        setShowModal(true);
    }

    function openEditModal(item: Maquinaria) {
        setFormData(item);
        setEditingItem(item);
        setShowModal(true);
    }

    function openHorasModal(item: Maquinaria) {
        setEditingItem(item);
        setNewHoras(item.horas_actuales.toString());
        setShowHorasModal(true);
    }

    async function handleSave() {
        console.log('💾 handleSave - usingDemo:', usingDemo);

        const usuarioInfo = {
            id: user?.id || 'demo',
            email: user?.email || 'demo@demo.com',
            nombre: profile?.nombre_completo || 'Usuario Demo'
        };

        if (usingDemo) {
            console.log('⚠️ En modo DEMO - cambios no se guardan en DB');
            // Demo mode - update local state
            if (editingItem) {
                setMaquinaria(prev => prev.map(m => m.id === editingItem.id ? { ...formData, id: editingItem.id, updated_at: new Date().toISOString() } : m));
                toast.success('Equipo actualizado (modo demo)');
            } else {
                const newItem = { ...formData, id: Date.now().toString(), updated_at: new Date().toISOString() };
                setMaquinaria(prev => [...prev, newItem]);
                toast.success('Equipo agregado (modo demo)');
            }
            setShowModal(false);
            return;
        }

        console.log('✅ Guardando en Supabase...');

        try {
            if (editingItem) {
                await updateRow('maquinaria', editingItem.id, formData);
                // Registrar cambio en historial
                await registrarCambio('maquinaria', 'UPDATE', formData.codigo || editingItem.id, editingItem, formData, usuarioInfo);
                toast.success('Equipo actualizado correctamente');
            } else {
                await insertRow('maquinaria', formData);
                // Registrar creación en historial
                await registrarCambio('maquinaria', 'CREATE', formData.codigo || '', null, formData, usuarioInfo);
                toast.success('Equipo agregado correctamente');
            }
            fetchData();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar el equipo');
        }
    }

    async function handleUpdateHoras() {
        if (!editingItem) return;

        const horas = parseFloat(newHoras);
        if (isNaN(horas) || horas < editingItem.horas_actuales) {
            toast.error('Las horas deben ser mayores al valor actual');
            return;
        }

        const usuarioInfo = {
            id: user?.id || 'demo',
            email: user?.email || 'demo@demo.com',
            nombre: profile?.nombre_completo || 'Usuario Demo'
        };

        if (usingDemo) {
            setMaquinaria(prev => prev.map(m =>
                m.id === editingItem.id
                    ? { ...m, horas_actuales: horas, updated_at: new Date().toISOString() }
                    : m
            ));
            setShowHorasModal(false);
            return;
        }

        try {
            const datosAnteriores = { horas_actuales: editingItem.horas_actuales };
            const datosNuevos = { horas_actuales: horas };

            await updateRow('maquinaria', editingItem.id, {
                horas_actuales: horas,
                updated_at: new Date().toISOString()
            });

            // Registrar cambio de horómetro en historial
            await registrarCambio('maquinaria', 'UPDATE', editingItem.codigo || editingItem.id, datosAnteriores, datosNuevos, usuarioInfo);

            fetchData();
            setShowHorasModal(false);
        } catch (error) {
            console.error('Error updating hours:', error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Está seguro de eliminar este equipo?')) return;

        const itemToDelete = maquinaria.find(m => m.id === id);
        const usuarioInfo = {
            id: user?.id || 'demo',
            email: user?.email || 'demo@demo.com',
            nombre: profile?.nombre_completo || 'Usuario Demo'
        };

        if (usingDemo) {
            setMaquinaria(prev => prev.filter(m => m.id !== id));
            setSelectedItems(prev => { prev.delete(id); return new Set(prev); });
            return;
        }

        try {
            await deleteRow('maquinaria', id);

            // Registrar eliminación en historial
            if (itemToDelete) {
                await registrarCambio('maquinaria', 'DELETE', itemToDelete.codigo || id, itemToDelete, null, usuarioInfo);
            }

            setSelectedItems(prev => { prev.delete(id); return new Set(prev); });
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    }

    async function handleBulkDelete() {
        if (selectedItems.size === 0) return;
        if (!confirm(`¿Está seguro de eliminar ${selectedItems.size} equipo(s)?`)) return;

        const itemsToDelete = maquinaria.filter(m => selectedItems.has(m.id));
        const usuarioInfo = {
            id: user?.id || 'demo',
            email: user?.email || 'demo@demo.com',
            nombre: profile?.nombre_completo || 'Usuario Demo'
        };

        if (usingDemo) {
            setMaquinaria(prev => prev.filter(m => !selectedItems.has(m.id)));
            setSelectedItems(new Set());
            return;
        }

        try {
            await deleteRows('maquinaria', Array.from(selectedItems));

            // Registrar eliminaciones en historial
            for (const item of itemsToDelete) {
                await registrarCambio('maquinaria', 'DELETE', item.codigo || item.id, item, null, usuarioInfo);
            }

            setSelectedItems(new Set());
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    }

    function handleExport() {
        const dataToExport = formatMaquinariaForExport(maquinaria);
        exportToExcel(dataToExport, 'Maquinaria_' + new Date().toISOString().split('T')[0], 'Maquinaria');
    }

    function toggleSelectItem(id: string) {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }

    function toggleSelectAll() {
        if (selectedItems.size === filteredData.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredData.map(m => m.id)));
        }
    }

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
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Maquinaria</h1>
                    <p className="text-gray-500 mt-1">Administra tu flota de equipos pesados</p>
                </div>
                <div className="flex gap-3">
                    {selectedItems.size > 0 && (
                        <button onClick={handleBulkDelete} className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50">
                            <Trash2 size={18} />
                            Eliminar ({selectedItems.size})
                        </button>
                    )}
                    <button onClick={handleExport} className="btn btn-outline">
                        <Download size={18} />
                        Exportar
                    </button>
                    {usingDemo && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                            ⚠️ Demo
                        </span>
                    )}
                    <button onClick={openCreateModal} className="btn btn-primary">
                        <Plus size={20} />
                        Nuevo Equipo
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap gap-4">
                    {/* Dropdown filtro por código */}
                    <div className="relative w-72">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowCodigoFilter(!showCodigoFilter)}
                                className="w-full input flex items-center justify-between text-left"
                            >
                                <span className={filterCodigo ? 'text-gray-800' : 'text-gray-400'}>
                                    {filterCodigo ? `${getCodigoPorSerie(filterCodigo) || filterCodigo} (${filterCodigo})` : 'Todos los equipos...'}
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
                                        {codigosUnicos
                                            .filter(c => {
                                                const codigoReal = getCodigoPorSerie(c).toLowerCase();
                                                const term = searchCodigo.toLowerCase();
                                                return c.toLowerCase().includes(term) || codigoReal.includes(term);
                                            })
                                            .map(serie => (
                                                <button
                                                    key={serie}
                                                    onClick={() => { setFilterCodigo(serie); setShowCodigoFilter(false); setSearchCodigo(''); }}
                                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${filterCodigo === serie ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                                >
                                                    <span>{ICONOS_MAQUINARIA[maquinaria.find(m => m.codigo === serie)?.tipo as TipoMaquinaria] || '🔧'}</span>
                                                    <span className="font-medium">{getCodigoPorSerie(serie) || serie}</span>
                                                    <span className="text-gray-400">({serie})</span>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Búsqueda */}
                    <div className="flex-1 min-w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Serie, modelo, operador..."
                                className="input pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tipo */}
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            className="input select w-full"
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {TIPOS.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Estado */}
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            className="input select w-full"
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {ESTADOS.map(e => (
                                <option key={e} value={e}>{e}</option>
                            ))}
                        </select>
                    </div>

                    {/* Limpiar filtros */}
                    {(filterCodigo || searchTerm || filterTipo || filterEstado) && (
                        <div className="self-end">
                            <button
                                onClick={() => { setFilterCodigo(''); setSearchTerm(''); setFilterTipo(''); setFilterEstado(''); }}
                                className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <X size={18} />
                                Limpiar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="w-10">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        {selectedItems.size === filteredData.length && filteredData.length > 0 ? (
                                            <CheckSquare size={18} className="text-blue-600" />
                                        ) : (
                                            <Square size={18} className="text-gray-400" />
                                        )}
                                    </button>
                                </th>
                                <th>Item</th>
                                <th>Código / Serie</th>
                                <th>Tipo</th>
                                <th>Modelo</th>
                                <th>Marca</th>
                                <th>Operador</th>
                                <th>Tramo</th>
                                <th>Horas</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((m) => (
                                <tr key={m.id} className={selectedItems.has(m.id) ? 'bg-blue-50' : ''}>
                                    <td>
                                        <button
                                            onClick={() => toggleSelectItem(m.id)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            {selectedItems.has(m.id) ? (
                                                <CheckSquare size={18} className="text-blue-600" />
                                            ) : (
                                                <Square size={18} className="text-gray-400" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="text-gray-500">{m.item}</td>
                                    <td>
                                        <button
                                            onClick={() => setShowEquipoInfo(m.codigo)}
                                            className="flex flex-col text-left hover:opacity-80 transition-opacity"
                                            title="Ver información vinculada"
                                        >
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-white font-bold text-sm w-fit cursor-pointer hover:bg-slate-700">
                                                {getCodigoPorSerie(m.codigo) || m.codigo}
                                            </span>
                                            <span className="text-xs text-gray-400 mt-0.5 pl-1">
                                                {m.codigo}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <span className="flex items-center gap-2">
                                            <span className="text-xl">{ICONOS_MAQUINARIA[m.tipo as TipoMaquinaria] || '🔧'}</span>
                                            <span className="text-sm">{m.tipo}</span>
                                        </span>
                                    </td>
                                    <td>{m.modelo}</td>
                                    <td>{m.marca}</td>
                                    <td>{m.operador}</td>
                                    <td className="max-w-32 truncate" title={m.tramo}>{m.tramo}</td>
                                    <td>
                                        <button
                                            onClick={() => openHorasModal(m)}
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            <Clock size={16} />
                                            {formatNumber(m.horas_actuales)}
                                        </button>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${m.estado.toLowerCase().replace('en ', '')}`}>
                                            {m.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(m)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(m.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500">
                        Mostrando {filteredData.length} de {maquinaria.length} equipos
                    </p>
                </div>
            </div>

            {/* Modal Crear/Editar */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {editingItem ? 'Editar Equipo' : 'Nuevo Equipo'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.codigo}
                                        onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                        placeholder="EXC-01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Serie *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.serie}
                                        onChange={e => setFormData({ ...formData, serie: e.target.value.toUpperCase() })}
                                        placeholder="FAL10955"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                                    <select
                                        className="input select"
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value as TipoMaquinaria })}
                                    >
                                        {TIPOS.map(t => (
                                            <option key={t} value={t}>{ICONOS_MAQUINARIA[t]} {t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                                    <select
                                        className="input select"
                                        value={formData.estado}
                                        onChange={e => setFormData({ ...formData, estado: e.target.value as EstadoMaquinaria })}
                                    >
                                        {ESTADOS.map(e => (
                                            <option key={e} value={e}>{e}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.modelo}
                                        onChange={e => setFormData({ ...formData, modelo: e.target.value })}
                                        placeholder="320D"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.marca}
                                        onChange={e => setFormData({ ...formData, marca: e.target.value.toUpperCase() })}
                                        placeholder="CATERPILLAR"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.año}
                                        onChange={e => setFormData({ ...formData, año: parseInt(e.target.value) })}
                                        min={1980}
                                        max={new Date().getFullYear() + 1}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
                                <select
                                    className="input select"
                                    value={formData.empresa}
                                    onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                                >
                                    {EMPRESAS.map(emp => (
                                        <option key={emp} value={emp}>{emp}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Operador</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.operador}
                                        onChange={e => setFormData({ ...formData, operador: e.target.value.toUpperCase() })}
                                        placeholder="JOSE ABANTO"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tramo/Ubicación</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.tramo}
                                        onChange={e => setFormData({ ...formData, tramo: e.target.value.toUpperCase() })}
                                        placeholder="CVP KM 25"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horas Actuales *</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.horas_actuales}
                                    onChange={e => setFormData({ ...formData, horas_actuales: parseFloat(e.target.value) })}
                                    min={0}
                                    step={0.1}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="btn btn-outline">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="btn btn-primary">
                                <Save size={18} />
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Actualizar Horas */}
            {showHorasModal && editingItem && (
                <div className="modal-overlay" onClick={() => setShowHorasModal(false)}>
                    <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">Actualizar Horómetro</h2>
                                <button onClick={() => setShowHorasModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <p className="text-4xl mb-2">{ICONOS_MAQUINARIA[editingItem.tipo as TipoMaquinaria] || '🔧'}</p>
                                <p className="font-bold text-lg text-gray-800">{editingItem.codigo}</p>
                                <p className="text-gray-500">{editingItem.tipo} - {editingItem.modelo}</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <p className="text-sm text-gray-500">Horas actuales</p>
                                <p className="text-2xl font-bold text-gray-800">{formatNumber(editingItem.horas_actuales)} h</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nueva lectura de horómetro</label>
                                <input
                                    type="number"
                                    className="input text-xl font-bold text-center"
                                    value={newHoras}
                                    onChange={e => setNewHoras(e.target.value)}
                                    min={editingItem.horas_actuales}
                                    step={0.1}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowHorasModal(false)} className="btn btn-outline">
                                Cancelar
                            </button>
                            <button onClick={handleUpdateHoras} className="btn btn-secondary">
                                <RefreshCw size={18} />
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Info Equipo Vinculado */}
            {showEquipoInfo && (
                <div className="modal-overlay" onClick={() => setShowEquipoInfo(null)}>
                    <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
                        <EquipoInfoCard
                            codigo={showEquipoInfo}
                            onClose={() => setShowEquipoInfo(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
