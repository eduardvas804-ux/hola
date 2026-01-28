'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useState } from 'react';

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
    const [collapsed, setCollapsed] = useState(false);

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
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    {!collapsed && <span className="text-sm">Colapsar</span>}
                </button>
            </div>

            {/* Company Info */}
            {!collapsed && (
                <div className="p-4 bg-black/20">
                    <p className="text-blue-200 text-xs text-center">
                        Grupo Vásquez © 2026
                    </p>
                </div>
            )}
        </aside>
    );
}
