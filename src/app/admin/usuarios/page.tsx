'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { UserProfile, Role } from '@/lib/types';
import {
    Users,
    UserPlus,
    Search,
    MoreVertical,
    Shield,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    Save
} from 'lucide-react';

export default function UsuariosPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    // Form states
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
                // Actualizar perfil existente
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
                // Crear Nuevo Usuario (Vía API)
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

    const filteredUsers = users.filter(u =>
        u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                    <p className="text-gray-500 mt-1">Administra accesos y roles del sistema</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn btn-primary"
                >
                    <UserPlus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="card p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        className="input pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-700">Usuario</th>
                                <th className="p-4 font-semibold text-gray-700">Rol</th>
                                <th className="p-4 font-semibold text-gray-700">Estado</th>
                                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
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
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${user.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.rol === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {user.rol === 'admin' && <Shield size={12} className="mr-1" />}
                                                {user.rol}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${user.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.estado ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {user.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Edición */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                        </div>

                        <div className="p-6 space-y-4">
                            {!editingUser && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4">
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
                                <label className="label">Rol</label>
                                <select
                                    className="input"
                                    value={formData.rol}
                                    onChange={e => setFormData({ ...formData, rol: e.target.value as Role })}
                                >
                                    <option value="operador">Operador</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="admin">Administrador</option>
                                    <option value="visualizador">Visualizador</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <span className="text-sm font-medium text-gray-700">Estado:</span>
                                <button
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.estado ? 'bg-green-500' : 'bg-gray-300'}`}
                                    onClick={() => setFormData({ ...formData, estado: !formData.estado })}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.estado ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm text-gray-600">{formData.estado ? 'Activo' : 'Inactivo'}</span>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-outline"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveUser}
                                className="btn btn-primary"
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
