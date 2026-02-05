'use client';
// Version Legacy Restored


import { useState, useEffect } from 'react';
import {
    Fuel,
    Search,
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Save,
    X,
    Edit,
    Trash2,
    ChevronDown,
    Droplets,
    ArrowDownCircle,
    ArrowUpCircle
} from 'lucide-react';
import { fetchTableWithStatus, insertRow, updateRow, deleteRow, registrarCambio } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { ICONOS_MAQUINARIA, TipoMaquinaria, Role } from '@/lib/types';
import { exportToExcel } from '@/lib/export';
import { useAuth } from '@/components/auth-provider';
import { puedeVer, puedeCrear, puedeEditar, puedeEliminar, puedeExportar } from '@/lib/permisos';
import { useRouter } from 'next/navigation';
import { getCodigoConSerie, EQUIPOS_MAESTRO } from '@/lib/equipos-data';

type TipoMovimiento = 'ENTRADA' | 'SALIDA';

interface RegistroCombustible {
    id: string;
    fecha: string;
    tipo_movimiento: TipoMovimiento;
    codigo_maquina: string;
    tipo_maquina?: string;
    horometro?: number;
    galones: number;
    precio_galon?: number;
    total?: number;
    proveedor?: string;
    numero_factura?: string;
    operador?: string;
    observaciones?: string;
    created_at?: string;
}

const DEMO_COMBUSTIBLE: RegistroCombustible[] = [
    { id: '1', fecha: '2026-01-28', tipo_movimiento: 'ENTRADA', codigo_maquina: 'CISTERNA', galones: 500, precio_galon: 14.50, total: 7250, proveedor: 'PETROPERU', numero_factura: 'F001-00234', observaciones: 'Abastecimiento cisterna' },
    { id: '2', fecha: '2026-01-28', tipo_movimiento: 'SALIDA', codigo_maquina: 'EXC-01', tipo_maquina: 'EXCAVADORA', horometro: 15612, galones: 45, operador: 'JOSE ABANTO', observaciones: 'Despacho en obra' },
    { id: '3', fecha: '2026-01-27', tipo_movimiento: 'SALIDA', codigo_maquina: 'VOL-01', tipo_maquina: 'VOLQUETE', horometro: 45000, galones: 80, operador: 'MIGUEL TORRES' },
    { id: '4', fecha: '2026-01-27', tipo_movimiento: 'SALIDA', codigo_maquina: 'MOT-01', tipo_maquina: 'MOTONIVELADORA', horometro: 12420, galones: 35, operador: 'CARLOS RUIZ' },
    { id: '5', fecha: '2026-01-26', tipo_movimiento: 'SALIDA', codigo_maquina: 'CAR-01', tipo_maquina: 'CARGADOR FRONTAL', horometro: 8900, galones: 50, operador: 'PEDRO SILVA' },
    { id: '6', fecha: '2026-01-25', tipo_movimiento: 'ENTRADA', codigo_maquina: 'CISTERNA', galones: 1000, precio_galon: 14.30, total: 14300, proveedor: 'REPSOL', numero_factura: 'F001-00198' },
    { id: '7', fecha: '2026-01-25', tipo_movimiento: 'SALIDA', codigo_maquina: 'CIST-01', tipo_maquina: 'CISTERNA DE AGUA', horometro: 23500, galones: 60, operador: 'JORGE VASQUEZ' },
];

export default function CombustiblePage() {
    const [registros, setRegistros] = useState<RegistroCombustible[]>(DEMO_COMBUSTIBLE);
    const [maquinaria, setMaquinaria] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<RegistroCombustible | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMes, setFilterMes] = useState('');
    const [filterTipo, setFilterTipo] = useState<TipoMovimiento | ''>('');
    const [filterCodigo, setFilterCodigo] = useState<string>('');
    const [showCodigoFilter, setShowCodigoFilter] = useState(false);
    const [searchCodigo, setSearchCodigo] = useState('');
    const [usingDemo, setUsingDemo] = useState(true);
    const { profile, user } = useAuth();
    const router = useRouter();
    const userRole = profile?.rol as Role;

    const emptyForm: Partial<RegistroCombustible> = {
        fecha: new Date().toISOString().split('T')[0],
        tipo_movimiento: 'SALIDA',
        codigo_maquina: '',
        horometro: 0,
        galones: 0,
        precio_galon: 14.50,
        total: 0,
        proveedor: '',
        numero_factura: '',
        operador: '',
        observaciones: ''
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        if (profile && !puedeVer(userRole, 'combustible')) {
            router.push('/');
            return;
        }
        fetchData();
    }, [profile, userRole, router]);

    useEffect(() => {
        // Calcular total automáticamente para entradas
        if (formData.tipo_movimiento === 'ENTRADA') {
            const total = (formData.galones || 0) * (formData.precio_galon || 0);
            setFormData(prev => ({ ...prev, total }));
        }
    }, [formData.galones, formData.precio_galon, formData.tipo_movimiento]);

    async function fetchData() {
        try {
            const [combustibleResult, maquinariaResult] = await Promise.all([
                fetchTableWithStatus<RegistroCombustible>('combustible', '&order=fecha.desc'),
                fetchTableWithStatus<any>('maquinaria', '&order=codigo')
            ]);

            console.log('Combustible result:', combustibleResult);
            console.log('Maquinaria result:', maquinariaResult);

            // Si la conexión funciona, usar datos reales (aunque estén vacíos)
            if (combustibleResult.connected) {
                setUsingDemo(false);
                setRegistros(combustibleResult.data.length > 0 ? combustibleResult.data : []);
            }

            if (maquinariaResult.data.length > 0) {
                setMaquinaria(maquinariaResult.data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal(tipo: TipoMovimiento) {
        setFormData({ ...emptyForm, tipo_movimiento: tipo, codigo_maquina: tipo === 'ENTRADA' ? 'CISTERNA' : '' });
        setEditingItem(null);
        setShowModal(true);
    }

    function openEditModal(item: RegistroCombustible) {
        setFormData(item);
        setEditingItem(item);
        setShowModal(true);
    }

    async function handleSave() {
        if (!formData.codigo_maquina || !formData.galones) {
            alert('Complete los campos obligatorios');
            return;
        }

        const usuarioInfo = {
            id: user?.id || 'demo',
            email: user?.email || 'demo@demo.com',
            nombre: profile?.nombre_completo || 'Usuario Demo'
        };

        const maq = maquinaria.find(m => m.codigo === formData.codigo_maquina);
        const dataToSave = {
            ...formData,
            tipo_maquina: maq?.tipo || formData.tipo_maquina
        };

        if (usingDemo) {
            if (editingItem) {
                setRegistros(prev => prev.map(r => r.id === editingItem.id ? { ...dataToSave, id: editingItem.id } as RegistroCombustible : r));
            } else {
                setRegistros(prev => [{ ...dataToSave, id: Date.now().toString() } as RegistroCombustible, ...prev]);
            }
        } else {
            try {
                if (editingItem) {
                    await updateRow('combustible', editingItem.id, dataToSave);
                    await registrarCambio('combustible', 'UPDATE', `${dataToSave.tipo_movimiento}-${dataToSave.codigo_maquina}`, editingItem, dataToSave, usuarioInfo);
                } else {
                    await insertRow('combustible', dataToSave);
                    await registrarCambio('combustible', 'CREATE', `${dataToSave.tipo_movimiento}-${dataToSave.codigo_maquina}`, null, dataToSave, usuarioInfo);
                }
                fetchData();
            } catch (error) {
                console.error('Error:', error);
                alert('Error al guardar');
                return;
            }
        }

        setShowModal(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este registro?')) return;

        const itemToDelete = registros.find(r => r.id === id);
        const usuarioInfo = {
            id: user?.id || 'demo',
            email: user?.email || 'demo@demo.com',
            nombre: profile?.nombre_completo || 'Usuario Demo'
        };

        if (usingDemo) {
            setRegistros(prev => prev.filter(r => r.id !== id));
        } else {
            await deleteRow('combustible', id);
            if (itemToDelete) {
                await registrarCambio('combustible', 'DELETE', `${itemToDelete.tipo_movimiento}-${itemToDelete.codigo_maquina}`, itemToDelete, null, usuarioInfo);
            }
            fetchData();
        }
    }

    function handleExport() {
        const data = registros.map(r => ({
            'Fecha': r.fecha,
            'Tipo': r.tipo_movimiento,
            'Código': r.codigo_maquina,
            'Tipo Máquina': r.tipo_maquina || '',
            'Horómetro': r.horometro || '',
            'Galones': r.galones,
            'Precio/Galón': r.precio_galon || '',
            'Total S/': r.total || '',
            'Proveedor': r.proveedor || '',
            'Factura': r.numero_factura || '',
            'Operador': r.operador || ''
        }));
        exportToExcel(data, 'Combustible_' + new Date().toISOString().split('T')[0], 'Combustible');
    }

    const filteredRegistros = registros.filter(r => {
        const matchSearch = r.codigo_maquina.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.operador || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchMes = !filterMes || r.fecha.startsWith(filterMes);
        const matchTipo = !filterTipo || r.tipo_movimiento === filterTipo;
        const matchCodigo = !filterCodigo || r.codigo_maquina === filterCodigo;
        return matchSearch && matchMes && matchTipo && matchCodigo;
    });

    // Estadísticas
    const entradas = registros.filter(r => r.tipo_movimiento === 'ENTRADA');
    const salidas = registros.filter(r => r.tipo_movimiento === 'SALIDA');
    const totalEntradas = entradas.reduce((sum, r) => sum + r.galones, 0);
    const totalSalidas = salidas.reduce((sum, r) => sum + r.galones, 0);
    const stockCisterna = totalEntradas - totalSalidas;
    const totalGastado = entradas.reduce((sum, r) => sum + (r.total || 0), 0);

    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="spinner"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Fuel className="text-amber-500" />
                        Control de Combustible
                    </h1>
                    <p className="text-gray-500 mt-1">Gestión de cisterna y despacho de combustible</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {puedeExportar(userRole, 'combustible') && (
                        <button onClick={handleExport} className="btn btn-outline">
                            <Download size={18} />
                            Exportar
                        </button>
                    )}
                    {usingDemo && <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm">Demo</span>}
                    {puedeCrear(userRole, 'combustible') && (
                        <>
                            <button onClick={() => openCreateModal('ENTRADA')} className="btn btn-secondary">
                                <ArrowDownCircle size={18} />
                                Abastecer Cisterna
                            </button>
                            <button onClick={() => openCreateModal('SALIDA')} className="btn btn-primary">
                                <ArrowUpCircle size={18} />
                                Despachar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats - Stock Cisterna */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Droplets className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{formatNumber(stockCisterna)}</p>
                            <p className="text-sm text-gray-500">Stock Cisterna (gal)</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4 border-l-4 border-green-500">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <TrendingDown className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{formatNumber(totalEntradas)}</p>
                            <p className="text-sm text-gray-500">Total Entradas (gal)</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4 border-l-4 border-amber-500">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <TrendingUp className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{formatNumber(totalSalidas)}</p>
                            <p className="text-sm text-gray-500">Total Despachado (gal)</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4 border-l-4 border-purple-500">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <DollarSign className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-600">S/ {formatNumber(totalGastado)}</p>
                            <p className="text-sm text-gray-500">Total Invertido</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Tipo de movimiento */}
                    <div className="sm:w-40">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            className="input w-full"
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value as TipoMovimiento | '')}
                        >
                            <option value="">Todos</option>
                            <option value="ENTRADA">Entradas</option>
                            <option value="SALIDA">Salidas</option>
                        </select>
                    </div>

                    {/* Dropdown filtro por código */}
                    <div className="relative sm:w-72">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowCodigoFilter(!showCodigoFilter)}
                                className="w-full input flex items-center justify-between text-left"
                            >
                                <span className={filterCodigo ? 'text-gray-800' : 'text-gray-400'}>
                                    {filterCodigo ? (filterCodigo === 'CISTERNA' ? 'CISTERNA' : getCodigoConSerie(filterCodigo)) : 'Todos...'}
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
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                value={searchCodigo}
                                                onChange={(e) => setSearchCodigo(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-60">
                                        <button
                                            onClick={() => { setFilterCodigo(''); setShowCodigoFilter(false); setSearchCodigo(''); }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${!filterCodigo ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700'}`}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => { setFilterCodigo('CISTERNA'); setShowCodigoFilter(false); setSearchCodigo(''); }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${filterCodigo === 'CISTERNA' ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700'}`}
                                        >
                                            <Fuel size={16} /> CISTERNA (Abastecimientos)
                                        </button>
                                        {EQUIPOS_MAESTRO
                                            .filter(eq => {
                                                const term = searchCodigo.toLowerCase();
                                                return eq.codigo.toLowerCase().includes(term) ||
                                                    eq.serie.toLowerCase().includes(term) ||
                                                    eq.modelo.toLowerCase().includes(term);
                                            })
                                            .map(eq => (
                                                <button
                                                    key={eq.codigo}
                                                    onClick={() => { setFilterCodigo(eq.codigo); setShowCodigoFilter(false); setSearchCodigo(''); }}
                                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${filterCodigo === eq.codigo ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700'}`}
                                                >
                                                    <span>{ICONOS_MAQUINARIA[eq.tipo as TipoMaquinaria] || '🚜'}</span>
                                                    <span className="font-medium">{eq.codigo}</span>
                                                    <span className="text-gray-500">{eq.modelo}</span>
                                                    <span className="text-gray-400">({eq.serie})</span>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mes */}
                    <div className="sm:w-44">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                        <input
                            type="month"
                            className="input w-full"
                            value={filterMes}
                            onChange={(e) => setFilterMes(e.target.value)}
                        />
                    </div>

                    {/* Búsqueda */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Operador..."
                                className="input pl-10 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Limpiar */}
                    {(filterCodigo || searchTerm || filterMes || filterTipo) && (
                        <button
                            onClick={() => { setFilterCodigo(''); setSearchTerm(''); setFilterMes(''); setFilterTipo(''); }}
                            className="self-end px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                        >
                            <X size={16} /> Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-gray-800">Movimientos de Combustible</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Equipo</th>
                                <th>Horómetro</th>
                                <th>Galones</th>
                                <th>Precio</th>
                                <th>Total</th>
                                <th>Proveedor/Operador</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRegistros.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-8 text-gray-500">No hay registros</td></tr>
                            ) : (
                                filteredRegistros.map((r) => (
                                    <tr key={r.id} className={r.tipo_movimiento === 'ENTRADA' ? 'bg-green-50/50' : ''}>
                                        <td>{new Date(r.fecha).toLocaleDateString('es-PE')}</td>
                                        <td>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.tipo_movimiento === 'ENTRADA'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {r.tipo_movimiento === 'ENTRADA' ? '↓ Entrada' : '↑ Salida'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span>{r.codigo_maquina === 'CISTERNA' ? '⛽' : ICONOS_MAQUINARIA[r.tipo_maquina as TipoMaquinaria] || '🚜'}</span>
                                                <span className="font-bold">{r.codigo_maquina}</span>
                                            </div>
                                        </td>
                                        <td>{r.horometro ? formatNumber(r.horometro) : '-'}</td>
                                        <td className="font-semibold text-amber-600">{r.galones}</td>
                                        <td>{r.precio_galon ? `S/ ${r.precio_galon.toFixed(2)}` : '-'}</td>
                                        <td className="font-bold text-green-600">{r.total ? `S/ ${r.total.toFixed(2)}` : '-'}</td>
                                        <td>{r.tipo_movimiento === 'ENTRADA' ? r.proveedor : r.operador || '-'}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                {puedeEditar(userRole, 'combustible') && (
                                                    <button onClick={() => openEditModal(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {puedeEliminar(userRole, 'combustible') && (
                                                    <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {formData.tipo_movimiento === 'ENTRADA' ? (
                                    <><ArrowDownCircle className="text-green-600" /> Abastecer Cisterna</>
                                ) : (
                                    <><ArrowUpCircle className="text-amber-600" /> Despachar Combustible</>
                                )}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Fecha *</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Galones *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input"
                                        value={formData.galones}
                                        onChange={(e) => setFormData({ ...formData, galones: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            {formData.tipo_movimiento === 'ENTRADA' ? (
                                // Campos para ENTRADA (abastecimiento cisterna)
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Precio por Galón (S/)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="input"
                                                value={formData.precio_galon}
                                                onChange={(e) => setFormData({ ...formData, precio_galon: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Total (S/)</label>
                                            <input
                                                type="number"
                                                className="input bg-gray-100"
                                                value={formData.total?.toFixed(2)}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Proveedor</label>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Ej: PETROPERU"
                                                value={formData.proveedor}
                                                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">N° Factura</label>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Ej: F001-00234"
                                                value={formData.numero_factura}
                                                onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Campos para SALIDA (despacho)
                                <>
                                    <div>
                                        <label className="label">Equipo *</label>
                                        <select
                                            className="input"
                                            value={formData.codigo_maquina}
                                            onChange={(e) => setFormData({ ...formData, codigo_maquina: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {EQUIPOS_MAESTRO.map(eq => (
                                                <option key={eq.codigo} value={eq.codigo}>
                                                    {eq.codigo} - {eq.tipo} {eq.modelo} ({eq.serie})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Horómetro</label>
                                            <input
                                                type="number"
                                                className="input"
                                                value={formData.horometro}
                                                onChange={(e) => setFormData({ ...formData, horometro: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Operador</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={formData.operador}
                                                onChange={(e) => setFormData({ ...formData, operador: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="label">Observaciones</label>
                                <textarea
                                    className="input"
                                    rows={2}
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
                            <button onClick={handleSave} className="btn btn-primary">
                                <Save size={18} />
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
