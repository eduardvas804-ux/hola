'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useSidebar } from '@/components/sidebar-context';
import { useTheme } from '@/components/ThemeProvider';
import { puedeVer, Seccion } from '@/lib/permisos';
import { Role } from '@/lib/types';
import InstallPrompt from '@/components/InstallPrompt';
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
    Shield,
    X,
    History,
    Bell,
    Fuel,
    FileSpreadsheet,
    FileText,
    Sun,
    Moon,
    HardHat,
    Cog,
} from 'lucide-react';

const menuItems: { href: string; label: string; icon: any; seccion: Seccion }[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, seccion: 'dashboard' },
    { href: '/maquinaria', label: 'Maquinaria', icon: Truck, seccion: 'maquinaria' },
    { href: '/operadores', label: 'Operadores', icon: HardHat, seccion: 'operadores' },
    { href: '/mantenimientos', label: 'Mantenimientos', icon: Wrench, seccion: 'mantenimientos' },
    { href: '/combustible', label: 'Combustible', icon: Fuel, seccion: 'combustible' },
    { href: '/soat', label: 'Control SOAT', icon: FileCheck, seccion: 'soat' },
    { href: '/citv', label: 'Revisiones CITV', icon: ClipboardCheck, seccion: 'citv' },
    { href: '/filtros', label: 'Filtros', icon: Filter, seccion: 'filtros' },
    { href: '/valorizaciones', label: 'Valorizaciones', icon: FileSpreadsheet, seccion: 'valorizaciones' },
    { href: '/reportes', label: 'Reportes PDF', icon: FileText, seccion: 'reportes' },
    { href: '/alertas', label: 'Alertas Email', icon: Bell, seccion: 'alertas' },
    { href: '/importar', label: 'Importar Datos', icon: Upload, seccion: 'importar' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen, isMobile } = useSidebar();
    const { profile, isAdmin, signOut } = useAuth();
    const { resolvedTheme, toggleTheme } = useTheme();

    const handleLinkClick = () => {
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    return (
        <>
            {/* Overlay para móvil */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-fadeIn"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`sidebar fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-50
                    ${isMobile
                        ? mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
                        : collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                <Cog size={22} />
                            </div>
                            {(!collapsed || isMobile) && (
                                <div>
                                    <h1 className="text-white font-bold text-sm">GESTIÓN DE</h1>
                                    <p className="text-amber-400 text-xs font-bold">MAQUINARIA</p>
                                </div>
                            )}
                        </div>
                        {isMobile && (
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="text-white/70 hover:text-white p-2"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 overflow-y-auto scrollbar-thin">
                    <ul className="space-y-1">
                        {menuItems
                            .filter((item) => puedeVer(profile?.rol as Role, item.seccion))
                            .map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={handleLinkClick}
                                            className={`sidebar-link flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white ${isActive ? 'active text-white' : ''
                                                }`}
                                            title={collapsed && !isMobile ? item.label : undefined}
                                        >
                                            <Icon size={22} className={isActive ? 'text-blue-300' : ''} />
                                            {(!collapsed || isMobile) && (
                                                <span className="font-medium">{item.label}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}

                        {/* Admin Section - Usuarios */}
                        {puedeVer(profile?.rol as Role, 'usuarios') && (
                            <>
                                <div className="my-4 border-t border-white/10 mx-4"></div>
                                <li>
                                    <Link
                                        href="/admin/usuarios"
                                        onClick={handleLinkClick}
                                        className={`sidebar-link flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white ${pathname === '/admin/usuarios' ? 'active text-white' : ''
                                            }`}
                                        title={collapsed && !isMobile ? 'Usuarios' : undefined}
                                    >
                                        <Users size={22} className="text-amber-400" />
                                        {(!collapsed || isMobile) && (
                                            <span className="font-medium">Gestión Usuarios</span>
                                        )}
                                    </Link>
                                </li>
                            </>
                        )}
                        {/* Admin Section - Historial */}
                        {puedeVer(profile?.rol as Role, 'historial') && (
                            <li>
                                <Link
                                    href="/historial"
                                    onClick={handleLinkClick}
                                    className={`sidebar-link flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white ${pathname === '/historial' ? 'active text-white' : ''
                                        }`}
                                    title={collapsed && !isMobile ? 'Historial' : undefined}
                                >
                                    <History size={22} className="text-cyan-400" />
                                    {(!collapsed || isMobile) && (
                                        <span className="font-medium">Historial Cambios</span>
                                    )}
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>

                {/* User Profile & Footer */}
                <div className="border-t border-white/10 bg-black/20">
                    {/* Profile Info */}
                    {(!collapsed || isMobile) && profile && (
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

                    {/* Theme Toggle & Actions */}
                    <div className="p-2 space-y-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10 ${collapsed && !isMobile ? 'justify-center' : ''}`}
                            title={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        >
                            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            {(!collapsed || isMobile) && (
                                <span className="text-sm">{resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                            )}
                        </button>


                        {/* Install PWA Button */}
                        {(!collapsed || isMobile) && <InstallPrompt />}

                        <div className="flex gap-1">
                            {!isMobile && (
                                <button
                                    onClick={toggleCollapsed}
                                    className="flex-1 flex items-center justify-center py-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                                    title={collapsed ? "Expandir" : "Colapsar"}
                                >
                                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                                </button>
                            )}

                            <button
                                onClick={signOut}
                                className={`flex items-center justify-center gap-2 py-2 text-red-300 hover:text-red-100 transition-colors rounded-lg hover:bg-red-500/20 ${isMobile ? 'flex-1' : 'flex-1'}`}
                                title="Cerrar Sesión"
                            >
                                <LogOut size={18} />
                                {isMobile && <span className="text-sm">Cerrar Sesión</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
