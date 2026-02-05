'use client';

import { useState, useEffect, useMemo } from 'react';
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
    ArrowUpCircle,
    Building2,
    Gauge,
    BarChart3,
    Car
} from 'lucide-react';
import { fetchTableWithStatus, insertRow, updateRow, deleteRow, registrarCambio } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { ICONOS_MAQUINARIA, TipoMaquinaria, Role, RegistroCombustible, FuenteCombustible, RendimientoMaquina } from '@/lib/types';
import { exportToExcel } from '@/lib/export';
import { useAuth } from '@/components/auth-provider';
import { puedeVer, puedeCrear, puedeEditar, puedeEliminar, puedeExportar } from '@/lib/permisos';
import { useRouter } from 'next/navigation';
import { getCodigoConSerie, EQUIPOS_MAESTRO } from '@/lib/equipos-data';

type TipoMovimiento = 'ENTRADA' | 'SALIDA';
type TipoFormulario = 'ABASTECER_CISTERNA' | 'DESPACHO_CISTERNA' | 'ABASTECER_GRIFO';

const DEMO_COMBUSTIBLE: RegistroCombustible[] = [
    { id: '1', fecha: '2026-01-28', tipo_movimiento: 'ENTRADA', fuente_combustible: 'CISTERNA', codigo_maquina: 'CISTERNA', galones: 500, precio_galon: 14.50, total: 7250, proveedor: 'PETROPERU', numero_factura: 'F001-00234', observaciones: 'Abastecimiento cisterna' },
    { id: '2', fecha: '2026-01-28', tipo_movimiento: 'SALIDA', fuente_combustible: 'CISTERNA', codigo_maquina: 'EXC-01', tipo_maquina: 'EXCAVADORA', horometro: 15612, galones: 45, operador: 'JOSE ABANTO', observaciones: 'Despacho en obra' },
    { id: '3', fecha: '2026-01-27', tipo_movimiento: 'SALIDA', fuente_combustible: 'GRIFO', codigo_maquina: 'VOL-01', tipo_maquina: 'VOLQUETE', horometro: 45000, galones: 80, precio_galon: 15.20, total: 1216, nombre_grifo: 'GRIFO REPSOL KM 45', operador: 'MIGUEL TORRES' },
    { id: '4', fecha: '2026-01-27', tipo_movimiento: 'SALIDA', fuente_combustible: 'CISTERNA', codigo_maquina: 'MOT-01', tipo_maquina: 'MOTONIVELADORA', horometro: 12420, galones: 35, operador: 'CARLOS RUIZ' },
    { id: '5', fecha: '2026-01-26', tipo_movimiento: 'SALIDA', fuente_combustible: 'CISTERNA', codigo_maquina: 'CAR-01', tipo_maquina: 'CARGADOR FRONTAL', horometro: 8900, galones: 50, operador: 'PEDRO SILVA' },
    { id: '6', fecha: '2026-01-25', tipo_movimiento: 'ENTRADA', fuente_combustible: 'CISTERNA', codigo_maquina: 'CISTERNA', galones: 1000, precio_galon: 14.30, total: 14300, proveedor: 'REPSOL', numero_factura: 'F001-00198' },
    { id: '7', fecha: '2026-01-25', tipo_movimiento: 'SALIDA', fuente_combustible: 'GRIFO', codigo_maquina: 'CIST-01', tipo_maquina: 'CISTERNA DE AGUA', horometro: 23500, galones: 60, precio_galon: 15.50, total: 930, nombre_grifo: 'PRIMAX TRUJILLO', operador: 'JORGE VASQUEZ' },
    { id: '8', fecha: '2026-01-24', tipo_movimiento: 'SALIDA', fuente_combustible: 'CISTERNA', codigo_maquina: 'EXC-01', tipo_maquina: 'EXCAVADORA', horometro: 15520, galones: 42, operador: 'JOSE ABANTO' },
    { id: '9', fecha: '2026-01-23', tipo_movimiento: 'SALIDA', fuente_combustible: 'CISTERNA', codigo_maquina: 'MOT-01', tipo_maquina: 'MOTONIVELADORA', horometro: 12350, galones: 38, operador: 'CARLOS RUIZ' },
];

const GRIFOS_COMUNES = [
    'PRIMAX',
    'REPSOL',
    'PECSA',
    'PETROPERÚ',
    'OTRO'
];

export default function CombustiblePage() {
    const [registros, setRegistros] = useState<RegistroCombustible[]>(DEMO_COMBUSTIBLE);
    const [maquinaria, setMaquinaria] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [tipoFormulario, setTipoFormulario] = useState<TipoFormulario>('DESPACHO_CISTERNA');
    const [editingItem, setEditingItem] = useState<RegistroCombustible | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMes, setFilterMes] = useState('');
    const [filterTipo, setFilterTipo] = useState<TipoMovimiento | ''>('');
    const [filterFuente, setFilterFuente] = useState<FuenteCombustible | ''>('');
    const [filterCodigo, setFilterCodigo] = useState<string>('');
    const [showCodigoFilter, setShowCodigoFilter] = useState(false);
    const [searchCodigo, setSearchCodigo] = useState('');
    const [usingDemo, setUsingDemo] = useState(true);
    const [activeTab, setActiveTab] = useState<'movimientos' | 'rendimiento'>('movimientos');
    const { profile, user } = useAuth();
    const router = useRouter();
    const userRole = profile?.rol as Role;

    const emptyForm: Partial<RegistroCombustible> = {
        fecha: new Date().toISOString().split('T')[0],
        tipo_movimiento: 'SALIDA',
        fuente_combustible: 'CISTERNA',
        codigo_maquina: '',
        horometro: 0,
        galones: 0,
        precio_galon: 14.50,
        total: 0,
        proveedor: '',
        nombre_grifo: '',
        numero_factura: '',
        operador: '',
        observaciones: ''
    };

    const [formData, setFormData] = useState(emptyForm);
    const [useManualEquipo, setUseManualEquipo] = useState(false);

    useEffect(() => {
        if (profile && !puedeVer(userRole, 'combustible')) {
            router.push('/');
            return;
        }
        fetchData();
    }, [profile, userRole, router]);

    useEffect(() => {
        // Calcular total automáticamente
        if (formData.galones && formData.precio_galon) {
            const total = (formData.galones || 0) * (formData.precio_galon || 0);
            setFormData(prev => ({ ...prev, total }));
        }
    }, [formData.galones, formData.precio_galon]);

    async function fetchData() {
        try {
            const [combustibleResult, maquinariaResult] = await Promise.all([
                fetchTableWithStatus<RegistroCombustible>('combustible', '&order=fecha.desc'),
                fetchTableWithStatus<any>('maquinaria', '&order=codigo')
            ]);

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

    function openModal(tipo: TipoFormulario) {
        setTipoFormulario(tipo);

        if (tipo === 'ABASTECER_CISTERNA') {
            setFormData({
                ...emptyForm,
                tipo_movimiento: 'ENTRADA',
                fuente_combustible: 'CISTERNA',
                codigo_maquina: 'CISTERNA'
            });
        } else if (tipo === 'DESPACHO_CISTERNA') {
            setFormData({
                ...emptyForm,
                tipo_movimiento: 'SALIDA',
                fuente_combustible: 'CISTERNA',
                codigo_maquina: ''
            });
        } else if (tipo === 'ABASTECER_GRIFO') {
            setFormData({
                ...emptyForm,
                tipo_movimiento: 'SALIDA',
                fuente_combustible: 'GRIFO',
                codigo_maquina: '',
                precio_galon: 15.50
            });
        }

        setEditingItem(null);
        setUseManualEquipo(false);
        setShowModal(true);
    }

    function openEditModal(item: RegistroCombustible) {
        setFormData(item);

        // Check if equipment code is not in EQUIPOS_MAESTRO (custom/manual entry)
        const isManualEquipo = item.codigo_maquina !== 'CISTERNA' &&
            !EQUIPOS_MAESTRO.some(eq => eq.codigo === item.codigo_maquina);
        setUseManualEquipo(isManualEquipo);

        if (item.tipo_movimiento === 'ENTRADA') {
            setTipoFormulario('ABASTECER_CISTERNA');
        } else if (item.fuente_combustible === 'GRIFO') {
            setTipoFormulario('ABASTECER_GRIFO');
        } else {
            setTipoFormulario('DESPACHO_CISTERNA');
        }

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
            'Fuente': r.fuente_combustible,
            'Código': r.codigo_maquina,
            'Tipo Máquina': r.tipo_maquina || '',
            'Horómetro': r.horometro || '',
            'Galones': r.galones,
            'Precio/Galón': r.precio_galon || '',
            'Total S/': r.total || '',
            'Proveedor/Grifo': r.proveedor || r.nombre_grifo || '',
            'Factura': r.numero_factura || '',
            'Operador': r.operador || ''
        }));
        exportToExcel(data, 'Combustible_' + new Date().toISOString().split('T')[0], 'Combustible');
    }

    const filteredRegistros = registros.filter(r => {
        const matchSearch = r.codigo_maquina.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.operador || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.nombre_grifo || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchMes = !filterMes || r.fecha.startsWith(filterMes);
        const matchTipo = !filterTipo || r.tipo_movimiento === filterTipo;
        const matchFuente = !filterFuente || r.fuente_combustible === filterFuente;
        const matchCodigo = !filterCodigo || r.codigo_maquina === filterCodigo;
        return matchSearch && matchMes && matchTipo && matchFuente && matchCodigo;
    });

    // Estadísticas separadas por fuente
    const stats = useMemo(() => {
        const entradasCisterna = registros.filter(r => r.tipo_movimiento === 'ENTRADA' && r.fuente_combustible === 'CISTERNA');
        const salidasCisterna = registros.filter(r => r.tipo_movimiento === 'SALIDA' && r.fuente_combustible === 'CISTERNA');
        const salidasGrifo = registros.filter(r => r.tipo_movimiento === 'SALIDA' && r.fuente_combustible === 'GRIFO');

        const totalEntradasCisterna = entradasCisterna.reduce((sum, r) => sum + r.galones, 0);
        const totalSalidasCisterna = salidasCisterna.reduce((sum, r) => sum + r.galones, 0);
        const totalSalidasGrifo = salidasGrifo.reduce((sum, r) => sum + r.galones, 0);

        const stockCisterna = totalEntradasCisterna - totalSalidasCisterna;
        const gastoCompraCisterna = entradasCisterna.reduce((sum, r) => sum + (r.total || 0), 0);
        const gastoGrifos = salidasGrifo.reduce((sum, r) => sum + (r.total || 0), 0);

        return {
            stockCisterna,
            totalEntradasCisterna,
            totalSalidasCisterna,
            totalSalidasGrifo,
            gastoCompraCisterna,
            gastoGrifos,
            totalGastado: gastoCompraCisterna + gastoGrifos
        };
    }, [registros]);

    // Cálculo de rendimiento por máquina
    const rendimientoMaquinas = useMemo((): RendimientoMaquina[] => {
        // Solo considerar despachos desde cisterna (consumo real)
        // Excluir abastecimientos en grifo (son recargas, no consumo)
        const salidas = registros.filter(r =>
            r.tipo_movimiento === 'SALIDA' &&
            r.fuente_combustible === 'CISTERNA' &&  // Solo despachos de cisterna
            r.codigo_maquina !== 'CISTERNA' &&
            r.horometro && r.horometro > 0
        );

        const porMaquina = new Map<string, RegistroCombustible[]>();

        salidas.forEach(r => {
            const existing = porMaquina.get(r.codigo_maquina) || [];
            existing.push(r);
            porMaquina.set(r.codigo_maquina, existing);
        });

        const result: RendimientoMaquina[] = [];

        porMaquina.forEach((records, codigo) => {
            if (records.length < 2) return; // Necesitamos al menos 2 registros para calcular

            const horometros = records.map(r => r.horometro!).sort((a, b) => a - b);
            const horometro_inicial = horometros[0];
            const horometro_final = horometros[horometros.length - 1];
            const horas_trabajadas = horometro_final - horometro_inicial;

            if (horas_trabajadas <= 0) return;

            const total_galones = records.reduce((sum, r) => sum + r.galones, 0);
            const rendimiento_gal_hora = total_galones / horas_trabajadas;

            result.push({
                codigo_maquina: codigo,
                tipo_maquina: records[0].tipo_maquina,
                total_galones,
                horometro_inicial,
                horometro_final,
                horas_trabajadas,
                rendimiento_gal_hora,
                registros_count: records.length
            });
        });

        return result.sort((a, b) => a.rendimiento_gal_hora - b.rendimiento_gal_hora);
    }, [registros]);

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
                    <p className="text-gray-500 mt-1">Gestiona el inventario de cisterna y consumo de unidades</p>
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
                        <button onClick={() => openModal('DESPACHO_CISTERNA')} className="btn btn-primary">
                            + Nuevo Registro
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards - Diseño mejorado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Stock Cisterna */}
                <div className="card p-5 border-l-4 border-blue-500">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                                <Droplets className="text-blue-600" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Stock Cisterna</p>
                                <p className="text-3xl font-bold text-blue-600">{formatNumber(stats.stockCisterna)}<span className="text-lg ml-1">gal</span></p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                            <TrendingDown size={14} /> Entradas: {formatNumber(stats.totalEntradasCisterna)}
                        </span>
                        <span className="text-amber-600 flex items-center gap-1">
                            <TrendingUp size={14} /> Salidas: {formatNumber(stats.totalSalidasCisterna)}
                        </span>
                    </div>
                </div>

                {/* Gasto en Grifos */}
                <div className="card p-5 border-l-4 border-purple-500">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm">
                                <Building2 className="text-purple-600" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Gasto en Grifos</p>
                                <p className="text-3xl font-bold text-purple-600">S/ {formatNumber(stats.gastoGrifos)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                        <span className="text-gray-600">
                            {formatNumber(stats.totalSalidasGrifo)} galones en estaciones
                        </span>
                        <span className="text-purple-600">
                            Total histórico acumulado
                        </span>
                    </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="card p-5">
                    <p className="text-sm font-medium text-gray-500 mb-3">Acciones Directas</p>
                    <div className="space-y-2">
                        {puedeCrear(userRole, 'combustible') && (
                            <>
                                <button
                                    onClick={() => openModal('ABASTECER_CISTERNA')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                        <ArrowDownCircle className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-700">Abastecer Cisterna</p>
                                        <p className="text-xs text-green-600">Registrar compra de diesel</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => openModal('DESPACHO_CISTERNA')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                                        <ArrowUpCircle className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-amber-700">Despacho a Máquina</p>
                                        <p className="text-xs text-amber-600">Registrar salida de combustible</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => openModal('ABASTECER_GRIFO')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                                        <Building2 className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-purple-700">Abastecimiento en Grifo</p>
                                        <p className="text-xs text-purple-600">Compra en estación de servicio</p>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="card overflow-hidden">
                <div className="border-b bg-gray-50">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('movimientos')}
                            className={`px-6 py-4 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'movimientos'
                                ? 'text-amber-600 border-b-2 border-amber-500 bg-white'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Fuel size={18} />
                            Movimientos de Combustible
                        </button>
                        <button
                            onClick={() => setActiveTab('rendimiento')}
                            className={`px-6 py-4 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'rendimiento'
                                ? 'text-amber-600 border-b-2 border-amber-500 bg-white'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <BarChart3 size={18} />
                            Rendimiento por Máquina
                        </button>
                    </div>
                </div>

                {activeTab === 'movimientos' && (
                    <>
                        {/* Filtros */}
                        <div className="p-4 border-b bg-white">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Tipo de movimiento */}
                                <div className="sm:w-36">
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

                                {/* Fuente */}
                                <div className="sm:w-36">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuente</label>
                                    <select
                                        className="input w-full"
                                        value={filterFuente}
                                        onChange={(e) => setFilterFuente(e.target.value as FuenteCombustible | '')}
                                    >
                                        <option value="">Todas</option>
                                        <option value="CISTERNA">Cisterna</option>
                                        <option value="GRIFO">Grifo</option>
                                    </select>
                                </div>

                                {/* Dropdown filtro por código */}
                                <div className="relative sm:w-64">
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
                                <div className="sm:w-40">
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
                                            placeholder="Operador, grifo..."
                                            className="input pl-10 w-full"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Limpiar */}
                                {(filterCodigo || searchTerm || filterMes || filterTipo || filterFuente) && (
                                    <button
                                        onClick={() => { setFilterCodigo(''); setSearchTerm(''); setFilterMes(''); setFilterTipo(''); setFilterFuente(''); }}
                                        className="self-end px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                                    >
                                        <X size={16} /> Limpiar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Fuente</th>
                                        <th>Equipo</th>
                                        <th>Horómetro</th>
                                        <th>Galones</th>
                                        <th>Precio</th>
                                        <th>Total</th>
                                        <th>Proveedor/Grifo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRegistros.length === 0 ? (
                                        <tr><td colSpan={10} className="text-center py-8 text-gray-500">No hay registros</td></tr>
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
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.fuente_combustible === 'CISTERNA'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {r.fuente_combustible === 'CISTERNA' ? '🛢️ Cisterna' : '🏪 Grifo'}
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
                                                <td>{r.proveedor || r.nombre_grifo || r.operador || '-'}</td>
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
                    </>
                )}

                {activeTab === 'rendimiento' && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Gauge className="text-amber-500" />
                                Rendimiento de Combustible por Máquina
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Cálculo basado en galones consumidos / horas trabajadas (diferencia de horómetros)
                            </p>
                        </div>

                        {rendimientoMaquinas.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Gauge size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No hay datos suficientes</p>
                                <p className="text-sm">Se necesitan al menos 2 registros con horómetro por máquina para calcular el rendimiento</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Equipo</th>
                                            <th>Tipo</th>
                                            <th>Horómetro Inicial</th>
                                            <th>Horómetro Final</th>
                                            <th>Horas Trabajadas</th>
                                            <th>Total Galones</th>
                                            <th>Rendimiento</th>
                                            <th>Registros</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rendimientoMaquinas.map((r, idx) => (
                                            <tr key={r.codigo_maquina}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span>{ICONOS_MAQUINARIA[r.tipo_maquina as TipoMaquinaria] || '🚜'}</span>
                                                        <span className="font-bold">{r.codigo_maquina}</span>
                                                    </div>
                                                </td>
                                                <td className="text-gray-600">{r.tipo_maquina || '-'}</td>
                                                <td>{formatNumber(r.horometro_inicial)}</td>
                                                <td>{formatNumber(r.horometro_final)}</td>
                                                <td className="font-medium">{formatNumber(r.horas_trabajadas)} hrs</td>
                                                <td className="font-medium text-amber-600">{formatNumber(r.total_galones)} gal</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-lg font-bold ${r.rendimiento_gal_hora <= 3 ? 'text-green-600' :
                                                            r.rendimiento_gal_hora <= 5 ? 'text-amber-600' :
                                                                'text-red-600'
                                                            }`}>
                                                            {r.rendimiento_gal_hora.toFixed(2)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">gal/hr</span>
                                                        {idx === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Mejor</span>}
                                                    </div>
                                                </td>
                                                <td className="text-gray-500">{r.registros_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {rendimientoMaquinas.length > 0 && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Nota:</strong> Un menor valor de gal/hr indica mejor eficiencia de combustible.
                                    Los equipos están ordenados del más eficiente al menos eficiente.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {tipoFormulario === 'ABASTECER_CISTERNA' && (
                                    <><ArrowDownCircle className="text-green-600" /> Abastecer Cisterna</>
                                )}
                                {tipoFormulario === 'DESPACHO_CISTERNA' && (
                                    <><ArrowUpCircle className="text-amber-600" /> Despacho desde Cisterna</>
                                )}
                                {tipoFormulario === 'ABASTECER_GRIFO' && (
                                    <><Building2 className="text-purple-600" /> Abastecimiento en Grifo</>
                                )}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Info de tipo de registro */}
                            <div className={`p-3 rounded-lg text-sm ${tipoFormulario === 'ABASTECER_CISTERNA' ? 'bg-green-50 text-green-700' :
                                tipoFormulario === 'DESPACHO_CISTERNA' ? 'bg-amber-50 text-amber-700' :
                                    'bg-purple-50 text-purple-700'
                                }`}>
                                {tipoFormulario === 'ABASTECER_CISTERNA' && '📦 Este registro aumentará el stock de la cisterna'}
                                {tipoFormulario === 'DESPACHO_CISTERNA' && '🛢️ Este registro reducirá el stock de la cisterna'}
                                {tipoFormulario === 'ABASTECER_GRIFO' && '🏪 Este registro NO afecta el stock de cisterna'}
                            </div>

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

                            {tipoFormulario === 'ABASTECER_CISTERNA' && (
                                // Campos para ENTRADA a cisterna
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
                            )}

                            {tipoFormulario === 'DESPACHO_CISTERNA' && (
                                // Campos para SALIDA desde cisterna
                                <>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="label mb-0">Equipo *</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUseManualEquipo(!useManualEquipo);
                                                    if (!useManualEquipo) {
                                                        setFormData({ ...formData, codigo_maquina: '', tipo_maquina: '' });
                                                    }
                                                }}
                                                className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${useManualEquipo
                                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {useManualEquipo ? (
                                                    <><Car size={14} /> Modo Manual</>
                                                ) : (
                                                    <>📋 Seleccionar de Lista</>
                                                )}
                                            </button>
                                        </div>

                                        {useManualEquipo ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="Código o Placa (ej: ABC-123, CAM-01)"
                                                    value={formData.codigo_maquina}
                                                    onChange={(e) => setFormData({ ...formData, codigo_maquina: e.target.value.toUpperCase() })}
                                                />
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="Tipo de vehículo (ej: CAMIONETA, FURGONETA)"
                                                    value={formData.tipo_maquina || ''}
                                                    onChange={(e) => setFormData({ ...formData, tipo_maquina: e.target.value.toUpperCase() })}
                                                />
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Car size={12} /> Ingresa la placa o código del vehículo manualmente
                                                </p>
                                            </div>
                                        ) : (
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
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">{useManualEquipo ? 'Kilometraje / Horómetro' : 'Horómetro'}</label>
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
                                    {stats.stockCisterna < (formData.galones || 0) && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            ⚠️ Galones solicitados ({formData.galones}) exceden el stock disponible ({stats.stockCisterna} gal)
                                        </div>
                                    )}
                                </>
                            )}

                            {tipoFormulario === 'ABASTECER_GRIFO' && (
                                // Campos para salida con compra en grifo
                                <>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="label mb-0">Equipo *</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUseManualEquipo(!useManualEquipo);
                                                    if (!useManualEquipo) {
                                                        setFormData({ ...formData, codigo_maquina: '', tipo_maquina: '' });
                                                    }
                                                }}
                                                className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${useManualEquipo
                                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {useManualEquipo ? (
                                                    <><Car size={14} /> Modo Manual</>
                                                ) : (
                                                    <>📋 Seleccionar de Lista</>
                                                )}
                                            </button>
                                        </div>

                                        {useManualEquipo ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="Código o Placa (ej: ABC-123, CAM-01)"
                                                    value={formData.codigo_maquina}
                                                    onChange={(e) => setFormData({ ...formData, codigo_maquina: e.target.value.toUpperCase() })}
                                                />
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="Tipo de vehículo (ej: CAMIONETA, FURGONETA)"
                                                    value={formData.tipo_maquina || ''}
                                                    onChange={(e) => setFormData({ ...formData, tipo_maquina: e.target.value.toUpperCase() })}
                                                />
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Car size={12} /> Ingresa la placa o código del vehículo manualmente
                                                </p>
                                            </div>
                                        ) : (
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
                                        )}
                                    </div>
                                    <div>
                                        <label className="label">Nombre del Grifo *</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="input w-1/3"
                                                value={GRIFOS_COMUNES.includes(formData.nombre_grifo?.split(' ')[0] || '') ? formData.nombre_grifo?.split(' ')[0] : 'OTRO'}
                                                onChange={(e) => {
                                                    if (e.target.value !== 'OTRO') {
                                                        setFormData({ ...formData, nombre_grifo: e.target.value });
                                                    }
                                                }}
                                            >
                                                {GRIFOS_COMUNES.map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                className="input flex-1"
                                                placeholder="Nombre completo del grifo"
                                                value={formData.nombre_grifo}
                                                onChange={(e) => setFormData({ ...formData, nombre_grifo: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">{useManualEquipo ? 'Kilometraje / Horómetro' : 'Horómetro'}</label>
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
                                    <div>
                                        <label className="label">N° Factura/Boleta</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Ej: B001-00234"
                                            value={formData.numero_factura}
                                            onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                                        />
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
