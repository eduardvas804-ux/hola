'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleAuth(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Side - Image & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 z-0 opacity-40">
                    {/* Placeholder for corporate image - using a generic construction background pattern or color */}
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2544&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
                </div>

                <div className="relative z-10 text-center px-10">
                    <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl">
                        <Truck size={64} className="text-blue-400 mx-auto mb-6" />
                        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">MAQUINARIA PRO</h1>
                        <p className="text-blue-100 text-lg max-w-md mx-auto leading-relaxed">
                            Sistema Integral de Gestión de Flota, Mantenimientos y Documentación Técnica.
                        </p>
                    </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-700 mb-6 lg:hidden">
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                            Bienvenido
                        </h2>
                        <p className="mt-2 text-slate-500">
                            Ingrese sus credenciales para acceder al panel de control.
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-slate-900"
                                        placeholder="usuario@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-slate-900"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                        Procesando...
                                    </>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </div>



                        <div className="text-center text-xs text-slate-400 mt-8">
                            &copy; 2026 Grupo Vásquez. Sistema de Gestión Interna.
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function AlertCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    );
}
