'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useSidebar } from '@/components/sidebar-context';
import {
    LayoutDashboard,
    Truck,
    Wrench,
    FileCheck,
    ClipboardCheck,
    Filter,
    Upload,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Users,
    Shield
} from 'lucide-react';

const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/maquinaria', label: 'Maquinaria', icon: Truck },
    { href: '/mantenimientos', label: 'Mantenimientos', icon: Wrench },
    { href: '/soat', label: 'Control SOAT', icon: FileCheck },
    { href: '/citv', label: 'Revisiones CITV', icon: ClipboardCheck },
    { href: '/filtros', label: 'Filtros', icon: Filter },
    { href: '/importar', label: 'Importar Datos', icon: Upload },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggleCollapsed } = useSidebar();
    const { profile, isAdmin, signOut } = useAuth();

    return (
        <aside
            className={`sidebar fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        M
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-white font-bold text-lg">MAQUINARIA</h1>
                            <p className="text-blue-200 text-xs">PRO Control</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 overflow-y-auto">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`sidebar-link flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white ${isActive ? 'active text-white' : ''
                                        }`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <Icon size={22} className={isActive ? 'text-blue-300' : ''} />
                                    {!collapsed && (
                                        <span className="font-medium">{item.label}</span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}

                    {/* Admin Section */}
                    {isAdmin && (
                        <>
                            <div className="my-4 border-t border-white/10 mx-4"></div>
                            <li>
                                <Link
                                    href="/admin/usuarios"
                                    className={`sidebar-link flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white ${pathname === '/admin/usuarios' ? 'active text-white' : ''
                                        }`}
                                    title={collapsed ? 'Usuarios' : undefined}
                                >
                                    <Users size={22} className="text-amber-400" />
                                    {!collapsed && (
                                        <span className="font-medium">Gestión Usuarios</span>
                                    )}
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </nav>

            {/* User Profile & Footer */}
            <div className="border-t border-white/10 bg-black/20">
                {/* Profile Info */}
                {!collapsed && profile && (
                    <div className="p-4 flex items-center gap-3 border-b border-white/5">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            {profile.nombre_completo.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-white text-sm font-medium truncate">{profile.nombre_completo}</p>
                            <p className="text-blue-200 text-xs flex items-center gap-1 capitalize">
                                <Shield size={10} />
                                {profile.rol}
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-2 flex gap-1 justify-between">
                    <button
                        onClick={toggleCollapsed}
                        className="flex-1 flex items-center justify-center py-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                        title={collapsed ? "Expandir" : "Colapsar"}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    <button
                        onClick={signOut}
                        className="flex-1 flex items-center justify-center py-2 text-red-300 hover:text-red-100 transition-colors rounded-lg hover:bg-red-500/20"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
