'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { UserProfile, Role } from '@/lib/types';
import {
    UserPlus,
    Search,
    Shield,
    CheckCircle,
    XCircle,
    Edit,
    Save,
    Crown,
    Eye,
    Wrench,
    X
} from 'lucide-react';

// Definición de roles y sus permisos
const ROLES_INFO: Record<Role, { label: string; description: string; color: string; bgColor: string; icon: any; permisos: string[] }> = {
    admin: {
        label: 'Administrador',
        description: 'Control total del sistema',
        color: 'text-purple-800',
        bgColor: 'bg-purple-100',
        icon: Crown,
        permisos: ['Gestión de usuarios', 'Configuración del sistema', 'Importar/Exportar datos', 'Editar toda la información', 'Ver reportes completos']
    },
    supervisor: {
        label: 'Supervisor',
        description: 'Gestión operativa',
        color: 'text-blue-800',
        bgColor: 'bg-blue-100',
        icon: Shield,
        permisos: ['Editar maquinaria y mantenimientos', 'Registrar mantenimientos', 'Ver todos los reportes', 'Exportar datos']
    },
    operador: {
        label: 'Operador',
        description: 'Registro diario',
        color: 'text-green-800',
        bgColor: 'bg-green-100',
        icon: Wrench,
        permisos: ['Registrar horas trabajadas', 'Ver su maquinaria asignada', 'Reportar incidencias']
    },
    visualizador: {
        label: 'Visualizador',
        description: 'Solo lectura',
        color: 'text-gray-800',
        bgColor: 'bg-gray-100',
        icon: Eye,
        permisos: ['Ver dashboard', 'Ver reportes', 'Sin permisos de edición']
    }
};

export default function UsuariosPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRol, setFilterRol] = useState<Role | ''>('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        nombre_completo: '',
        rol: 'operador' as Role,
        estado: true
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const supabase = createClient();
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveUser() {
        try {
            const supabase = createClient();
            if (!supabase) {
                alert('Error: Supabase no está configurado');
                return;
            }

            if (editingUser) {
                const { error } = await supabase
                    .from('perfiles')
                    .update({
                        nombre_completo: formData.nombre_completo,
                        rol: formData.rol,
                        estado: formData.estado
                    })
                    .eq('id', editingUser.id);

                if (error) throw error;
            } else {
                if (!formData.email || !formData.nombre_completo) {
                    alert('Email y Nombre son obligatorios');
                    return;
                }

                const password = prompt('Ingrese la contraseña para el nuevo usuario:');
                if (!password) return;

                const response = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: password,
                        nombre_completo: formData.nombre_completo,
                        rol: formData.rol
                    })
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Error creando usuario');
                }

                alert('Usuario creado exitosamente.');
            }

            setShowModal(false);
            fetchUsers();
            resetForm();
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert('Error: ' + (error.message || 'Error desconocido'));
        }
    }

    function resetForm() {
        setFormData({
            email: '',
            nombre_completo: '',
            rol: 'operador',
            estado: true
        });
        setEditingUser(null);
    }

    function handleEdit(user: UserProfile) {
        setEditingUser(user);
        setFormData({
            email: user.email,
            nombre_completo: user.nombre_completo,
            rol: user.rol,
            estado: user.estado
        });
        setShowModal(true);
    }

    // Estadísticas por rol
    const statsByRole = {
        admin: users.filter(u => u.rol === 'admin').length,
        supervisor: users.filter(u => u.rol === 'supervisor').length,
        operador: users.filter(u => u.rol === 'operador').length,
        visualizador: users.filter(u => u.rol === 'visualizador').length,
    };

    const filteredUsers = users.filter(u => {
        const matchSearch = u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRol = !filterRol || u.rol === filterRol;
        return matchSearch && matchRol;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                    <p className="text-gray-500 mt-1">Administra accesos y roles del sistema</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn btn-primary w-full sm:w-auto"
                >
                    <UserPlus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            {/* Tarjetas de Roles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {(Object.keys(ROLES_INFO) as Role[]).map((rol) => {
                    const info = ROLES_INFO[rol];
                    const Icon = info.icon;
                    const count = statsByRole[rol];
                    const isActive = filterRol === rol;

                    return (
                        <button
                            key={rol}
                            onClick={() => setFilterRol(isActive ? '' : rol)}
                            className={`card p-4 text-left transition-all ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${info.bgColor} flex items-center justify-center`}>
                                    <Icon className={info.color} size={20} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{count}</p>
                                    <p className="text-xs text-gray-500">{info.label}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Búsqueda y Filtros */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            className="input pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input sm:w-48"
                        value={filterRol}
                        onChange={(e) => setFilterRol(e.target.value as Role | '')}
                    >
                        <option value="">Todos los roles</option>
                        {(Object.keys(ROLES_INFO) as Role[]).map(rol => (
                            <option key={rol} value={rol}>{ROLES_INFO[rol].label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de Usuarios - Vista Móvil y Desktop */}
            <div className="space-y-3 sm:hidden">
                {loading ? (
                    <div className="card p-8 text-center text-gray-500">Cargando usuarios...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="card p-8 text-center text-gray-500">No se encontraron usuarios</div>
                ) : (
                    filteredUsers.map((user) => {
                        const roleInfo = ROLES_INFO[user.rol];
                        const RoleIcon = roleInfo.icon;
                        return (
                            <div key={user.id} className="card p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
                                            {user.nombre_completo.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{user.nombre_completo}</p>
                                            <p className="text-gray-500 text-sm">{user.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
                                        <RoleIcon size={12} className="mr-1" />
                                        {roleInfo.label}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                                        ${user.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.estado ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                        {user.estado ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Tabla Desktop */}
            <div className="card overflow-hidden hidden sm:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-700">Usuario</th>
                                <th className="p-4 font-semibold text-gray-700">Rol</th>
                                <th className="p-4 font-semibold text-gray-700">Permisos</th>
                                <th className="p-4 font-semibold text-gray-700">Estado</th>
                                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const roleInfo = ROLES_INFO[user.rol];
                                    const RoleIcon = roleInfo.icon;
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                                        {user.nombre_completo.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.nombre_completo}</p>
                                                        <p className="text-gray-500 text-xs">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
                                                    <RoleIcon size={12} className="mr-1" />
                                                    {roleInfo.label}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-gray-600">{roleInfo.description}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                                                    ${user.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {user.estado ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    {user.estado ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Edición */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4">
                            {!editingUser && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                                    <p className="font-bold mb-1">Nuevo Usuario:</p>
                                    <p>Se creará una cuenta de acceso y un perfil asociado.</p>
                                </div>
                            )}

                            <div>
                                <label className="label">Nombre Completo</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.nombre_completo}
                                    onChange={e => setFormData({ ...formData, nombre_completo: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Correo Electrónico</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!!editingUser}
                                />
                            </div>

                            <div>
                                <label className="label">Rol / Jerarquía</label>
                                <div className="grid grid-cols-1 gap-2 mt-2">
                                    {(Object.keys(ROLES_INFO) as Role[]).map((rol) => {
                                        const info = ROLES_INFO[rol];
                                        const Icon = info.icon;
                                        const isSelected = formData.rol === rol;

                                        return (
                                            <button
                                                key={rol}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, rol })}
                                                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all
                                                    ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg ${info.bgColor} flex items-center justify-center shrink-0`}>
                                                    <Icon className={info.color} size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900">{info.label}</p>
                                                        {isSelected && <CheckCircle size={16} className="text-blue-500" />}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{info.description}</p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {info.permisos.slice(0, 2).map((permiso, i) => (
                                                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                                {permiso}
                                                            </span>
                                                        ))}
                                                        {info.permisos.length > 2 && (
                                                            <span className="text-xs text-gray-400">+{info.permisos.length - 2} más</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <span className="text-sm font-medium text-gray-700">Estado:</span>
                                <button
                                    type="button"
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.estado ? 'bg-green-500' : 'bg-gray-300'}`}
                                    onClick={() => setFormData({ ...formData, estado: !formData.estado })}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.estado ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm text-gray-600">{formData.estado ? 'Activo' : 'Inactivo'}</span>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-outline w-full sm:w-auto"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveUser}
                                className="btn btn-primary w-full sm:w-auto"
                            >
                                <Save size={18} />
                                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
