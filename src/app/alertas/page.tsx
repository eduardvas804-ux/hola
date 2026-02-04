'use client';

import { useState, useEffect } from 'react';
import {
    Bell,
    Mail,
    Send,
    AlertTriangle,
    CheckCircle,
    FileCheck,
    ClipboardCheck,
    Wrench,
    Plus,
    X,
    Loader2,
    Settings,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Alerta {
    id: string;
    tipo: 'mantenimiento' | 'soat' | 'citv';
    codigo: string;
    descripcion: string;
    estado: 'VENCIDO' | 'URGENTE' | 'PROXIMO';
    valor: string;
    urgencia: 'alta' | 'media' | 'baja';
    fecha_vencimiento?: string;
}

export default function AlertasPage() {
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [emails, setEmails] = useState<string[]>(['']);
    const [showConfig, setShowConfig] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

    const [stats, setStats] = useState({
        mantenimientos: 0,
        soat: 0,
        citv: 0,
        total: 0
    });

    useEffect(() => {
        cargarAlertas();
    }, []);

    function calcularDiasRestantes(fechaVencimiento: string): number {
        if (!fechaVencimiento) return 999;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const vencimiento = new Date(fechaVencimiento);
        vencimiento.setHours(0, 0, 0, 0);
        const diffTime = vencimiento.getTime() - hoy.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    async function cargarAlertas() {
        setLoading(true);
        const alertasTemp: Alerta[] = [];

        try {
            const supabase = createClient();
            if (!supabase) {
                console.log('Supabase no configurado');
                setLoading(false);
                return;
            }

            // Cargar SOAT
            const { data: soatData, error: soatError } = await supabase
                .from('soat')
                .select('*');

            console.log('SOAT data:', soatData, 'error:', soatError);

            if (soatData) {
                soatData.forEach(s => {
                    const diasRestantes = calcularDiasRestantes(s.fecha_vencimiento);

                    if (diasRestantes <= 30) {
                        let estado: 'VENCIDO' | 'URGENTE' | 'PROXIMO' = 'PROXIMO';
                        let urgencia: 'alta' | 'media' | 'baja' = 'baja';

                        if (diasRestantes <= 0) {
                            estado = 'VENCIDO';
                            urgencia = 'alta';
                        } else if (diasRestantes <= 15) {
                            estado = 'URGENTE';
                            urgencia = 'media';
                        }

                        alertasTemp.push({
                            id: s.id,
                            tipo: 'soat',
                            codigo: s.codigo || 'Sin código',
                            descripcion: `SOAT - ${s.tipo || ''} ${s.placa_serie || ''}`.trim(),
                            estado,
                            valor: diasRestantes <= 0 ? 'Vencido' : `${diasRestantes} días`,
                            urgencia,
                            fecha_vencimiento: s.fecha_vencimiento
                        });
                    }
                });
            }

            // Cargar CITV
            const { data: citvData, error: citvError } = await supabase
                .from('citv')
                .select('*');

            console.log('CITV data:', citvData, 'error:', citvError);

            if (citvData) {
                citvData.forEach(c => {
                    const diasRestantes = calcularDiasRestantes(c.fecha_vencimiento);

                    if (diasRestantes <= 30) {
                        let estado: 'VENCIDO' | 'URGENTE' | 'PROXIMO' = 'PROXIMO';
                        let urgencia: 'alta' | 'media' | 'baja' = 'baja';

                        if (diasRestantes <= 0) {
                            estado = 'VENCIDO';
                            urgencia = 'alta';
                        } else if (diasRestantes <= 15) {
                            estado = 'URGENTE';
                            urgencia = 'media';
                        }

                        alertasTemp.push({
                            id: c.id,
                            tipo: 'citv',
                            codigo: c.codigo || 'Sin código',
                            descripcion: `CITV - ${c.tipo || ''} ${c.placa_serie || ''}`.trim(),
                            estado,
                            valor: diasRestantes <= 0 ? 'Vencido' : `${diasRestantes} días`,
                            urgencia,
                            fecha_vencimiento: c.fecha_vencimiento
                        });
                    }
                });
            }

            // Cargar Mantenimientos
            const { data: mantData, error: mantError } = await supabase
                .from('mantenimientos')
                .select('*');

            console.log('Mantenimientos data:', mantData, 'error:', mantError);

            if (mantData) {
                mantData.forEach(m => {
                    // Intentar diferentes campos para horas
                    const horaActual = m.hora_actual || m.horas_actuales || 0;
                    const horaProgramada = m.proxima_hora || m.hora_programada || m.proximo_mantenimiento || 0;

                    if (horaProgramada > 0) {
                        const diferenciaHoras = horaProgramada - horaActual;

                        let estado: 'VENCIDO' | 'URGENTE' | 'PROXIMO' | null = null;
                        let urgencia: 'alta' | 'media' | 'baja' = 'baja';

                        if (diferenciaHoras <= 0) {
                            estado = 'VENCIDO';
                            urgencia = 'alta';
                        } else if (diferenciaHoras <= 50) {
                            estado = 'URGENTE';
                            urgencia = 'media';
                        } else if (diferenciaHoras <= 100) {
                            estado = 'PROXIMO';
                            urgencia = 'baja';
                        }

                        if (estado) {
                            alertasTemp.push({
                                id: m.id,
                                tipo: 'mantenimiento',
                                codigo: m.codigo_maquina || m.codigo || 'Sin código',
                                descripcion: `Mantenimiento - ${m.tipo_mantenimiento || m.descripcion || 'General'}`,
                                estado,
                                valor: `${diferenciaHoras} hrs`,
                                urgencia
                            });
                        }
                    }
                });
            }

            // Ordenar por urgencia
            alertasTemp.sort((a, b) => {
                const orden = { alta: 0, media: 1, baja: 2 };
                return orden[a.urgencia] - orden[b.urgencia];
            });

            setAlertas(alertasTemp);
            setStats({
                mantenimientos: alertasTemp.filter(a => a.tipo === 'mantenimiento').length,
                soat: alertasTemp.filter(a => a.tipo === 'soat').length,
                citv: alertasTemp.filter(a => a.tipo === 'citv').length,
                total: alertasTemp.length
            });

            console.log('Total alertas generadas:', alertasTemp.length);

        } catch (error) {
            console.error('Error cargando alertas:', error);
        } finally {
            setLoading(false);
        }
    }

    async function eliminarRegistro(alerta: Alerta) {
        const tabla = alerta.tipo === 'mantenimiento' ? 'mantenimientos' : alerta.tipo;

        if (!confirm(`¿Eliminar este registro de ${alerta.tipo.toUpperCase()}?\n\nCódigo: ${alerta.codigo}\n${alerta.descripcion}\n\nEsto eliminará el registro de la tabla ${tabla}.`)) {
            return;
        }

        try {
            const supabase = createClient();
            if (!supabase) {
                setMensaje({ tipo: 'error', texto: 'Supabase no configurado' });
                return;
            }

            console.log(`Eliminando de ${tabla} con id: ${alerta.id}`);

            const { error } = await supabase
                .from(tabla)
                .delete()
                .eq('id', alerta.id);

            if (error) {
                console.error('Error eliminando:', error);
                setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
                return;
            }

            setAlertas(prev => prev.filter(a => a.id !== alerta.id));
            setMensaje({ tipo: 'success', texto: `Registro de ${alerta.codigo} eliminado` });

            // Actualizar stats
            setStats(prev => ({
                ...prev,
                [alerta.tipo === 'mantenimiento' ? 'mantenimientos' : alerta.tipo]: prev[alerta.tipo === 'mantenimiento' ? 'mantenimientos' : alerta.tipo] - 1,
                total: prev.total - 1
            }));

        } catch (error) {
            console.error('Error eliminando:', error);
            setMensaje({ tipo: 'error', texto: 'Error al eliminar' });
        }
    }

    async function enviarAlertas() {
        const emailsValidos = emails.filter(e => e.trim() && e.includes('@'));

        if (emailsValidos.length === 0) {
            setMensaje({ tipo: 'error', texto: 'Ingresa al menos un email válido' });
            return;
        }

        setSending(true);
        setMensaje(null);

        try {
            const response = await fetch('/api/alertas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'resumen',
                    destinatarios: emailsValidos
                })
            });

            const result = await response.json();

            if (response.ok) {
                setMensaje({
                    tipo: 'success',
                    texto: `Email enviado exitosamente a ${emailsValidos.length} destinatario(s)`
                });
            } else {
                throw new Error(result.error || 'Error enviando email');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al enviar el email';
            setMensaje({
                tipo: 'error',
                texto: errorMessage
            });
        } finally {
            setSending(false);
        }
    }

    function addEmail() {
        setEmails([...emails, '']);
    }

    function removeEmail(index: number) {
        setEmails(emails.filter((_, i) => i !== index));
    }

    function updateEmail(index: number, value: string) {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);
    }

    function getIconByTipo(tipo: string) {
        switch (tipo) {
            case 'mantenimiento': return <Wrench size={18} />;
            case 'soat': return <FileCheck size={18} />;
            case 'citv': return <ClipboardCheck size={18} />;
            default: return <Bell size={18} />;
        }
    }

    function getColorByUrgencia(urgencia: string) {
        switch (urgencia) {
            case 'alta': return 'border-red-500 bg-red-50';
            case 'media': return 'border-amber-500 bg-amber-50';
            case 'baja': return 'border-blue-500 bg-blue-50';
            default: return 'border-gray-300 bg-gray-50';
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Bell className="text-amber-500" />
                        Centro de Alertas
                    </h1>
                    <p className="text-gray-500 mt-1">Alertas generadas desde SOAT, CITV y Mantenimientos</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={cargarAlertas}
                        className="btn btn-outline"
                        title="Recargar alertas"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="btn btn-primary"
                    >
                        <Mail size={20} />
                        Enviar Alertas
                    </button>
                </div>
            </div>

            {/* Mensaje */}
            {mensaje && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${
                    mensaje.tipo === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    {mensaje.texto}
                    <button onClick={() => setMensaje(null)} className="ml-auto">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Alertas</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Wrench className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-800">{stats.mantenimientos}</p>
                            <p className="text-sm text-gray-500">Mantenimientos</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <FileCheck className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-800">{stats.soat}</p>
                            <p className="text-sm text-gray-500">SOAT</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <ClipboardCheck className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-800">{stats.citv}</p>
                            <p className="text-sm text-gray-500">CITV</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Config Panel */}
            {showConfig && (
                <div className="card p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Settings size={20} />
                        Configurar Envío de Alertas
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="label">Destinatarios</label>
                            {emails.map((email, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="email"
                                        placeholder="ejemplo@empresa.com"
                                        className="input flex-1"
                                        value={email}
                                        onChange={(e) => updateEmail(index, e.target.value)}
                                    />
                                    {emails.length > 1 && (
                                        <button
                                            onClick={() => removeEmail(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={addEmail}
                                className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                            >
                                <Plus size={16} />
                                Agregar otro email
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={enviarAlertas}
                                disabled={sending}
                                className="btn btn-primary"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Enviar Resumen de Alertas
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowConfig(false)}
                                className="btn btn-outline"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de Alertas */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">Alertas Pendientes</h2>
                    <span className="text-sm text-gray-500">
                        Datos de: SOAT, CITV, Mantenimientos
                    </span>
                </div>

                {alertas.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                        <p className="text-xl font-semibold text-gray-800">Todo en orden</p>
                        <p className="text-gray-500">No hay alertas pendientes</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Las alertas se generan cuando hay SOAT/CITV próximos a vencer (30 días)
                            o mantenimientos pendientes (100 horas)
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {alertas.map((alerta) => (
                            <div
                                key={`${alerta.tipo}-${alerta.id}`}
                                className={`p-4 flex items-center gap-4 border-l-4 ${getColorByUrgencia(alerta.urgencia)}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    alerta.urgencia === 'alta' ? 'bg-red-100 text-red-600' :
                                    alerta.urgencia === 'media' ? 'bg-amber-100 text-amber-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {getIconByTipo(alerta.tipo)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">{alerta.codigo}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            alerta.estado === 'VENCIDO' ? 'bg-red-100 text-red-800' :
                                            alerta.estado === 'URGENTE' ? 'bg-amber-100 text-amber-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {alerta.estado}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{alerta.descripcion}</p>
                                    {alerta.fecha_vencimiento && (
                                        <p className="text-xs text-gray-400">
                                            Vence: {new Date(alerta.fecha_vencimiento).toLocaleDateString('es-PE')}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${
                                        alerta.urgencia === 'alta' ? 'text-red-600' :
                                        alerta.urgencia === 'media' ? 'text-amber-600' :
                                        'text-blue-600'
                                    }`}>
                                        {alerta.valor}
                                    </p>
                                    <p className="text-xs text-gray-400 capitalize">{alerta.tipo}</p>
                                </div>
                                <button
                                    onClick={() => eliminarRegistro(alerta)}
                                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                    title={`Eliminar registro de ${alerta.tipo}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
