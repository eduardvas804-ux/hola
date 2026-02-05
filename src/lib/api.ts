'use client';

import { createClient } from './supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
    : '';

// Cache del token para evitar llamadas repetidas a getSession()
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getHeaders(): Promise<HeadersInit> {
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!apiKey) {
        console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada');
    }

    const headers: any = {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`, // Default anon key
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    // Usar token cacheado si aún es válido (con 60s de margen)
    const now = Date.now();
    if (cachedToken && tokenExpiry > now + 60000) {
        headers['Authorization'] = `Bearer ${cachedToken}`;
        return headers;
    }

    // Intentar inyectar token de usuario si existe sesión
    try {
        const supabase = createClient();
        if (supabase) {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.access_token) {
                cachedToken = data.session.access_token;
                // El token de Supabase dura 1 hora por defecto
                tokenExpiry = now + (55 * 60 * 1000); // 55 minutos
                headers['Authorization'] = `Bearer ${cachedToken}`;
            }
        }
    } catch (error) {
        // Silencioso - usará el apiKey por defecto
    }

    return headers;
}

// Limpiar cache de token (llamar en logout)
export function clearTokenCache() {
    cachedToken = null;
    tokenExpiry = 0;
}

function isConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Versión simple que retorna array (para compatibilidad)
export async function fetchTable<T>(table: string, query: string = ''): Promise<T[]> {
    const result = await fetchTableWithStatus<T>(table, query);
    return result.data;
}

// Versión que retorna estado de conexión
export async function fetchTableWithStatus<T>(table: string, query: string = ''): Promise<{ data: T[], connected: boolean }> {
    if (!isConfigured()) {
        console.warn(`⚠️ fetchTable(${table}): Supabase no configurado`);
        return { data: [], connected: false };
    }
    try {
        const url = `${SUPABASE_URL}/${table}?select=*${query}`;
        console.log(`📡 fetchTable(${table}) iniciando...`);

        const headers = await getHeaders();
        const response = await fetch(url, {
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            // console.error(`❌ fetchTable(${table}) error ${response.status}:`, errorText);
            // No loguear error 401/403 si es por RLS y estamos testeando conexión, pero sí loguear otros
            if (response.status !== 401 && response.status !== 403) {
                console.error(`❌ fetchTable(${table}) error ${response.status}:`, errorText);
            }
            return { data: [], connected: false };
        }

        const data = await response.json();
        console.log(`✅ fetchTable(${table}): ${data.length} registros`);
        return { data, connected: true };
    } catch (error) {
        console.error(`❌ fetchTable(${table}) exception:`, error);
        return { data: [], connected: false };
    }
}

export async function insertRow<T>(table: string, data: Partial<T>): Promise<T | null> {
    const headers = await getHeaders();
    const response = await fetch(`${SUPABASE_URL}/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.text();
        console.error(`Error inserting into ${table}:`, err);
        return null;
    }
    const result = await response.json();
    return result[0] || null;
}

export async function updateRow<T>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    const headers = await getHeaders();
    const response = await fetch(`${SUPABASE_URL}/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.text();
        console.error(`Error updating ${table}:`, err);
        return null;
    }
    const result = await response.json();
    return result[0] || null;
}

export async function deleteRow(table: string, id: string): Promise<boolean> {
    const url = `${SUPABASE_URL}/${table}?id=eq.${id}`;
    // console.log(`🗑️ deleteRow: ${url}`);

    const headers = await getHeaders();
    const response = await fetch(url, {
        method: 'DELETE',
        headers
    });

    // console.log(`🗑️ deleteRow response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ deleteRow error:`, errorText);
    }

    return response.ok;
}

export async function deleteRows(table: string, ids: string[]): Promise<boolean> {
    const idsParam = ids.map(id => `"${id}"`).join(',');
    const headers = await getHeaders();
    const response = await fetch(`${SUPABASE_URL}/${table}?id=in.(${idsParam})`, {
        method: 'DELETE',
        headers
    });
    return response.ok;
}

// Registrar cambio en historial
export async function registrarCambio(
    tabla: string,
    accion: 'CREATE' | 'UPDATE' | 'DELETE',
    registroId: string,
    datosAnteriores: any,
    datosNuevos: any,
    usuario: { id: string; email: string; nombre: string }
): Promise<boolean> {
    // console.log('📝 registrarCambio llamado:', { tabla, accion, registroId });

    if (!isConfigured()) {
        console.log('❌ Supabase no configurado');
        return false;
    }

    try {
        // usuario_id debe ser UUID válido o null
        const isValidUUID = usuario.id && usuario.id !== 'demo' && usuario.id.length > 10;

        const body = {
            tabla,
            accion,
            registro_id: registroId,
            datos_anteriores: datosAnteriores,
            datos_nuevos: datosNuevos,
            usuario_id: isValidUUID ? usuario.id : null,
            usuario_email: usuario.email,
            usuario_nombre: usuario.nombre
        };

        // console.log('📤 Enviando a historial:', body);

        const headers = await getHeaders();
        const response = await fetch(`${SUPABASE_URL}/historial`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        // console.log('📥 Respuesta:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error en historial:', errorText);
        }

        return response.ok;
    } catch (error) {
        console.error('❌ Error registrando historial:', error);
        return false;
    }
}

// Vincular máquinas: obtener datos completos por código
export async function getMaquinariaCompleta(codigo: string): Promise<any> {
    if (!isConfigured()) return null;

    try {
        // Obtener datos de todas las tablas relacionadas en paralelo
        const [maquinaria, mantenimientos, soat, citv, filtros] = await Promise.all([
            fetchTable<any>('maquinaria', `&codigo=eq.${codigo}`),
            fetchTable<any>('mantenimientos', `&codigo_maquina=eq.${codigo}`),
            fetchTable<any>('soat', `&codigo=eq.${codigo}`),
            fetchTable<any>('citv', `&codigo=eq.${codigo}`),
            fetchTable<any>('filtros', `&maquinaria_codigo=eq.${codigo}`)
        ]);

        if (!maquinaria?.[0]) return null;

        return {
            ...maquinaria[0],
            mantenimiento: mantenimientos?.[0] || null,
            soat: soat?.[0] || null,
            citv: citv?.[0] || null,
            filtros: filtros?.[0] || null
        };
    } catch (error) {
        console.error('Error obteniendo maquinaria completa:', error);
        return null;
    }
}

// Buscar máquina por código o placa
export async function buscarMaquinaria(termino: string): Promise<any[]> {
    if (!isConfigured()) return [];

    try {
        const terminoLower = termino.toLowerCase();

        // Buscar en maquinaria por código
        const maquinaria = await fetchTable<any>('maquinaria');
        const resultados = maquinaria.filter(m =>
            m.codigo?.toLowerCase().includes(terminoLower) ||
            m.placa?.toLowerCase().includes(terminoLower) ||
            m.serie?.toLowerCase().includes(terminoLower)
        );

        return resultados;
    } catch (error) {
        console.error('Error buscando maquinaria:', error);
        return [];
    }
}

// Verificar si Supabase está configurado (exportado para uso en componentes)
export { isConfigured };

// Resultado con metadatos de operación
export interface ApiResult<T> {
    data: T | null;
    success: boolean;
    error?: string;
}

// Insert con resultado estructurado
export async function insertRowWithResult<T>(table: string, data: Partial<T>): Promise<ApiResult<T>> {
    if (!isConfigured()) {
        return { data: null, success: false, error: 'Supabase no configurado' };
    }

    try {
        const headers = await getHeaders();
        const response = await fetch(`${SUPABASE_URL}/${table}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ insertRow(${table}) error:`, errorText);
            return { data: null, success: false, error: errorText };
        }

        const result = await response.json();
        return { data: result[0] || null, success: true };
    } catch (error: any) {
        console.error(`❌ insertRow(${table}) exception:`, error);
        return { data: null, success: false, error: error.message };
    }
}

// Update con resultado estructurado
export async function updateRowWithResult<T>(table: string, id: string, data: Partial<T>): Promise<ApiResult<T>> {
    if (!isConfigured()) {
        return { data: null, success: false, error: 'Supabase no configurado' };
    }

    try {
        const headers = await getHeaders();
        const response = await fetch(`${SUPABASE_URL}/${table}?id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ updateRow(${table}) error:`, errorText);
            return { data: null, success: false, error: errorText };
        }

        const result = await response.json();
        return { data: result[0] || null, success: true };
    } catch (error: any) {
        console.error(`❌ updateRow(${table}) exception:`, error);
        return { data: null, success: false, error: error.message };
    }
}

// Delete con resultado estructurado
export async function deleteRowWithResult(table: string, id: string): Promise<ApiResult<null>> {
    if (!isConfigured()) {
        return { data: null, success: false, error: 'Supabase no configurado' };
    }

    try {
        const headers = await getHeaders();
        const response = await fetch(`${SUPABASE_URL}/${table}?id=eq.${id}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ deleteRow(${table}) error:`, errorText);
            return { data: null, success: false, error: errorText };
        }

        return { data: null, success: true };
    } catch (error: any) {
        console.error(`❌ deleteRow(${table}) exception:`, error);
        return { data: null, success: false, error: error.message };
    }
}

// Obtener equipos vinculados por código o serie
export async function getEquiposVinculados(identificador: string): Promise<{
    maquinaria: any | null;
    mantenimiento: any | null;
    soat: any | null;
    citv: any | null;
    filtros: any | null;
}> {
    if (!isConfigured()) {
        return { maquinaria: null, mantenimiento: null, soat: null, citv: null, filtros: null };
    }

    try {
        // Buscar primero en maquinaria por código o serie
        // Aqui fetchTable(maquinaria) usar getHeadersWithAuth lo cual esta bien.
        const maquinarias = await fetchTable<any>('maquinaria');
        const maquinaria = maquinarias.find(m =>
            m.codigo === identificador || m.serie === identificador
        );

        if (!maquinaria) {
            return { maquinaria: null, mantenimiento: null, soat: null, citv: null, filtros: null };
        }

        const codigo = maquinaria.codigo;

        // Obtener datos relacionados en paralelo
        const [mantenimientos, soats, citvs, filtrosArr] = await Promise.all([
            fetchTable<any>('mantenimientos', `&codigo_maquina=eq.${codigo}`),
            fetchTable<any>('soat', `&codigo=eq.${codigo}`),
            fetchTable<any>('citv', `&codigo=eq.${codigo}`),
            fetchTable<any>('filtros', `&maquinaria_codigo=eq.${codigo}`)
        ]);

        return {
            maquinaria,
            mantenimiento: mantenimientos[0] || null,
            soat: soats[0] || null,
            citv: citvs[0] || null,
            filtros: filtrosArr[0] || null
        };
    } catch (error) {
        console.error('Error obteniendo equipos vinculados:', error);
        return { maquinaria: null, mantenimiento: null, soat: null, citv: null, filtros: null };
    }
}
