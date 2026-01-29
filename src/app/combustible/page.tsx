'use client';

import { useState, useEffect } from 'react';
import {
    Fuel,
    Plus,
    Search,
    Download,
    TrendingUp,
    Calendar,
    Truck,
    DollarSign,
    Save,
    X,
    Edit,
    Trash2
} from 'lucide-react';
import { fetchTable, insertRow, updateRow, deleteRow } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';
import { exportToExcel } from '@/lib/export';

interface RegistroCombustible {
    id: string;
    fecha: string;
    codigo_maquina: string;
    tipo_maquina?: string;
    horometro: number;
    galones: number;
    precio_galon: number;
    total: number;
    proveedor?: string;
    numero_factura?: string;
    operador?: string;
    observaciones?: string;
    created_at?: string;
}

const DEMO_COMBUSTIBLE: RegistroCombustible[] = [
    { id: '1', fecha: '2026-01-28', codigo_maquina: 'EXC-01', tipo_maquina: 'EXCAVADORA', horometro: 15612, galones: 45, precio_galon: 14.50, total: 652.50, proveedor: 'GRIFO CENTRAL', operador: 'JOSE ABANTO' },
    { id: '2', fecha: '2026-01-27', codigo_maquina: 'VOL-01', tipo_maquina: 'VOLQUETE', horometro: 45000, galones: 80, precio_galon: 14.50, total: 1160.00, proveedor: 'GRIFO CENTRAL', operador: 'MIGUEL TORRES' },
    { id: '3', fecha: '2026-01-27', codigo_maquina: 'MOT-01', tipo_maquina: 'MOTONIVELADORA', horometro: 12420, galones: 35, precio_galon: 14.50, total: 507.50, proveedor: 'REPSOL', operador: 'CARLOS RUIZ' },
    { id: '4', fecha: '2026-01-26', codigo_maquina: 'CAR-01', tipo_maquina: 'CARGADOR FRONTAL', horometro: 8900, galones: 50, precio_galon: 14.30, total: 715.00, proveedor: 'GRIFO CENTRAL', operador: 'PEDRO SILVA' },
    { id: '5', fecha: '2026-01-25', codigo_maquina: 'CIST-01', tipo_maquina: 'CISTERNA DE AGUA', horometro: 23500, galones: 60, precio_galon: 14.50, total: 870.00, proveedor: 'PECSA', operador: 'JORG VASQUEZ' },
];

export default function CombustiblePage() {
    const [registros, setRegistros] = useState<RegistroCombustible[]>(DEMO_COMBUSTIBLE);
    const [maquinaria, setMaquinaria] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<RegistroCombustible | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMes, setFilterMes] = useState('');
    const [usingDemo, setUsingDemo] = useState(true);

    const emptyForm: Partial<RegistroCombustible> = {
        fecha: new Date().toISOString().split('T')[0],
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
        fetchData();
    }, []);

    useEffect(() => {
        // Calcular total automáticamente
        const total = (formData.galones || 0) * (formData.precio_galon || 0);
        setFormData(prev => ({ ...prev, total }));
    }, [formData.galones, formData.precio_galon]);

    async function fetchData() {
        try {
            const [combustibleData, maquinariaData] = await Promise.all([
                fetchTable<RegistroCombustible>('combustible', '&order=fecha.desc'),
                fetchTable<any>('maquinaria', '&order=codigo')
            ]);

            if (combustibleData?.length > 0) {
                setRegistros(combustibleData);
                setUsingDemo(false);
            }

            if (maquinariaData?.length > 0) {
                setMaquinaria(maquinariaData);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setFormData(emptyForm);
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
                } else {
                    await insertRow('combustible', dataToSave);
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

        if (usingDemo) {
            setRegistros(prev => prev.filter(r => r.id !== id));
        } else {
            await deleteRow('combustible', id);
            fetchData();
        }
    }

    function handleExport() {
        const data = registros.map(r => ({
            'Fecha': r.fecha,
            'Código': r.codigo_maquina,
            'Tipo': r.tipo_maquina || '',
            'Horómetro': r.horometro,
            'Galones': r.galones,
            'Precio/Galón': r.precio_galon,
            'Total S/': r.total,
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
        return matchSearch && matchMes;
    });

    // Estadísticas
    const stats = {
        totalGalones: filteredRegistros.reduce((sum, r) => sum + r.galones, 0),
        totalSoles: filteredRegistros.reduce((sum, r) => sum + r.total, 0),
        promedioGalon: filteredRegistros.length > 0
            ? filteredRegistros.reduce((sum, r) => sum + r.precio_galon, 0) / filteredRegistros.length
            : 0,
        registros: filteredRegistros.length
    };

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
                    <p className="text-gray-500 mt-1">Registro de consumo de combustible</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="btn btn-outline">
                        <Download size={18} />
                        Exportar
                    </button>
                    {usingDemo && <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm">Demo</span>}
                    <button onClick={openCreateModal} className="btn btn-primary">
                        <Plus size={20} />
                        Nuevo Registro
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Fuel className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{formatNumber(stats.totalGalones)}</p>
                            <p className="text-sm text-gray-500">Galones</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">S/ {formatNumber(stats.totalSoles)}</p>
                            <p className="text-sm text-gray-500">Total Gastado</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">S/ {stats.promedioGalon.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Precio Promedio</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Calendar className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{stats.registros}</p>
                            <p className="text-sm text-gray-500">Registros</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por código u operador..."
                            className="input pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <input
                        type="month"
                        className="input sm:w-48"
                        value={filterMes}
                        onChange={(e) => setFilterMes(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Código</th>
                                <th>Horómetro</th>
                                <th>Galones</th>
                                <th>Precio</th>
                                <th>Total</th>
                                <th>Proveedor</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRegistros.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No hay registros</td></tr>
                            ) : (
                                filteredRegistros.map((r) => (
                                    <tr key={r.id}>
                                        <td>{new Date(r.fecha).toLocaleDateString('es-PE')}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span>{ICONOS_MAQUINARIA[r.tipo_maquina as TipoMaquinaria] || '🚜'}</span>
                                                <span className="font-bold">{r.codigo_maquina}</span>
                                            </div>
                                        </td>
                                        <td>{formatNumber(r.horometro)}</td>
                                        <td className="font-semibold text-amber-600">{r.galones}</td>
                                        <td>S/ {r.precio_galon.toFixed(2)}</td>
                                        <td className="font-bold text-green-600">S/ {r.total.toFixed(2)}</td>
                                        <td>{r.proveedor || '-'}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditModal(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={18} />
                                                </button>
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
                            <h2 className="text-xl font-bold">{editingItem ? 'Editar Registro' : 'Nuevo Registro'}</h2>
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
                                    <label className="label">Código Máquina *</label>
                                    <select
                                        className="input"
                                        value={formData.codigo_maquina}
                                        onChange={(e) => setFormData({ ...formData, codigo_maquina: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {maquinaria.map(m => (
                                            <option key={m.id} value={m.codigo}>{m.codigo} - {m.tipo}</option>
                                        ))}
                                        {maquinaria.length === 0 && DEMO_COMBUSTIBLE.map(d => (
                                            <option key={d.codigo_maquina} value={d.codigo_maquina}>{d.codigo_maquina}</option>
                                        ))}
                                    </select>
                                </div>
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
                                        value={formData.proveedor}
                                        onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">N° Factura</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.numero_factura}
                                        onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                                    />
                                </div>
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
