'use client';

import { useState, useEffect } from 'react';
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
    ChevronDown,
    Search,
    Plus,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatDate, calcularAlertaDocumento } from '@/lib/utils';
import { exportToExcel } from '@/lib/export';
import { useAuth } from '@/components/auth-provider';
import { puedeVer, puedeEditar, puedeExportar, puedeCrear, puedeEliminar } from '@/lib/permisos';
import { Role, CITV } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { EQUIPOS_MAESTRO } from '@/lib/equipos-data';

export default function CITVPage() {
    const [citv, setCitv] = useState<CITV[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<CITV | null>(null);
    const [filterCodigo, setFilterCodigo] = useState<string>('');
    const [showCodigoFilter, setShowCodigoFilter] = useState(false);
    const [searchCodigo, setSearchCodigo] = useState('');
    const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const userRole = profile?.rol as Role;

    const emptyForm = {
        codigo: '',
        tipo: '',
        modelo: '',
        placa_serie: '',
        empresa: 'JORGE LUIS VASQUEZ CUSMA',
        fecha_vencimiento: ''
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        // Wait for auth to finish loading before checking permissions or fetching
        if (authLoading) return;

        if (profile && !puedeVer(userRole, 'citv')) {
            router.push('/');
            return;
        }
        fetchData();
    }, [authLoading, profile, userRole, router]);

    async function fetchData() {
        setLoading(true);
        try {
            const supabase = createClient();
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('citv')
                .select('*')
                .order('fecha_vencimiento');

            if (error) {
                console.error('Error:', error);
            } else {
                setCitv(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setEditingItem(null);
        setFormData(emptyForm);
        setShowModal(true);
    }

    function openEditModal(item: CITV) {
        setEditingItem(item);
        setFormData({
            codigo: item.codigo || '',
            tipo: item.tipo || '',
            modelo: item.modelo || '',
            placa_serie: item.placa_serie || '',
            empresa: item.empresa || 'JORGE LUIS VASQUEZ CUSMA',
            fecha_vencimiento: item.fecha_vencimiento || ''
        });
        setShowModal(true);
    }

    function handleEquipoChange(codigo: string) {
        const equipo = EQUIPOS_MAESTRO.find(e => e.codigo === codigo);
        if (equipo) {
            setFormData({
                ...formData,
                codigo: equipo.codigo,
                tipo: equipo.tipo,
                modelo: equipo.modelo,
                placa_serie: equipo.serie
            });
        }
    }

    async function handleSave() {
        if (!formData.codigo || !formData.fecha_vencimiento) {
            setMensaje({ tipo: 'error', texto: 'Complete código y fecha de vencimiento' });
            return;
        }

        try {
            const supabase = createClient();
            if (!supabase) return;

            if (editingItem) {
                const { error } = await supabase
                    .from('citv')
                    .update(formData)
                    .eq('id', editingItem.id);

                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Revisión Técnica actualizada' });
            } else {
                const { error } = await supabase
                    .from('citv')
                    .insert([formData]);

                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Revisión Técnica agregada' });
            }

            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar';
            setMensaje({ tipo: 'error', texto: errorMessage });
        }
    }

    async function handleDelete(id: string, codigo: string) {
        if (!confirm(`¿Eliminar Revisión Técnica de ${codigo}?`)) return;

        try {
            const supabase = createClient();
            if (!supabase) return;

            const { error } = await supabase
                .from('citv')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setCitv(prev => prev.filter(c => c.id !== id));
            setMensaje({ tipo: 'success', texto: `Revisión Técnica de ${codigo} eliminada` });
        } catch (error) {
            console.error('Error:', error);
            setMensaje({ tipo: 'error', texto: 'Error al eliminar' });
        }
    }

    function handleExport() {
        const dataToExport = citvConEstado.map(c => ({
            'Código': c.codigo,
            'Tipo': c.tipo,
            'Modelo': c.modelo,
            'Placa/Serie': c.placa_serie,
            'Vencimiento': c.fecha_vencimiento,
            'Días Restantes': c.dias_restantes,
            'Estado': c.dias_restantes < 0 ? 'VENCIDO' : c.dias_restantes <= 30 ? 'PRÓXIMO' : 'VIGENTE'
        }));
        exportToExcel(dataToExport, 'CITV_' + new Date().toISOString().split('T')[0], 'CITV');
    }

    // Calcular días y estado para cada registro
    const citvConEstado = citv.map(c => {
        const { accion, diasRestantes, color } = calcularAlertaDocumento(c.fecha_vencimiento);
        return { ...c, dias_restantes: diasRestantes, accion_requerida: accion, color };
    }).sort((a, b) => a.dias_restantes - b.dias_restantes);

    // Filtrar por código
    const citvFiltrado = filterCodigo
        ? citvConEstado.filter(c => c.codigo === filterCodigo)
        : citvConEstado;

    const stats = {
        vencido: citvConEstado.filter(c => c.dias_restantes < 0).length,
        urgente: citvConEstado.filter(c => c.dias_restantes >= 0 && c.dias_restantes <= 7).length,
        proximo: citvConEstado.filter(c => c.dias_restantes > 7 && c.dias_restantes <= 30).length,
        vigente: citvConEstado.filter(c => c.dias_restantes > 30).length,
    };

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <ClipboardCheck className="text-purple-500" />
                        Revisiones Técnicas (CITV)
                    </h1>
                    <p className="text-gray-500 mt-1">Control de Inspecciones Técnicas Vehiculares</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={fetchData} className="btn btn-outline" title="Recargar">
                        <RefreshCw size={18} />
                    </button>
                    {puedeExportar(userRole, 'citv') && (
                        <button onClick={handleExport} className="btn btn-outline">
                            <Download size={18} />
                            Exportar
                        </button>
                    )}
                    {puedeCrear(userRole, 'citv') && (
                        <button onClick={openCreateModal} className="btn btn-primary">
                            <Plus size={18} />
                            Agregar CITV
                        </button>
                    )}
                </div>
            </div>

            {/* Mensaje */}
            {mensaje && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    {mensaje.texto}
                    <button onClick={() => setMensaje(null)} className="ml-auto"><X size={18} /></button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{stats.vencido}</p>
                            <p className="text-sm text-gray-500">Vencido</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Clock className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-600">{stats.urgente}</p>
                            <p className="text-sm text-gray-500">Urgente (≤7d)</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Calendar className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{stats.proximo}</p>
                            <p className="text-sm text-gray-500">Próximo (≤30d)</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{stats.vigente}</p>
                            <p className="text-sm text-gray-500">Vigente</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtro */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative sm:w-80">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Equipo</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowCodigoFilter(!showCodigoFilter)}
                                className="w-full input flex items-center justify-between text-left"
                            >
                                <span className={filterCodigo ? 'text-gray-800' : 'text-gray-400'}>
                                    {filterCodigo ? `${filterCodigo} - ${EQUIPOS_MAESTRO.find(e => e.codigo === filterCodigo)?.modelo || ''} (${EQUIPOS_MAESTRO.find(e => e.codigo === filterCodigo)?.serie || ''})` : 'Todos los equipos...'}
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
                                                placeholder="Buscar..."
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
                                                value={searchCodigo}
                                                onChange={(e) => setSearchCodigo(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-60">
                                        <button
                                            onClick={() => { setFilterCodigo(''); setShowCodigoFilter(false); }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${!filterCodigo ? 'bg-purple-50 text-purple-700 font-medium' : ''}`}
                                        >
                                            Todos
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
                                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${filterCodigo === eq.codigo ? 'bg-purple-50 text-purple-700 font-medium' : ''}`}
                                                >
                                                    <span className="font-medium">{eq.codigo}</span>
                                                    <span className="text-gray-500 ml-2">{eq.tipo} {eq.modelo}</span>
                                                    <span className="text-gray-400 ml-1">({eq.serie})</span>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {filterCodigo && (
                        <button
                            onClick={() => setFilterCodigo('')}
                            className="self-end px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                        >
                            <X size={16} /> Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Tipo</th>
                                <th>Modelo</th>
                                <th>Placa/Serie</th>
                                <th>Vencimiento</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {citvFiltrado.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        No hay registros de Revisiones Técnicas
                                    </td>
                                </tr>
                            ) : (
                                citvFiltrado.map((c) => (
                                    <tr key={c.id}>
                                        <td className="font-bold">{c.codigo}</td>
                                        <td>{c.tipo}</td>
                                        <td>{c.modelo}</td>
                                        <td>{c.placa_serie}</td>
                                        <td>{formatDate(c.fecha_vencimiento)}</td>
                                        <td>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.dias_restantes < 0 ? 'bg-red-100 text-red-800' :
                                                    c.dias_restantes <= 7 ? 'bg-orange-100 text-orange-800' :
                                                        c.dias_restantes <= 30 ? 'bg-amber-100 text-amber-800' :
                                                            'bg-green-100 text-green-800'
                                                }`}>
                                                {c.dias_restantes < 0 ? 'VENCIDO' :
                                                    c.dias_restantes <= 7 ? `${c.dias_restantes}d - URGENTE` :
                                                        c.dias_restantes <= 30 ? `${c.dias_restantes}d - PRÓXIMO` :
                                                            `${c.dias_restantes}d`}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {puedeEditar(userRole, 'citv') && (
                                                    <button
                                                        onClick={() => openEditModal(c)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {puedeEliminar(userRole, 'citv') && (
                                                    <button
                                                        onClick={() => handleDelete(c.id, c.codigo)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Eliminar"
                                                    >
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
                            <h2 className="text-xl font-bold">
                                {editingItem ? 'Editar Revisión Técnica' : 'Agregar Revisión Técnica'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="label">Seleccionar Equipo</label>
                                <select
                                    className="input"
                                    value={formData.codigo}
                                    onChange={(e) => handleEquipoChange(e.target.value)}
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
                                    <label className="label">Tipo</label>
                                    <input
                                        type="text"
                                        className="input bg-gray-50"
                                        value={formData.tipo}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="label">Modelo</label>
                                    <input
                                        type="text"
                                        className="input bg-gray-50"
                                        value={formData.modelo}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Placa / Serie</label>
                                <input
                                    type="text"
                                    className="input bg-gray-50"
                                    value={formData.placa_serie}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="label">Fecha de Vencimiento *</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.fecha_vencimiento}
                                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Empresa</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.empresa}
                                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
                            <button onClick={handleSave} className="btn btn-primary">
                                <Save size={18} />
                                {editingItem ? 'Guardar Cambios' : 'Agregar CITV'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
