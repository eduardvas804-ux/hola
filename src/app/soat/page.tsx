'use client';

import { useState, useEffect } from 'react';
import {
    FileCheck,
    AlertTriangle,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    X,
    Save
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatDate, calcularAlertaDocumento } from '@/lib/utils';

const DEMO_SOAT = [
    { id: '1', codigo: 'VOL-01', tipo: 'VOLQUETE', modelo: 'ACTROS 3336K', placa_serie: 'WDB9302', empresa: 'JLMX VASQUEZ EJECUTORES E.I.R.L', fecha_vencimiento: '2026-02-10' },
    { id: '2', codigo: 'CAM-01', tipo: 'CAMIONETA', modelo: 'RANGER XLT', placa_serie: 'AYZ-861', empresa: 'JORGE LUIS VASQUEZ CUSMA', fecha_vencimiento: '2026-02-05' },
    { id: '3', codigo: 'CIST-01', tipo: 'CISTERNA DE AGUA', modelo: 'FM', placa_serie: 'ADI-737', empresa: 'JORGE LUIS VASQUEZ CUSMA', fecha_vencimiento: '2026-04-15' },
    { id: '4', codigo: 'CIST-02', tipo: 'CISTERNA DE COMBUSTIBLE', modelo: 'FL', placa_serie: 'AED-892', empresa: 'JOMEX CONSTRUCTORA S.A.C', fecha_vencimiento: '2026-05-20' },
    { id: '5', codigo: 'VOL-02', tipo: 'VOLQUETE', modelo: 'FMX 440', placa_serie: 'ARE-156', empresa: 'JORGE LUIS VASQUEZ CUSMA', fecha_vencimiento: '2026-06-18' },
];

export default function SOATPage() {
    const [soat, setSoat] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [newFecha, setNewFecha] = useState('');
    const [usingDemo, setUsingDemo] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const supabase = createClient();
            const { data, error } = await supabase.from('soat').select('*').order('fecha_vencimiento');

            if (error || !data?.length) {
                setUsingDemo(true);
                setSoat(DEMO_SOAT);
            } else {
                setUsingDemo(false);
                setSoat(data);
            }
        } catch {
            setUsingDemo(true);
            setSoat(DEMO_SOAT);
        } finally {
            setLoading(false);
        }
    }

    // Calcular días y estado para cada registro
    const soatConEstado = soat.map(s => {
        const { accion, diasRestantes, color } = calcularAlertaDocumento(s.fecha_vencimiento);
        return { ...s, dias_restantes: diasRestantes, accion_requerida: accion, color };
    }).sort((a, b) => a.dias_restantes - b.dias_restantes);

    const stats = {
        vencido: soatConEstado.filter(s => s.dias_restantes < 0).length,
        urgente: soatConEstado.filter(s => s.dias_restantes >= 0 && s.dias_restantes <= 7).length,
        proximo: soatConEstado.filter(s => s.dias_restantes > 7 && s.dias_restantes <= 30).length,
        vigente: soatConEstado.filter(s => s.dias_restantes > 30).length,
    };

    function openRenovarModal(item: any) {
        setSelectedItem(item);
        // Calcular nueva fecha + 1 año
        const fechaActual = new Date(item.fecha_vencimiento);
        fechaActual.setFullYear(fechaActual.getFullYear() + 1);
        setNewFecha(fechaActual.toISOString().split('T')[0]);
        setShowModal(true);
    }

    async function renovarSoat() {
        if (usingDemo) {
            setSoat(prev => prev.map(s =>
                s.id === selectedItem.id
                    ? { ...s, fecha_vencimiento: newFecha }
                    : s
            ));
            setShowModal(false);
            return;
        }

        try {
            const supabase = createClient();
            await supabase.from('soat')
                .update({ fecha_vencimiento: newFecha })
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
                    <h1 className="text-3xl font-bold text-gray-800">Control de SOAT</h1>
                    <p className="text-gray-500 mt-1">Seguimiento de Seguros Obligatorios de Accidentes de Tránsito</p>
                </div>
                {usingDemo && (
                    <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium">
                        ⚠️ Modo Demo
                    </span>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                            <AlertTriangle className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Vencido</p>
                            <p className="text-3xl font-bold text-red-600">{stats.vencido}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
                            <Clock className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Urgente (≤7 días)</p>
                            <p className="text-3xl font-bold text-red-500">{stats.urgente}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                            <Calendar className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Próximo (≤30 días)</p>
                            <p className="text-3xl font-bold text-amber-500">{stats.proximo}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                            <CheckCircle className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Vigente</p>
                            <p className="text-3xl font-bold text-green-500">{stats.vigente}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Listado de SOAT</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Tipo</th>
                                <th>Modelo</th>
                                <th>Placa/Serie</th>
                                <th>Empresa</th>
                                <th>Vencimiento</th>
                                <th>Días</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {soatConEstado.map((s) => (
                                <tr key={s.id}>
                                    <td className="font-semibold">{s.codigo}</td>
                                    <td>{s.tipo}</td>
                                    <td>{s.modelo}</td>
                                    <td>{s.placa_serie}</td>
                                    <td className="max-w-40 truncate" title={s.empresa}>{s.empresa}</td>
                                    <td>{formatDate(s.fecha_vencimiento)}</td>
                                    <td>
                                        <span
                                            className="font-bold"
                                            style={{ color: s.color }}
                                        >
                                            {s.dias_restantes < 0 ? `(${Math.abs(s.dias_restantes)}) vencido` : s.dias_restantes}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                                            style={{ backgroundColor: s.color }}
                                        >
                                            {s.accion_requerida}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => openRenovarModal(s)}
                                            className="btn btn-primary py-2 px-3 text-sm"
                                        >
                                            <Edit size={16} />
                                            Renovar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Renovar */}
            {showModal && selectedItem && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">Renovar SOAT</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <p className="text-5xl mb-2">📋</p>
                                <p className="font-bold text-xl text-gray-800">{selectedItem.codigo}</p>
                                <p className="text-gray-500">{selectedItem.tipo} - {selectedItem.placa_serie}</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <p className="text-sm text-gray-500">Vencimiento actual</p>
                                <p className="text-lg font-bold text-gray-800">{formatDate(selectedItem.fecha_vencimiento)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nueva fecha de vencimiento</label>
                                <input
                                    type="date"
                                    className="input text-lg"
                                    value={newFecha}
                                    onChange={e => setNewFecha(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="btn btn-outline">
                                Cancelar
                            </button>
                            <button onClick={renovarSoat} className="btn btn-primary">
                                <Save size={18} />
                                Guardar Renovación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
