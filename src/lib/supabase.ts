import { createClient as createClientJS, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Validar que la URL y key sean válidas
function isValidConfig(url: string | undefined, key: string | undefined): boolean {
    if (!url || !key) return false;
    if (url.length < 10 || key.length < 10) return false;
    if (!url.startsWith('https://')) return false;
    return true;
}

export function createClient(): SupabaseClient | null {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isValidConfig(url, key)) {
        console.warn('⚠️ Supabase no configurado correctamente');
        console.warn('URL:', url ? 'presente' : 'falta');
        console.warn('KEY:', key ? 'presente' : 'falta');
        return null;
    }

    try {
        supabaseInstance = createClientJS(url!, key!, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            },
            global: {
                headers: {
                    'X-Client-Info': 'maquinaria-pro'
                }
            }
        });
        return supabaseInstance;
    } catch (error) {
        console.error('Error creando cliente Supabase:', error);
        return null;
    }
}

export const createAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error('Variables de Supabase no configuradas');
    }

    return createClientJS(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
