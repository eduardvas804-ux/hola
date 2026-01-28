'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/components/auth-provider';
import { useSidebar } from '@/components/sidebar-context';
import { Loader2 } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { loading } = useAuth();
    const { collapsed } = useSidebar();
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
            <main className={`flex-1 p-8 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
                {children}
            </main>
        </div>
    );
}
