'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import {
    History,
    RotateCcw,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    User,
    Calendar,
    Database,
    Eye,
    AlertTriangle
} from 'lucide-react';

interface HistorialItem {
    id: string;
    tabla: string;
    accion: 'CREATE' | 'UPDATE' | 'DELETE';
    registro_id: string;
    datos_anteriores: any;
    datos_nuevos: any;
    usuario_id: string;
    usuario_email: string;
    usuario_nombre: string;
    created_at: string;
}

const DEMO_HISTORIAL: HistorialItem[] = [
    {
        id: '1',
        tabla: 'maquinaria',
        accion: 'UPDATE',
        registro_id: 'EXC-01',
        datos_anteriores: { horas_actuales: 15500, estado: 'OPERATIVO' },
        datos_nuevos: { horas_actuales: 15612, estado: 'OPERATIVO' },
        usuario_id: '1',
        usuario_email: 'admin@empresa.com',
        usuario_nombre: 'Administrador',
        created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: '2',
        tabla: 'mantenimientos',
        accion: 'UPDATE',
        registro_id: 'MOT-01',
        datos_anteriores: { hora_actual: 12400, estado_alerta: 'PROXIMO' },
        datos_nuevos: { hora_actual: 12420, estado_alerta: 'URGENTE' },
        usuario_id: '1',
        usuario_email: 'admin@empresa.com',
        usuario_nombre: 'Administrador',
        created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: '3',
        tabla: 'soat',
        accion: 'CREATE',
        registro_id: 'VOL-02',
        datos_anteriores: null,
        datos_nuevos: { codigo: 'VOL-02', fecha_vencimiento: '2026-06-15', aseguradora: 'RIMAC' },
        usuario_id: '2',
        usuario_email: 'supervisor@empresa.com',
        usuario_nombre: 'Supervisor',
        created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: '4',
        tabla: 'maquinaria',
        accion: 'DELETE',
        registro_id: 'TMP-01',
        datos_anteriores: { codigo: 'TMP-01', tipo: 'TEMPORAL', estado: 'INOPERATIVO' },
        datos_nuevos: null,
        usuario_id: '1',
        usuario_email: 'admin@empresa.com',
        usuario_nombre: 'Administrador',
        created_at: new Date(Date.now() - 172800000).toISOString()
    },
];

const TABLAS = ['Todas', 'maquinaria', 'mantenimientos', 'soat', 'citv', 'filtros', 'perfiles'];
const ACCIONES = ['Todas', 'CREATE', 'UPDATE', 'DELETE'];

export default function HistorialPage() {
    const [historial, setHistorial] = useState<HistorialItem[]>(DEMO_HISTORIAL);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTabla, setFilterTabla] = useState('Todas');
    const [filterAccion, setFilterAccion] = useState('Todas');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [usingDemo, setUsingDemo] = useState(true);
    const { isAdmin } = useAuth();

    useEffect(() => {
        fetchHistorial();
    }, []);

    async function fetchHistorial() {
        try {
            const supabase = createClient();
            if (!supabase) {
                console.log('Supabase no configurado');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('historial')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            console.log('Historial data:', data);
            console.log('Historial error:', error);

            if (error) {
                console.error('Error RLS o tabla:', error.message);
                // Si hay error de permisos, seguir en modo demo
                return;
            }

            // Conexión exitosa - quitar modo demo aunque no haya datos
            setUsingDemo(false);
            if (data && data.length > 0) {
                setHistorial(data);
            } else {
                setHistorial([]); // Tabla vacía pero conectada
            }
        } catch (error) {
            console.error('Error fetching historial:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleRestore(item: HistorialItem) {
        if (!item.datos_anteriores) {
            alert('No hay datos anteriores para restaurar');
            return;
        }

        if (!confirm(`¿Restaurar el registro ${item.registro_id} a su estado anterior?`)) {
            return;
        }

        try {
            const supabase = createClient();
            if (!supabase) {
                alert('Error: Supabase no configurado');
                return;
            }

            if (item.accion === 'DELETE') {
                // Re-insertar el registro eliminado
                const { error } = await supabase
                    .from(item.tabla)
                    .insert([item.datos_anteriores]);

                if (error) throw error;
            } else if (item.accion === 'UPDATE') {
                // Restaurar a los datos anteriores
                const { error } = await supabase
                    .from(item.tabla)
                    .update(item.datos_anteriores)
                    .eq('id', item.registro_id);

                if (error) throw error;
            }

            alert('Registro restaurado exitosamente');
            fetchHistorial();
        } catch (error: any) {
            console.error('Error restoring:', error);
            alert('Error al restaurar: ' + error.message);
        }
    }

    const filteredHistorial = historial.filter(item => {
        const matchSearch = item.registro_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.tabla.toLowerCase().includes(searchTerm.toLowerCase());
        const matchTabla = filterTabla === 'Todas' || item.tabla === filterTabla;
        const matchAccion = filterAccion === 'Todas' || item.accion === filterAccion;
        return matchSearch && matchTabla && matchAccion;
    });

    function getAccionColor(accion: string) {
        switch (accion) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getAccionLabel(accion: string) {
        switch (accion) {
            case 'CREATE': return 'Creación';
            case 'UPDATE': return 'Actualización';
            case 'DELETE': return 'Eliminación';
            default: return accion;
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (hours < 1) return 'Hace menos de 1 hora';
        if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <History className="text-blue-600" />
                        Historial de Cambios
                    </h1>
                    <p className="text-gray-500 mt-1">Registro de todas las modificaciones del sistema</p>
                </div>
                {usingDemo && (
                    <span className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium">
                        Datos de demostración
                    </span>
                )}
            </div>

            {/* Filtros */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por registro, usuario o tabla..."
                            className="input pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input sm:w-40"
                        value={filterTabla}
                        onChange={(e) => setFilterTabla(e.target.value)}
                    >
                        {TABLAS.map(t => (
                            <option key={t} value={t}>{t === 'Todas' ? 'Todas las tablas' : t}</option>
                        ))}
                    </select>
                    <select
                        className="input sm:w-40"
                        value={filterAccion}
                        onChange={(e) => setFilterAccion(e.target.value)}
                    >
                        {ACCIONES.map(a => (
                            <option key={a} value={a}>{a === 'Todas' ? 'Todas las acciones' : getAccionLabel(a)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de cambios */}
            <div className="space-y-3">
                {filteredHistorial.length === 0 ? (
                    <div className="card p-8 text-center text-gray-500">
                        No se encontraron registros
                    </div>
                ) : (
                    filteredHistorial.map((item) => (
                        <div key={item.id} className="card overflow-hidden">
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getAccionColor(item.accion)}`}>
                                            {getAccionLabel(item.accion)}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                <span className="text-blue-600">{item.tabla}</span>
                                                <span className="text-gray-400 mx-2">→</span>
                                                {item.registro_id}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <User size={14} />
                                                    {item.usuario_nombre}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {formatDate(item.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isAdmin && item.datos_anteriores && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRestore(item); }}
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Restaurar"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                        )}
                                        {expandedId === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>

                            {/* Detalles expandidos */}
                            {expandedId === item.id && (
                                <div className="border-t border-gray-100 p-4 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {item.datos_anteriores && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <AlertTriangle size={16} className="text-red-500" />
                                                    Datos Anteriores
                                                </h4>
                                                <pre className="bg-red-50 p-3 rounded-lg text-xs overflow-x-auto border border-red-100">
                                                    {JSON.stringify(item.datos_anteriores, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {item.datos_nuevos && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Eye size={16} className="text-green-500" />
                                                    Datos Nuevos
                                                </h4>
                                                <pre className="bg-green-50 p-3 rounded-lg text-xs overflow-x-auto border border-green-100">
                                                    {JSON.stringify(item.datos_nuevos, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
