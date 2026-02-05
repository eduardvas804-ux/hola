'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { puedeCrear, puedeEditar, puedeEliminar } from '@/lib/permisos';
import { Role } from '@/lib/types';
import { Card, Button, ConfirmModal, FilterDropdown } from '@/components/ui';
import {
    HardHat,
    Plus,
    Search,
    X,
    Upload,
    FileText,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    CreditCard,
    Car,
    Stethoscope,
    ChevronDown,
    ChevronUp,
    Trash2,
    Edit,
    Eye,
    Download,
    Check,
    AlertCircle,
} from 'lucide-react';

interface Operador {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    fecha_nacimiento?: string;
    fecha_ingreso?: string;
    cargo?: string;
    maquina_asignada?: string;
    estado: 'ACTIVO' | 'INACTIVO' | 'VACACIONES' | 'LICENCIA';
    licencia_categoria?: string;
    licencia_numero?: string;
    licencia_vencimiento?: string;
    dni_url?: string;
    licencia_url?: string;
    cv_url?: string;
    emo_url?: string;
    foto_url?: string;
    emo_fecha?: string;
    emo_vencimiento?: string;
    emo_resultado?: 'APTO' | 'APTO CON RESTRICCIONES' | 'NO APTO';
    observaciones?: string;
    created_at: string;
}

const ESTADOS = ['ACTIVO', 'INACTIVO', 'VACACIONES', 'LICENCIA'];
const CARGOS = ['OPERADOR', 'CONDUCTOR', 'MECÁNICO', 'AYUDANTE', 'SUPERVISOR'];
const LICENCIAS = ['A-I', 'A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc', 'B-I', 'B-IIa', 'B-IIb', 'B-IIc'];
const EMO_RESULTADOS = ['APTO', 'APTO CON RESTRICCIONES', 'NO APTO'];

// Convertir arrays a formato de FilterDropdown
const ESTADOS_OPTIONS = ESTADOS.map(e => ({ value: e, label: e }));
const CARGOS_OPTIONS = CARGOS.map(c => ({ value: c, label: c }));

const emptyOperador: Partial<Operador> = {
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
    direccion: '',
    cargo: 'OPERADOR',
    estado: 'ACTIVO',
    licencia_categoria: '',
    licencia_numero: '',
};

export default function OperadoresPage() {
    const { profile } = useAuth();
    const [operadores, setOperadores] = useState<Operador[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<string>('');
    const [cargoFilter, setCargoFilter] = useState<string>('');

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [formData, setFormData] = useState<Partial<Operador>>(emptyOperador);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
    const [saving, setSaving] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

    const canCreate = puedeCrear(profile?.rol as Role, 'operadores');
    const canEdit = puedeEditar(profile?.rol as Role, 'operadores');
    const canDelete = puedeEliminar(profile?.rol as Role, 'operadores');

    const fetchOperadores = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            if (!supabase) return;

            const { data, error } = await supabase
                .from('operadores')
                .select('*')
                .order('apellidos', { ascending: true });

            if (error) throw error;
            setOperadores(data || []);
        } catch (error) {
            console.error('Error fetching operadores:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOperadores();
    }, [fetchOperadores]);

    const filteredOperadores = operadores.filter(op => {
        const matchSearch =
            op.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
            op.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
            op.dni.includes(searchTerm);
        const matchEstado = !estadoFilter || op.estado === estadoFilter;
        const matchCargo = !cargoFilter || op.cargo === cargoFilter;
        return matchSearch && matchEstado && matchCargo;
    });

    const handleSave = async () => {
        if (!formData.nombres || !formData.apellidos || !formData.dni) {
            alert('Complete los campos obligatorios: Nombres, Apellidos y DNI');
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();
            if (!supabase) throw new Error('Supabase no configurado');

            if (modalMode === 'create') {
                const { error } = await supabase.from('operadores').insert([formData]);
                if (error) throw error;
            } else if (modalMode === 'edit' && formData.id) {
                const { error } = await supabase
                    .from('operadores')
                    .update(formData)
                    .eq('id', formData.id);
                if (error) throw error;
            }

            await fetchOperadores();
            setShowModal(false);
            setFormData(emptyOperador);
        } catch (error: any) {
            console.error('Error saving:', error);
            alert(error.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete.id) return;

        try {
            const supabase = createClient();
            if (!supabase) throw new Error('Supabase no configurado');

            const { error } = await supabase.from('operadores').delete().eq('id', confirmDelete.id);
            if (error) throw error;

            await fetchOperadores();
            setConfirmDelete({ open: false, id: null });
        } catch (error: any) {
            console.error('Error deleting:', error);
            alert(error.message || 'Error al eliminar');
        }
    };

    const handleFileUpload = async (operadorId: string, field: 'dni_url' | 'licencia_url' | 'cv_url' | 'emo_url', file: File) => {
        setUploadingDoc(field);
        try {
            const supabase = createClient();
            if (!supabase) throw new Error('Supabase no configurado');

            const ext = file.name.split('.').pop();
            const fileName = `${operadorId}/${field.replace('_url', '')}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('operadores-docs')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('operadores-docs').getPublicUrl(fileName);

            await supabase.from('operadores').update({ [field]: urlData.publicUrl }).eq('id', operadorId);

            await fetchOperadores();
        } catch (error: any) {
            console.error('Error uploading:', error);
            alert('Error al subir archivo. Verifique que el bucket "operadores-docs" existe.');
        } finally {
            setUploadingDoc(null);
        }
    };

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'ACTIVO': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'INACTIVO': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'VACACIONES': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'LICENCIA': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDocStatus = (url?: string) => {
        if (url) {
            return <Check className="text-emerald-500" size={16} />;
        }
        return <AlertCircle className="text-red-400" size={16} />;
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <HardHat className="text-amber-500" size={28} />
                        Gestión de Operadores
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Administra el personal y sus documentos
                    </p>
                </div>
                {canCreate && (
                    <Button
                        onClick={() => {
                            setFormData(emptyOperador);
                            setModalMode('create');
                            setShowModal(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600"
                    >
                        <Plus size={20} />
                        Nuevo Operador
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o DNI..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <FilterDropdown
                        label="Estado"
                        value={estadoFilter}
                        onChange={(val) => setEstadoFilter(typeof val === 'string' ? val : val[0] || '')}
                        options={ESTADOS_OPTIONS}
                    />
                    <FilterDropdown
                        label="Cargo"
                        value={cargoFilter}
                        onChange={(val) => setCargoFilter(typeof val === 'string' ? val : val[0] || '')}
                        options={CARGOS_OPTIONS}
                    />
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: operadores.length, color: 'bg-slate-500' },
                    { label: 'Activos', value: operadores.filter(o => o.estado === 'ACTIVO').length, color: 'bg-emerald-500' },
                    { label: 'Vacaciones', value: operadores.filter(o => o.estado === 'VACACIONES').length, color: 'bg-blue-500' },
                    { label: 'Licencia', value: operadores.filter(o => o.estado === 'LICENCIA').length, color: 'bg-amber-500' },
                ].map((stat, i) => (
                    <Card key={i} className="p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white font-bold text-xl`}>
                            {stat.value}
                        </div>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{stat.label}</span>
                    </Card>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredOperadores.length === 0 ? (
                <Card className="p-12 text-center">
                    <HardHat className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                    <p className="text-slate-500">No se encontraron operadores</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredOperadores.map((op) => (
                        <Card key={op.id} className="overflow-hidden">
                            {/* Main Row */}
                            <div
                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                onClick={() => setExpandedId(expandedId === op.id ? null : op.id)}
                            >
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                    {op.nombres.charAt(0)}{op.apellidos.charAt(0)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                                        {op.apellidos}, {op.nombres}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <CreditCard size={14} />
                                            {op.dni}
                                        </span>
                                        {op.cargo && (
                                            <span className="hidden sm:inline">{op.cargo}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Docs Status */}
                                <div className="hidden md:flex items-center gap-2">
                                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs" title="DNI">
                                        <CreditCard size={12} /> {getDocStatus(op.dni_url)}
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs" title="Licencia">
                                        <Car size={12} /> {getDocStatus(op.licencia_url)}
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs" title="CV">
                                        <FileText size={12} /> {getDocStatus(op.cv_url)}
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs" title="EMO">
                                        <Stethoscope size={12} /> {getDocStatus(op.emo_url)}
                                    </div>
                                </div>

                                {/* Status */}
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(op.estado)}`}>
                                    {op.estado}
                                </span>

                                {/* Expand Icon */}
                                {expandedId === op.id ? (
                                    <ChevronUp className="text-slate-400" size={20} />
                                ) : (
                                    <ChevronDown className="text-slate-400" size={20} />
                                )}
                            </div>

                            {/* Expanded Content */}
                            {expandedId === op.id && (
                                <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4">
                                    <div className="grid md:grid-cols-3 gap-6">
                                        {/* Personal Info */}
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <User size={16} /> Datos Personales
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                {op.telefono && (
                                                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Phone size={14} /> {op.telefono}
                                                    </p>
                                                )}
                                                {op.email && (
                                                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Mail size={14} /> {op.email}
                                                    </p>
                                                )}
                                                {op.direccion && (
                                                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <MapPin size={14} /> {op.direccion}
                                                    </p>
                                                )}
                                                {op.fecha_ingreso && (
                                                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Calendar size={14} /> Ingreso: {new Date(op.fecha_ingreso).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* License Info */}
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <Car size={16} /> Licencia de Conducir
                                            </h4>
                                            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                                {op.licencia_categoria && <p>Categoría: {op.licencia_categoria}</p>}
                                                {op.licencia_numero && <p>Número: {op.licencia_numero}</p>}
                                                {op.licencia_vencimiento && (
                                                    <p className={new Date(op.licencia_vencimiento) < new Date() ? 'text-red-500' : ''}>
                                                        Vence: {new Date(op.licencia_vencimiento).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Documents */}
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <FileText size={16} /> Documentos
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { field: 'dni_url' as const, label: 'DNI', url: op.dni_url },
                                                    { field: 'licencia_url' as const, label: 'Licencia', url: op.licencia_url },
                                                    { field: 'cv_url' as const, label: 'CV', url: op.cv_url },
                                                    { field: 'emo_url' as const, label: 'EMO', url: op.emo_url },
                                                ].map((doc) => (
                                                    <div key={doc.field} className="flex items-center gap-2">
                                                        {doc.url ? (
                                                            <a
                                                                href={doc.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                            >
                                                                <Download size={14} /> {doc.label}
                                                            </a>
                                                        ) : canEdit ? (
                                                            <label className="flex items-center gap-1 text-sm text-slate-500 cursor-pointer hover:text-amber-600">
                                                                <input
                                                                    type="file"
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        if (e.target.files?.[0]) {
                                                                            handleFileUpload(op.id, doc.field, e.target.files[0]);
                                                                        }
                                                                    }}
                                                                />
                                                                {uploadingDoc === doc.field ? (
                                                                    <span className="animate-pulse">Subiendo...</span>
                                                                ) : (
                                                                    <>
                                                                        <Upload size={14} /> {doc.label}
                                                                    </>
                                                                )}
                                                            </label>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">{doc.label}: N/A</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setFormData(op);
                                                setModalMode('view');
                                                setShowModal(true);
                                            }}
                                        >
                                            <Eye size={16} /> Ver
                                        </Button>
                                        {canEdit && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setFormData(op);
                                                    setModalMode('edit');
                                                    setShowModal(true);
                                                }}
                                            >
                                                <Edit size={16} /> Editar
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <Button
                                                variant="ghost"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => setConfirmDelete({ open: true, id: op.id })}
                                            >
                                                <Trash2 size={16} /> Eliminar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {modalMode === 'create' ? 'Nuevo Operador' : modalMode === 'edit' ? 'Editar Operador' : 'Detalle Operador'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <User size={18} /> Datos Personales
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nombres *</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.nombres || ''}
                                            onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Apellidos *</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.apellidos || ''}
                                            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">DNI *</label>
                                        <input
                                            type="text"
                                            maxLength={8}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.dni || ''}
                                            onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.telefono || ''}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Dirección</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.direccion || ''}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Work Info */}
                            <div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <HardHat size={18} /> Información Laboral
                                </h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Cargo</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.cargo || ''}
                                            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        >
                                            {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Estado</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.estado || 'ACTIVO'}
                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value as Operador['estado'] })}
                                            disabled={modalMode === 'view'}
                                        >
                                            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha Ingreso</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.fecha_ingreso || ''}
                                            onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* License Info */}
                            <div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <Car size={18} /> Licencia de Conducir
                                </h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Categoría</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.licencia_categoria || ''}
                                            onChange={(e) => setFormData({ ...formData, licencia_categoria: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {LICENCIAS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Número</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.licencia_numero || ''}
                                            onChange={(e) => setFormData({ ...formData, licencia_numero: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Vencimiento</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.licencia_vencimiento || ''}
                                            onChange={(e) => setFormData({ ...formData, licencia_vencimiento: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* EMO */}
                            <div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <Stethoscope size={18} /> Examen Médico Ocupacional
                                </h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha EMO</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.emo_fecha || ''}
                                            onChange={(e) => setFormData({ ...formData, emo_fecha: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Vencimiento EMO</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.emo_vencimiento || ''}
                                            onChange={(e) => setFormData({ ...formData, emo_vencimiento: e.target.value })}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Resultado</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                            value={formData.emo_resultado || ''}
                                            onChange={(e) => setFormData({ ...formData, emo_resultado: e.target.value as Operador['emo_resultado'] })}
                                            disabled={modalMode === 'view'}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {EMO_RESULTADOS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Observations */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Observaciones</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white resize-none"
                                    value={formData.observaciones || ''}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        {modalMode !== 'view' && (
                            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Confirm Delete */}
            <ConfirmModal
                isOpen={confirmDelete.open}
                title="Eliminar Operador"
                message="¿Está seguro de eliminar este operador? Esta acción no se puede deshacer."
                onConfirm={handleDelete}
                onClose={() => setConfirmDelete({ open: false, id: null })}
            />
        </div>
    );
}
