'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { clearTokenCache } from '@/lib/api';
import { User, Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

type Role = 'admin' | 'supervisor' | 'operador' | 'visualizador';

interface UserProfile {
    id: string;
    email: string;
    nombre_completo: string;
    rol: Role;
    estado: boolean;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    isSupervisor: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isAdmin: false,
    isSupervisor: false,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;
        const maxRetries = 2; // Reducido para inicio más rápido
        const supabase = createClient();

        // Si Supabase no está configurado, no intentar autenticar
        if (!supabase) {
            console.warn('⚠️ Supabase no configurado - modo sin autenticación');
            setLoading(false);
            return;
        }

        async function initAuth() {
            if (!supabase) return;
            try {
                // Timeout reducido a 3s para respuesta más rápida
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);

                const { data: { session }, error } = await supabase.auth.getSession();
                clearTimeout(timeout);

                if (!isMounted) return;

                if (error) {
                    console.error('Error getting session:', error);
                    // Solo un reintento rápido
                    if (retryCount < maxRetries) {
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, 500));
                        return initAuth();
                    }
                    setLoading(false);
                    return;
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Fetch profile en paralelo, no bloquear
                    fetchProfile(session.user.id);
                } else {
                    setLoading(false);
                }
            } catch (err: any) {
                if (!isMounted) return;
                console.error('Auth initialization error:', err);

                // Reintentar solo una vez
                if (retryCount < maxRetries && err.name !== 'AbortError') {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return initAuth();
                }
                setLoading(false);
            }
        }

        // Iniciar autenticación
        initAuth();

        // SAFETY NET: Timeout reducido a 5 segundos
        const absoluteTimeout = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('⚠️ Timeout de autenticación - liberando loading');
                setLoading(false);
            }
        }, 5000);

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                console.log('Auth state changed:', event);

                // Evitar recargas innecesarias en eventos de TOKEN_REFRESHED
                if (event === 'TOKEN_REFRESHED') {
                    setSession(session);
                    return;
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Solo recargar perfil si es un evento significativo
                    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                        await fetchProfile(session.user.id);
                    }
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            isMounted = false;
            clearTimeout(absoluteTimeout);
            subscription.unsubscribe();
        };
    }, []);

    async function fetchProfile(userId: string) {
        try {
            const supabase = createClient();
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(); // maybeSingle no lanza error si no encuentra

            if (error) {
                console.log('Error consultando perfil:', error.message);
            }

            if (!data) {
                console.log('Perfil no encontrado, usando perfil por defecto...');

                // Obtener email del usuario actual
                const { data: userData } = await supabase.auth.getUser();
                const userEmail = userData?.user?.email || '';

                // Crear perfil por defecto (solo local)
                const defaultProfile: UserProfile = {
                    id: userId,
                    email: userEmail,
                    nombre_completo: userEmail.split('@')[0] || 'Usuario',
                    rol: 'admin',
                    estado: true
                };

                // Intentar insertar el perfil en background
                supabase.from('perfiles').insert([defaultProfile]).then(({ error: insertError }) => {
                    if (insertError) {
                        console.log('Info: Perfil no guardado en DB:', insertError.message);
                    } else {
                        console.log('✅ Perfil guardado en DB');
                    }
                });

                setProfile(defaultProfile);
            } else {
                console.log('✅ Perfil cargado:', data.nombre_completo);
                setProfile(data);
            }
        } catch (error: any) {
            // Ignorar errores de abort
            if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
                return;
            }
            console.error('Error en fetchProfile:', error);
            setProfile({
                id: userId,
                email: '',
                nombre_completo: 'Usuario',
                rol: 'operador',
                estado: true
            });
        } finally {
            setLoading(false);
        }
    }

    async function signOut() {
        clearTokenCache(); // Limpiar cache de tokens
        const supabase = createClient();
        if (supabase) {
            await supabase.auth.signOut();
        }
        router.push('/login');
    }

    // Ruta protegida
    useEffect(() => {
        if (!loading) {
            if (!user && pathname !== '/login') {
                router.push('/login');
            } else if (user && pathname === '/login') {
                router.push('/');
            }
        }
    }, [user, loading, pathname, router]);

    const value = {
        user,
        profile,
        session,
        loading,
        isAdmin: profile?.rol === 'admin',
        isSupervisor: profile?.rol === 'supervisor' || profile?.rol === 'admin',
        signOut,
    };

    // Mostrar loading mientras se verifica la sesión
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 font-medium">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
