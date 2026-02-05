'use client';

import { useState, useEffect } from 'react';
import {
    Wrench,
    AlertTriangle,
    CheckCircle,
    Clock,
    Save,
    X,
    Download,
    Pencil,
    ChevronDown,
    Search
} from 'lucide-react';
import { fetchTable, updateRow, registrarCambio } from '@/lib/api';
import { formatNumber, getColorAlertaMantenimiento } from '@/lib/utils';
import { EstadoAlerta, ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';
import { exportToExcel, formatMantenimientosForExport } from '@/lib/export';
import { useAuth } from '@/components/auth-provider';
import { puedeVer, puedeEditar, puedeExportar } from '@/lib/permisos';
import { Role } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { getSeriePorCodigo, getCodigoConSerie } from '@/lib/equipos-data';
import EquipoInfoCard from '@/components/equipo-info-card';

// Tipo para los mantenimientos mostrados
interface MantenimientoDisplay {
    id: string;
    codigo_maquina: string;
    tipo: string;
    modelo: string;
    mantenimiento_ultimo: number;
    mantenimiento_proximo: number;
    hora_actual: number;
    diferencia_horas: number;
    operador: string;
    tramo: string;
    tipo_mantenimiento: string;
    estado_alerta: string;
}

// Tipo para el formulario de edición
interface EditFormState {
    hora_actual: number | string;
    mantenimiento_proximo: number | string;
    operador: string;
    tramo: string;
}

const DEMO_MANTENIMIENTOS: MantenimientoDisplay[] = [
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MantenimientoDisplay | null>(null);
    const [editForm, setEditForm] = useState<EditFormState>({
        hora_actual: 0,
        mantenimiento_proximo: 0,
        operador: '',
        tramo: ''
    });
    const [filterCodigo, setFilterCodigo] = useState<string>('');
    const [showCodigoFilter, setShowCodigoFilter] = useState(false);
    const [searchCodigo, setSearchCodigo] = useState('');
    const [usingDemo, setUsingDemo] = useState(true);
    const [showEquipoInfo, setShowEquipoInfo] = useState<string | null>(null);
    const { profile, user } = useAuth();
    const router = useRouter();
    const userRole = profile?.rol as Role;

    useEffect(() => {
        // Verificar permisos
        if (profile && !puedeVer(userRole, 'mantenimientos')) {
            router.push('/');
            return;
        }
        fetchData();
    }, [profile, userRole, router]);

    async function fetchData() {
        try {
            const data = await fetchTable<MantenimientoDisplay>('mantenimientos', '&order=diferencia_horas');
            if (data?.length > 0) {
                setMantenimientos(data);
                setUsingDemo(false);
            } else {
                setUsingDemo(true);
            }
        } catch {
            setUsingDemo(true);
        } finally {
            setLoading(false);
        }
    }

    // Obtener códigos únicos para el filtro deslizable
    const codigosUnicos = [...new Set(mantenimientos.map(m => m.codigo_maquina))].sort();

    const filteredData = mantenimientos
        .filter(m => !filterCodigo || m.codigo_maquina === filterCodigo);

    const stats = {
        vencido: mantenimientos.filter(m => m.estado_alerta === 'VENCIDO').length,
        urgente: mantenimientos.filter(m => m.estado_alerta === 'URGENTE').length,
        proximo: mantenimientos.filter(m => m.estado_alerta === 'PROXIMO').length,
        enRegla: mantenimientos.filter(m => m.estado_alerta === 'EN REGLA').length,
    };

    function openRegisterModal(item: MantenimientoDisplay) {
        setSelectedItem(item);
        setShowModal(true);
    }

    function openEditModal(item: MantenimientoDisplay) {
        setSelectedItem(item);
        setEditForm({
            hora_actual: item.hora_actual,
            mantenimiento_proximo: item.mantenimiento_proximo,
            operador: item.operador || '',
            tramo: item.tramo || '',
        });
        setShowEditModal(true);
    }

    async function guardarEdicion() {
        if (!selectedItem) return;

        const usuarioInfo = {
            id: user?.id || 'demo',
            email: user?.email || 'demo@demo.com',
            nombre: profile?.nombre_completo || 'Usuario Demo'
        };

        const horaActual = parseFloat(String(editForm.hora_actual)) || selectedItem.hora_actual;
        const mttoProximo = parseFloat(String(editForm.mantenimiento_proximo)) || selectedItem.mantenimiento_proximo;
        const diferencia = mttoProximo - horaActual;

        let estadoAlerta = 'EN REGLA';
        if (diferencia <= 0) estadoAlerta = 'VENCIDO';
        else if (diferencia <= 50) estadoAlerta = 'URGENTE';
        else if (diferencia <= 100) estadoAlerta = 'PROXIMO';

        const actualizado = {
            ...selectedItem,
            hora_actual: horaActual,
            mantenimiento_proximo: mttoProximo,
            diferencia_horas: diferencia,
            operador: editForm.operador,
            tramo: editForm.tramo,
            estado_alerta: estadoAlerta,
        };

        if (usingDemo) {
            setMantenimientos(prev => prev.map(m =>
                m.id === selectedItem.id ? actualizado : m
            ));
            setShowEditModal(false);
            return;
        }

        try {
            await updateRow('mantenimientos', selectedItem.id, actualizado);
            // Registrar cambio en historial
            await registrarCambio('mantenimientos', 'UPDATE', selectedItem.codigo_maquina, selectedItem, actualizado, usuarioInfo);
            fetchData();
            setShowEditModal(false);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function handleExport() {
        const dataToExport = formatMantenimientosForExport(mantenimientos);
        exportToExcel(dataToExport, 'Mantenimientos_' + new Date().toISOString().split('T')[0], 'Mantenimientos');
    }

    async function registrarMantenimiento() {
        if (!selectedItem) return;

        const usuarioInfo = {
            id: user?.id || 'demo',
            email: user?.email || 'demo@demo.com',
            nombre: profile?.nombre_completo || 'Usuario Demo'
        };

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
            await updateRow('mantenimientos', selectedItem.id, nuevoMantenimiento);
            // Registrar mantenimiento realizado en historial
            await registrarCambio('mantenimientos', 'UPDATE', selectedItem.codigo_maquina, selectedItem, nuevoMantenimiento, usuarioInfo);
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
                <div className="flex items-center gap-3">
                    {puedeExportar(userRole, 'mantenimientos') && (
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            <p className="text-sm text-gray-500">Urgente (≤50h)</p>
                            <p className="text-3xl font-bold text-red-500">{stats.urgente}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                            <Wrench className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Próximo (51-100h)</p>
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
                            <p className="text-sm text-gray-500">En Regla (&gt;100h)</p>
                            <p className="text-3xl font-bold text-green-500">{stats.enRegla}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtro desplegable estilo Excel */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative sm:w-80">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowCodigoFilter(!showCodigoFilter)}
                                className="w-full input flex items-center justify-between text-left"
                            >
                                <span className={filterCodigo ? 'text-gray-800' : 'text-gray-400'}>
                                    {filterCodigo ? getCodigoConSerie(filterCodigo) : 'Todos los equipos...'}
                                </span>
                                <ChevronDown
                                    size={18}
                                    className={`text-gray-400 transition-transform ${showCodigoFilter ? 'rotate-180' : ''}`}
                                />
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
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                                                !filterCodigo ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                            }`}
                                        >
                                            Todos
                                        </button>
                                        {codigosUnicos
                                            .filter(c => {
                                                const serie = getSeriePorCodigo(c).toLowerCase();
                                                const term = searchCodigo.toLowerCase();
                                                return c.toLowerCase().includes(term) || serie.includes(term);
                                            })
                                            .map(codigo => (
                                                <button
                                                    key={codigo}
                                                    onClick={() => { setFilterCodigo(codigo); setShowCodigoFilter(false); setSearchCodigo(''); }}
                                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                                        filterCodigo === codigo ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                                    }`}
                                                >
                                                    <span className="text-base">
                                                        {ICONOS_MAQUINARIA[mantenimientos.find(m => m.codigo_maquina === codigo)?.tipo as TipoMaquinaria] || '🔧'}
                                                    </span>
                                                    <span className="font-medium">{codigo}</span>
                                                    <span className="text-gray-400">({getSeriePorCodigo(codigo)})</span>
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
                            <X size={16} /> Limpiar filtro
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">
                        {filterCodigo ? `Equipos - ${filterCodigo}` : 'Todos los Equipos'}
                    </h2>
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
                                    <td>
                                        <button
                                            onClick={() => setShowEquipoInfo(m.codigo_maquina)}
                                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                            title="Ver información del equipo"
                                        >
                                            {m.codigo_maquina}
                                        </button>
                                    </td>
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
                                        <div className="flex gap-2">
                                            {puedeEditar(userRole, 'mantenimientos') && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(m)}
                                                        className="btn btn-outline py-2 px-3 text-sm"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openRegisterModal(m)}
                                                        className="btn btn-secondary py-2 px-3 text-sm"
                                                    >
                                                        <Wrench size={16} />
                                                        Registrar Mtto
                                                    </button>
                                                </>
                                            )}
                                        </div>
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

            {/* Modal Editar Mantenimiento */}
            {showEditModal && selectedItem && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">Editar Mantenimiento</h2>
                                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-center mb-4">
                                <p className="font-bold text-lg text-gray-800">{selectedItem.codigo_maquina}</p>
                                <p className="text-gray-500">{selectedItem.tipo} - {selectedItem.modelo}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Actual</label>
                                    <input
                                        type="number"
                                        value={editForm.hora_actual}
                                        onChange={e => setEditForm({ ...editForm, hora_actual: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mtto Próximo</label>
                                    <input
                                        type="number"
                                        value={editForm.mantenimiento_proximo}
                                        onChange={e => setEditForm({ ...editForm, mantenimiento_proximo: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Operador</label>
                                <input
                                    type="text"
                                    value={editForm.operador}
                                    onChange={e => setEditForm({ ...editForm, operador: e.target.value })}
                                    className="input w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tramo/Ubicación</label>
                                <input
                                    type="text"
                                    value={editForm.tramo}
                                    onChange={e => setEditForm({ ...editForm, tramo: e.target.value })}
                                    className="input w-full"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowEditModal(false)} className="btn btn-outline">
                                Cancelar
                            </button>
                            <button onClick={guardarEdicion} className="btn btn-primary">
                                <Save size={18} />
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
