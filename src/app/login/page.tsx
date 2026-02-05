'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, HardHat, Cog } from 'lucide-react';
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
            if (!supabase) {
                setError('Error de configuración: Variables de entorno no configuradas en el servidor.');
                setLoading(false);
                return;
            }

            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message.includes('Invalid login')) {
                    setError('Credenciales incorrectas');
                } else {
                    setError(authError.message);
                }
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Error de conexión. Verifique su internet o contacte al administrador.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Dynamic Background with Excavator */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/login-bg.png"
                        alt="Excavadora en obra"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo Section */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Cog className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">GESTIÓN DE</h1>
                            <h1 className="text-2xl font-bold text-amber-400 tracking-tight">MAQUINARIA</h1>
                        </div>
                    </div>

                    {/* Main Text */}
                    <div className="max-w-lg">
                        <h2 className="text-5xl font-bold text-white leading-tight mb-6">
                            Control Total de tu
                            <span className="text-amber-400"> Flota</span>
                        </h2>
                        <p className="text-xl text-slate-300 leading-relaxed">
                            Sistema integral para la gestión de maquinaria pesada,
                            mantenimientos preventivos, documentación y control de combustible.
                        </p>

                        {/* Features */}
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            {[
                                { icon: '🚜', text: 'Gestión de Flota' },
                                { icon: '🔧', text: 'Mantenimientos' },
                                { icon: '⛽', text: 'Control Combustible' },
                                { icon: '📋', text: 'Documentación' },
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                                    <span className="text-2xl">{feature.icon}</span>
                                    <span className="text-white font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-slate-400 text-sm">
                        © 2026 Grupo Vásquez. Todos los derechos reservados.
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                                <Cog className="text-white" size={28} />
                            </div>
                            <div className="text-left">
                                <h1 className="text-lg font-bold text-slate-800">GESTIÓN DE</h1>
                                <h1 className="text-lg font-bold text-amber-500">MAQUINARIA</h1>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center lg:text-left mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white mb-6 shadow-xl">
                            <HardHat size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                            Bienvenido
                        </h2>
                        <p className="mt-2 text-slate-500">
                            Ingrese sus credenciales para acceder al sistema
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleAuth}>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white text-slate-900 placeholder:text-slate-400"
                                        placeholder="usuario@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white text-slate-900 placeholder:text-slate-400"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl animate-shake">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5" />
                                    Procesando...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>

                        <div className="text-center text-xs text-slate-400 mt-8 pt-6 border-t border-slate-200">
                            Sistema de Gestión Interna v2.0
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
