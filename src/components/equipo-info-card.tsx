'use client';

import { useState, useEffect } from 'react';
import {
    Truck,
    Wrench,
    FileCheck,
    ClipboardCheck,
    Filter,
    Clock,
    AlertTriangle,
    CheckCircle,
    Calendar,
    Loader2,
    X
} from 'lucide-react';
import { getEquiposVinculados } from '@/lib/api';
import { ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';
import { formatNumber, formatDate, calcularAlertaDocumento } from '@/lib/utils';

interface EquipoInfoCardProps {
    codigo: string;
    onClose?: () => void;
}

export default function EquipoInfoCard({ codigo, onClose }: EquipoInfoCardProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        maquinaria: any | null;
        mantenimiento: any | null;
        soat: any | null;
        citv: any | null;
        filtros: any | null;
    } | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const result = await getEquiposVinculados(codigo);
            setData(result);
            setLoading(false);
        }
        if (codigo) {
            loadData();
        }
    }, [codigo]);

    if (loading) {
        return (
            <div className="card p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
            </div>
        );
    }

    if (!data || !data.maquinaria) {
        return (
            <div className="card p-6">
                <div className="text-center py-8 text-gray-500">
                    <AlertTriangle size={48} className="mx-auto mb-2 text-amber-400" />
                    <p>Equipo no encontrado: {codigo}</p>
                </div>
            </div>
        );
    }

    const { maquinaria, mantenimiento, soat, citv } = data;

    // Calcular alertas
    const soatAlerta = soat ? calcularAlertaDocumento(soat.fecha_vencimiento) : null;
    const citvAlerta = citv ? calcularAlertaDocumento(citv.fecha_vencimiento) : null;

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">
                            {ICONOS_MAQUINARIA[maquinaria.tipo as TipoMaquinaria] || ''}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{maquinaria.codigo}</h2>
                            <p className="text-slate-300">{maquinaria.tipo} - {maquinaria.modelo}</p>
                            <p className="text-slate-400 text-sm">{maquinaria.marca} | Serie: {maquinaria.serie}</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Estado y Horas */}
                <div className="mt-4 flex gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        maquinaria.estado === 'OPERATIVO' ? 'bg-green-500/20 text-green-300' :
                        maquinaria.estado === 'EN MANTENIMIENTO' ? 'bg-amber-500/20 text-amber-300' :
                        maquinaria.estado === 'INOPERATIVO' ? 'bg-red-500/20 text-red-300' :
                        'bg-blue-500/20 text-blue-300'
                    }`}>
                        {maquinaria.estado}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300">
                        <Clock size={16} />
                        {formatNumber(maquinaria.horas_actuales)} horas
                    </span>
                </div>
            </div>

            {/* Información vinculada */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mantenimiento */}
                <div className="border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Wrench className="text-blue-500" size={20} />
                        <h3 className="font-semibold text-gray-800">Mantenimiento</h3>
                    </div>
                    {mantenimiento ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Último:</span>
                                <span className="font-medium">{formatNumber(mantenimiento.mantenimiento_ultimo)} h</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Próximo:</span>
                                <span className="font-medium">{formatNumber(mantenimiento.mantenimiento_proximo)} h</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Diferencia:</span>
                                <span className={`font-bold ${
                                    mantenimiento.diferencia_horas <= 0 ? 'text-red-600' :
                                    mantenimiento.diferencia_horas <= 50 ? 'text-red-500' :
                                    mantenimiento.diferencia_horas <= 100 ? 'text-amber-500' :
                                    'text-green-500'
                                }`}>
                                    {mantenimiento.diferencia_horas <= 0 ? 'VENCIDO' : `${mantenimiento.diferencia_horas} h`}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Sin registro de mantenimiento</p>
                    )}
                </div>

                {/* SOAT */}
                <div className="border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <FileCheck className="text-green-500" size={20} />
                        <h3 className="font-semibold text-gray-800">SOAT</h3>
                    </div>
                    {soat && soatAlerta ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Vencimiento:</span>
                                <span className="font-medium">{formatDate(soat.fecha_vencimiento)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Estado:</span>
                                <span
                                    className="font-bold text-xs px-2 py-1 rounded-full"
                                    style={{
                                        backgroundColor: soatAlerta.diasRestantes < 0 ? '#fee2e2' :
                                                        soatAlerta.diasRestantes <= 7 ? '#fef3c7' :
                                                        soatAlerta.diasRestantes <= 30 ? '#dbeafe' : '#dcfce7',
                                        color: soatAlerta.color
                                    }}
                                >
                                    {soatAlerta.diasRestantes < 0 ? 'VENCIDO' : `${soatAlerta.diasRestantes} días`}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Sin registro de SOAT</p>
                    )}
                </div>

                {/* CITV */}
                <div className="border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <ClipboardCheck className="text-purple-500" size={20} />
                        <h3 className="font-semibold text-gray-800">CITV</h3>
                    </div>
                    {citv && citvAlerta ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Vencimiento:</span>
                                <span className="font-medium">{formatDate(citv.fecha_vencimiento)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Estado:</span>
                                <span
                                    className="font-bold text-xs px-2 py-1 rounded-full"
                                    style={{
                                        backgroundColor: citvAlerta.diasRestantes < 0 ? '#fee2e2' :
                                                        citvAlerta.diasRestantes <= 7 ? '#fef3c7' :
                                                        citvAlerta.diasRestantes <= 30 ? '#dbeafe' : '#dcfce7',
                                        color: citvAlerta.color
                                    }}
                                >
                                    {citvAlerta.diasRestantes < 0 ? 'VENCIDO' : `${citvAlerta.diasRestantes} días`}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Sin registro de CITV</p>
                    )}
                </div>

                {/* Info adicional */}
                <div className="border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Truck className="text-slate-500" size={20} />
                        <h3 className="font-semibold text-gray-800">Información</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Operador:</span>
                            <span className="font-medium">{maquinaria.operador || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tramo:</span>
                            <span className="font-medium">{maquinaria.tramo || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Empresa:</span>
                            <span className="font-medium text-xs">{maquinaria.empresa || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
