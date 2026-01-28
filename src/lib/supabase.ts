import { createClient as createClientJS, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error('⚠️ Supabase URL o Key no configuradas');
    }

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
}

export const createAdminClient = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
    }
    return createClientJS(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};
