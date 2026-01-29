'use client';

import { useState, useEffect, useRef } from 'react';
import {
    ClipboardCheck,
    AlertTriangle,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    X,
    Save,
    Download,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react';
import { fetchTable, updateRow } from '@/lib/api';
import { formatDate, calcularAlertaDocumento } from '@/lib/utils';
import { exportToExcel, formatCitvForExport } from '@/lib/export';
import { useAuth } from '@/components/auth-provider';
import { puedeVer, puedeEditar, puedeExportar } from '@/lib/permisos';
import { Role } from '@/lib/types';
import { useRouter } from 'next/navigation';

const DEMO_CITV = [
    { id: '1', codigo: 'VOL-01', tipo: 'VOLQUETE', modelo: 'ACTROS 3336K', placa_serie: 'WDB9302', empresa: 'JLMX VASQUEZ EJECUTORES E.I.R.L', fecha_vencimiento: '2026-02-20' },
    { id: '2', codigo: 'CIST-01', tipo: 'CISTERNA DE AGUA', modelo: 'FM', placa_serie: 'ADI-737', empresa: 'JORGE LUIS VASQUEZ CUSMA', fecha_vencimiento: '2026-05-15' },
    { id: '3', codigo: 'CIST-02', tipo: 'CISTERNA DE COMBUSTIBLE', modelo: 'FL', placa_serie: 'AED-892', empresa: 'JOMEX CONSTRUCTORA S.A.C', fecha_vencimiento: '2026-08-22' },
    { id: '4', codigo: 'VOL-02', tipo: 'VOLQUETE', modelo: 'FMX 440', placa_serie: 'ARE-156', empresa: 'JORGE LUIS VASQUEZ CUSMA', fecha_vencimiento: '2026-03-10' },
    { id: '5', codigo: 'CAM-01', tipo: 'CAMIONETA', modelo: 'RANGER XLT', placa_serie: 'AYZ-861', empresa: 'JORGE LUIS VASQUEZ CUSMA', fecha_vencimiento: '2026-07-05' },
];

export default function CITVPage() {
    const [citv, setCitv] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [newFecha, setNewFecha] = useState('');
    const [usingDemo, setUsingDemo] = useState(true);
    const [filterCodigo, setFilterCodigo] = useState<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { profile } = useAuth();
    const router = useRouter();
    const userRole = profile?.rol as Role;

    useEffect(() => {
        if (profile && !puedeVer(userRole, 'citv')) {
            router.push('/');
            return;
        }
        fetchData();
    }, [profile, userRole, router]);

    async function fetchData() {
        try {
            const data = await fetchTable<any>('citv', '&order=fecha_vencimiento');
            if (data?.length > 0) {
                setUsingDemo(false);
                setCitv(data);
            } else {
                setUsingDemo(true);
                setCitv(DEMO_CITV);
            }
        } catch {
            setUsingDemo(true);
            setCitv(DEMO_CITV);
        } finally {
            setLoading(false);
        }
    }

    const citvConEstado = citv.map(c => {
        const { accion, diasRestantes, color } = calcularAlertaDocumento(c.fecha_vencimiento);
        return { ...c, dias_restantes: diasRestantes, accion_requerida: accion, color };
    }).sort((a, b) => a.dias_restantes - b.dias_restantes);

    // Obtener códigos únicos para el filtro deslizable
    const codigosUnicos = [...new Set(citv.map(c => c.codigo))].sort();

    // Filtrar por código
    const citvFiltrado = filterCodigo
        ? citvConEstado.filter(c => c.codigo === filterCodigo)
        : citvConEstado;

    // Funciones para scroll horizontal
    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };
    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    const stats = {
        vencido: citvConEstado.filter(c => c.dias_restantes < 0).length,
        urgente: citvConEstado.filter(c => c.dias_restantes >= 0 && c.dias_restantes <= 7).length,
        proximo: citvConEstado.filter(c => c.dias_restantes > 7 && c.dias_restantes <= 30).length,
        vigente: citvConEstado.filter(c => c.dias_restantes > 30).length,
    };

    function handleExport() {
        const dataToExport = formatCitvForExport(citvConEstado);
        exportToExcel(dataToExport, 'CITV_' + new Date().toISOString().split('T')[0], 'Revisiones_Tecnicas');
    }

    function openRenovarModal(item: any) {
        setSelectedItem(item);
        const fechaActual = new Date(item.fecha_vencimiento);
        fechaActual.setFullYear(fechaActual.getFullYear() + 1);
        setNewFecha(fechaActual.toISOString().split('T')[0]);
        setShowModal(true);
    }

    async function renovarCitv() {
        if (usingDemo) {
            setCitv(prev => prev.map(c =>
                c.id === selectedItem.id
                    ? { ...c, fecha_vencimiento: newFecha }
                    : c
            ));
            setShowModal(false);
            return;
        }

        try {
            await updateRow('citv', selectedItem.id, { fecha_vencimiento: newFecha });
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
                    <h1 className="text-3xl font-bold text-gray-800">Revisiones Técnicas (CITV)</h1>
                    <p className="text-gray-500 mt-1">Control de Inspecciones Técnicas Vehiculares</p>
                </div>
                <div className="flex items-center gap-3">
                    {puedeExportar(userRole, 'citv') && (
                        <button onClick={handleExport} className="btn btn-outline">
                            <Download size={18} />
                            Exportar Excel
                        </button>
                    )}
                    {usingDemo && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium">
                            ⚠️ Modo Demo
                        </span>
                    )}
                </div>
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

            {/* Barra de búsqueda deslizable por código */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Search size={18} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Filtrar por Código:</span>
                    {filterCodigo && (
                        <button
                            onClick={() => setFilterCodigo('')}
                            className="ml-auto text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <X size={14} /> Limpiar
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={scrollLeft}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div
                        ref={scrollRef}
                        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <button
                            onClick={() => setFilterCodigo('')}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all shrink-0 ${
                                !filterCodigo
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Todos
                        </button>
                        {codigosUnicos.map(codigo => (
                            <button
                                key={codigo}
                                onClick={() => setFilterCodigo(codigo)}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all shrink-0 ${
                                    filterCodigo === codigo
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {codigo}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={scrollRight}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">
                        {filterCodigo ? `CITV - ${filterCodigo}` : 'Listado de Revisiones Técnicas'}
                    </h2>
                    {filterCodigo && (
                        <button
                            onClick={() => setFilterCodigo('')}
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
                                <th>Placa/Serie</th>
                                <th>Empresa</th>
                                <th>Vencimiento</th>
                                <th>Días</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {citvFiltrado.map((c) => (
                                <tr key={c.id}>
                                    <td className="font-semibold">{c.codigo}</td>
                                    <td>{c.tipo}</td>
                                    <td>{c.modelo}</td>
                                    <td>{c.placa_serie}</td>
                                    <td className="max-w-40 truncate" title={c.empresa}>{c.empresa}</td>
                                    <td>{formatDate(c.fecha_vencimiento)}</td>
                                    <td>
                                        <span
                                            className="font-bold"
                                            style={{ color: c.color }}
                                        >
                                            {c.dias_restantes < 0 ? `(${Math.abs(c.dias_restantes)}) vencido` : c.dias_restantes}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                                            style={{ backgroundColor: c.color }}
                                        >
                                            {c.accion_requerida}
                                        </span>
                                    </td>
                                    <td>
                                        {puedeEditar(userRole, 'citv') && (
                                            <button
                                                onClick={() => openRenovarModal(c)}
                                                className="btn btn-primary py-2 px-3 text-sm"
                                            >
                                                <Edit size={16} />
                                                Actualizar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedItem && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">Actualizar CITV</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <p className="text-5xl mb-2">🔍</p>
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
                            <button onClick={renovarCitv} className="btn btn-primary">
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
