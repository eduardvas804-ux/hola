import { createClient as createClientJS, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient | null {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn('⚠️ Supabase URL o Key no configuradas');
        return null;
    }

    supabaseInstance = createClientJS(url, key, {
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
