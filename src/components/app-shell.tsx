'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import GlobalSearch from '@/components/GlobalSearch';
import { useAuth } from '@/components/auth-provider';
import { useSidebar } from '@/components/sidebar-context';
import { Loader2, Menu } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { loading } = useAuth();
    const { collapsed, isMobile, toggleMobile } = useSidebar();
    const isLoginPage = pathname === '/login';

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                    <p className="text-slate-500 font-medium">Cargando sistema...</p>
                </div>
            </div>
        );
    }

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />

            {/* Header móvil */}
            {isMobile && (
                <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#1E3A5F] to-[#152a43] z-30 flex items-center justify-between px-4 shadow-lg">
                    <div className="flex items-center">
                        <button
                            onClick={toggleMobile}
                            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="ml-3 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow">
                                M
                            </div>
                            <span className="text-white font-semibold">MAQUINARIA PRO</span>
                        </div>
                    </div>
                    <GlobalSearch />
                </header>
            )}

            <main className={`flex-1 transition-all duration-300
                ${isMobile ? 'ml-0 pt-16 p-4' : collapsed ? 'ml-20 p-8' : 'ml-64 p-8'}`}>
                {children}
            </main>
        </div>
    );
}
