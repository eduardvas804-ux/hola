import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, nombre_completo, rol } = body;

        console.log('📝 Creando usuario:', { email, nombre_completo, rol });

        if (!email || !password || !nombre_completo) {
            return NextResponse.json(
                { error: 'Faltan datos requeridos (email, password, nombre_completo)' },
                { status: 400 }
            );
        }

        // Verificar variables de entorno
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log('🔑 URL:', url ? 'OK' : 'FALTA');
        console.log('🔑 Service Key:', serviceRoleKey ? 'OK' : 'FALTA');

        if (!url || !serviceRoleKey) {
            console.error('❌ Variables de entorno faltantes');
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta. Falta SUPABASE_SERVICE_ROLE_KEY.' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(url, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Crear usuario en Auth
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: nombre_completo
            }
        });

        if (userError) {
            console.error('Error creando usuario Auth:', userError);
            return NextResponse.json({ error: userError.message }, { status: 400 });
        }

        const userId = userData.user.id;

        // 2. Crear perfil (Si el trigger falló o se deshabilitó, esto asegura el perfil)
        // Intentamos actualizar si ya existe (por el trigger) o insertar si no
        const { error: profileError } = await supabaseAdmin
            .from('perfiles')
            .upsert({
                id: userId,
                email,
                nombre_completo,
                rol: rol || 'operador',
                estado: true
            });

        if (profileError) {
            console.error('Error gestionando perfil:', profileError);
            // No fallamos completamente si solo falló el perfil, pero avisamos
            return NextResponse.json({
                success: true,
                user: userData.user,
                warning: 'Usuario creado pero hubo error al configurar perfil: ' + profileError.message
            });
        }

        return NextResponse.json({ success: true, user: userData.user });

    } catch (error: any) {
        console.error('❌ Error interno:', error);
        console.error('❌ Stack:', error?.stack);
        return NextResponse.json({
            error: 'Error interno del servidor: ' + (error?.message || 'desconocido')
        }, { status: 500 });
    }
}
