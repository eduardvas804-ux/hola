'use client';

import { useState, useEffect } from 'react';
import {
    Bell,
    Mail,
    Send,
    AlertTriangle,
    CheckCircle,
    Clock,
    FileCheck,
    ClipboardCheck,
    Wrench,
    Plus,
    X,
    Loader2,
    Settings
} from 'lucide-react';
import { fetchTable } from '@/lib/api';

interface Alerta {
    tipo: 'mantenimiento' | 'soat' | 'citv';
    codigo: string;
    descripcion: string;
    estado: string;
    valor: string;
    urgencia: 'alta' | 'media' | 'baja';
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

    async function cargarAlertas() {
        setLoading(true);
        const alertasTemp: Alerta[] = [];

        try {
            // Cargar mantenimientos
            const mantenimientos = await fetchTable<any>('mantenimientos');
            mantenimientos.forEach(m => {
                if (['VENCIDO', 'URGENTE', 'PROXIMO'].includes(m.estado_alerta)) {
                    alertasTemp.push({
                        tipo: 'mantenimiento',
                        codigo: m.codigo_maquina,
                        descripcion: `${m.tipo || 'Mantenimiento'} - ${m.tipo_mantenimiento || ''}`,
                        estado: m.estado_alerta,
                        valor: `${m.diferencia_horas} hrs`,
                        urgencia: m.estado_alerta === 'VENCIDO' ? 'alta' : m.estado_alerta === 'URGENTE' ? 'media' : 'baja'
                    });
                }
            });

            // Cargar SOAT
            const soat = await fetchTable<any>('soat');
            soat.forEach(s => {
                if (s.dias_restantes < 30) {
                    alertasTemp.push({
                        tipo: 'soat',
                        codigo: s.codigo,
                        descripcion: `SOAT - ${s.tipo || 'Vehículo'}`,
                        estado: s.dias_restantes <= 0 ? 'VENCIDO' : s.dias_restantes <= 15 ? 'URGENTE' : 'PROXIMO',
                        valor: s.dias_restantes <= 0 ? 'Vencido' : `${s.dias_restantes} días`,
                        urgencia: s.dias_restantes <= 0 ? 'alta' : s.dias_restantes <= 15 ? 'media' : 'baja'
                    });
                }
            });

            // Cargar CITV
            const citv = await fetchTable<any>('citv');
            citv.forEach(c => {
                if (c.dias_restantes < 30) {
                    alertasTemp.push({
                        tipo: 'citv',
                        codigo: c.codigo,
                        descripcion: `CITV - ${c.tipo || 'Vehículo'}`,
                        estado: c.dias_restantes <= 0 ? 'VENCIDO' : c.dias_restantes <= 15 ? 'URGENTE' : 'PROXIMO',
                        valor: c.dias_restantes <= 0 ? 'Vencido' : `${c.dias_restantes} días`,
                        urgencia: c.dias_restantes <= 0 ? 'alta' : c.dias_restantes <= 15 ? 'media' : 'baja'
                    });
                }
            });

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

        } catch (error) {
            console.error('Error cargando alertas:', error);
        } finally {
            setLoading(false);
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
        } catch (error: any) {
            setMensaje({
                tipo: 'error',
                texto: error.message || 'Error al enviar el email'
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
                    <p className="text-gray-500 mt-1">Gestiona y envía alertas por email</p>
                </div>
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="btn btn-primary"
                >
                    <Mail size={20} />
                    Enviar Alertas
                </button>
            </div>

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

                        {mensaje && (
                            <div className={`p-4 rounded-lg flex items-center gap-2 ${
                                mensaje.tipo === 'success'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                {mensaje.texto}
                            </div>
                        )}

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
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800">Alertas Pendientes</h2>
                </div>

                {alertas.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                        <p className="text-xl font-semibold text-gray-800">Todo en orden</p>
                        <p className="text-gray-500">No hay alertas pendientes</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {alertas.map((alerta, index) => (
                            <div
                                key={index}
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
