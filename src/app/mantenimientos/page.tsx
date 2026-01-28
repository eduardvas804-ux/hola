'use client';

import { useState, useEffect } from 'react';
import {
    Wrench,
    AlertTriangle,
    CheckCircle,
    Clock,
    Plus,
    Save,
    X
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatNumber, formatDate, calcularAlertaMantenimiento, getColorAlertaMantenimiento } from '@/lib/utils';
import { EstadoAlerta, ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';

const DEMO_MANTENIMIENTOS = [
    { id: '1', codigo_maquina: 'EXC-01', tipo: 'EXCAVADORA', modelo: '320D', mantenimiento_ultimo: 15362, mantenimiento_proximo: 15612, hora_actual: 15612, diferencia_horas: 0, operador: 'JOSE ABANTO', tramo: 'CVP KM 25', tipo_mantenimiento: 'PREVENTIVO 250H', estado_alerta: 'VENCIDO' },
    { id: '2', codigo_maquina: 'MOT-01', tipo: 'MOTONIVELADORA', modelo: '135H', mantenimiento_ultimo: 12200, mantenimiento_proximo: 12450, hora_actual: 12420, diferencia_horas: 30, operador: 'CARLOS RUIZ', tramo: 'TONGOT', tipo_mantenimiento: 'PREVENTIVO 250H', estado_alerta: 'URGENTE' },
    { id: '3', codigo_maquina: 'CAR-01', tipo: 'CARGADOR FRONTAL', modelo: '950H', mantenimiento_ultimo: 8650, mantenimiento_proximo: 8900, hora_actual: 8830, diferencia_horas: 70, operador: 'PEDRO SILVA', tramo: 'ALMACEN', tipo_mantenimiento: 'PREVENTIVO 250H', estado_alerta: 'PROXIMO' },
    { id: '4', codigo_maquina: 'VOL-01', tipo: 'VOLQUETE', modelo: 'ACTROS', mantenimiento_ultimo: 44750, mantenimiento_proximo: 45000, hora_actual: 44820, diferencia_horas: 180, operador: 'MIGUEL TORRES', tramo: 'CVP KM 30', tipo_mantenimiento: 'PREVENTIVO 250H', estado_alerta: 'EN REGLA' },
    { id: '5', codigo_maquina: 'CIST-01', tipo: 'CISTERNA DE AGUA', modelo: 'FM', mantenimiento_ultimo: 23250, mantenimiento_proximo: 23500, hora_actual: 23450, diferencia_horas: 50, operador: 'JORG VASQUEZ', tramo: 'AV BAMBAMARCA', tipo_mantenimiento: 'PREVENTIVO 250H', estado_alerta: 'URGENTE' },
    { id: '6', codigo_maquina: 'RET-01', tipo: 'RETROEXCAVADORA', modelo: '420F', mantenimiento_ultimo: 9550, mantenimiento_proximo: 9800, hora_actual: 9680, diferencia_horas: 120, operador: 'LUIS MENDEZ', tramo: 'PROYECTO NORTE', tipo_mantenimiento: 'PREVENTIVO 250H', estado_alerta: 'EN REGLA' },
];

const TIPOS_MANTENIMIENTO = ['PREVENTIVO 250H', 'PREVENTIVO 500H', 'PREVENTIVO 1000H', 'CORRECTIVO'];

export default function MantenimientosPage() {
    const [mantenimientos, setMantenimientos] = useState(DEMO_MANTENIMIENTOS);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [filterEstado, setFilterEstado] = useState<string>('');
    const [usingDemo, setUsingDemo] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const supabase = createClient();
            const { data, error } = await supabase.from('mantenimientos').select('*').order('diferencia_horas');

            if (error || !data?.length) {
                setUsingDemo(true);
            } else {
                setMantenimientos(data);
                setUsingDemo(false);
            }
        } catch {
            setUsingDemo(true);
        } finally {
            setLoading(false);
        }
    }

    const filteredData = filterEstado
        ? mantenimientos.filter(m => m.estado_alerta === filterEstado)
        : mantenimientos;

    const stats = {
        vencido: mantenimientos.filter(m => m.estado_alerta === 'VENCIDO').length,
        urgente: mantenimientos.filter(m => m.estado_alerta === 'URGENTE').length,
        proximo: mantenimientos.filter(m => m.estado_alerta === 'PROXIMO').length,
        enRegla: mantenimientos.filter(m => m.estado_alerta === 'EN REGLA').length,
    };

    function openRegisterModal(item: any) {
        setSelectedItem(item);
        setShowModal(true);
    }

    async function registrarMantenimiento() {
        if (!selectedItem) return;

        const nuevoMantenimiento = {
            ...selectedItem,
            mantenimiento_ultimo: selectedItem.hora_actual,
            mantenimiento_proximo: selectedItem.hora_actual + 250,
            diferencia_horas: 250,
            estado_alerta: 'EN REGLA',
        };

        if (usingDemo) {
            setMantenimientos(prev => prev.map(m =>
                m.id === selectedItem.id ? nuevoMantenimiento : m
            ));
            setShowModal(false);
            return;
        }

        try {
            const supabase = createClient();
            await supabase.from('mantenimientos')
                .update(nuevoMantenimiento)
                .eq('id', selectedItem.id);
            fetchData();
            setShowModal(false);
        } catch (error) {
            console.error('Error:', error);
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
                    <h1 className="text-3xl font-bold text-gray-800">Control de Mantenimientos</h1>
                    <p className="text-gray-500 mt-1">Monitorea el estado de mantenimiento de tu flota</p>
                </div>
                {usingDemo && (
                    <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium">
                        ⚠️ Modo Demo
                    </span>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                    onClick={() => setFilterEstado(filterEstado === 'VENCIDO' ? '' : 'VENCIDO')}
                    className={`card p-5 text-left transition-all ${filterEstado === 'VENCIDO' ? 'ring-2 ring-red-500' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                            <AlertTriangle className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Vencido</p>
                            <p className="text-3xl font-bold text-red-600">{stats.vencido}</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setFilterEstado(filterEstado === 'URGENTE' ? '' : 'URGENTE')}
                    className={`card p-5 text-left transition-all ${filterEstado === 'URGENTE' ? 'ring-2 ring-red-400' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
                            <Clock className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Urgente (≤50h)</p>
                            <p className="text-3xl font-bold text-red-500">{stats.urgente}</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setFilterEstado(filterEstado === 'PROXIMO' ? '' : 'PROXIMO')}
                    className={`card p-5 text-left transition-all ${filterEstado === 'PROXIMO' ? 'ring-2 ring-amber-500' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                            <Wrench className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Próximo (51-100h)</p>
                            <p className="text-3xl font-bold text-amber-500">{stats.proximo}</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setFilterEstado(filterEstado === 'EN REGLA' ? '' : 'EN REGLA')}
                    className={`card p-5 text-left transition-all ${filterEstado === 'EN REGLA' ? 'ring-2 ring-green-500' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                            <CheckCircle className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">En Regla (&gt;100h)</p>
                            <p className="text-3xl font-bold text-green-500">{stats.enRegla}</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">
                        {filterEstado ? `Equipos - ${filterEstado}` : 'Todos los Equipos'}
                    </h2>
                    {filterEstado && (
                        <button
                            onClick={() => setFilterEstado('')}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Ver todos
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Tipo</th>
                                <th>Modelo</th>
                                <th>Operador</th>
                                <th>Último Mtto</th>
                                <th>Próximo Mtto</th>
                                <th>Hora Actual</th>
                                <th>Diferencia</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((m) => (
                                <tr key={m.id}>
                                    <td className="font-semibold">{m.codigo_maquina}</td>
                                    <td>
                                        <span className="flex items-center gap-2">
                                            <span className="text-xl">{ICONOS_MAQUINARIA[m.tipo as TipoMaquinaria] || '🔧'}</span>
                                            {m.tipo}
                                        </span>
                                    </td>
                                    <td>{m.modelo}</td>
                                    <td>{m.operador}</td>
                                    <td>{formatNumber(m.mantenimiento_ultimo)} h</td>
                                    <td>{formatNumber(m.mantenimiento_proximo)} h</td>
                                    <td className="font-medium">{formatNumber(m.hora_actual)} h</td>
                                    <td>
                                        <span
                                            className="font-bold"
                                            style={{ color: getColorAlertaMantenimiento(m.estado_alerta as EstadoAlerta) }}
                                        >
                                            {m.diferencia_horas <= 0 ? 'VENCIDO' : `${formatNumber(m.diferencia_horas)} h`}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${m.estado_alerta.toLowerCase().replace(' ', '-')}`}>
                                            {m.estado_alerta}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => openRegisterModal(m)}
                                            className="btn btn-secondary py-2 px-3 text-sm"
                                        >
                                            <Wrench size={16} />
                                            Registrar Mtto
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Registrar Mantenimiento */}
            {showModal && selectedItem && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">Registrar Mantenimiento</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <p className="text-5xl mb-2">{ICONOS_MAQUINARIA[selectedItem.tipo as TipoMaquinaria] || '🔧'}</p>
                                <p className="font-bold text-xl text-gray-800">{selectedItem.codigo_maquina}</p>
                                <p className="text-gray-500">{selectedItem.tipo} - {selectedItem.modelo}</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Horómetro actual:</span>
                                    <span className="font-bold">{formatNumber(selectedItem.hora_actual)} h</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Último mantenimiento:</span>
                                    <span className="font-medium">{formatNumber(selectedItem.mantenimiento_ultimo)} h</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Operador:</span>
                                    <span className="font-medium">{selectedItem.operador}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ubicación:</span>
                                    <span className="font-medium">{selectedItem.tramo}</span>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                <p className="text-sm text-green-700 mb-2">Al registrar el mantenimiento:</p>
                                <ul className="text-sm text-green-600 space-y-1">
                                    <li>✓ Último mantenimiento = {formatNumber(selectedItem.hora_actual)} h (actual)</li>
                                    <li>✓ Próximo mantenimiento = {formatNumber(selectedItem.hora_actual + 250)} h (+250h)</li>
                                    <li>✓ Estado cambiará a "EN REGLA"</li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="btn btn-outline">
                                Cancelar
                            </button>
                            <button onClick={registrarMantenimiento} className="btn btn-secondary">
                                <Save size={18} />
                                Confirmar Mantenimiento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
