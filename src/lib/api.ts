'use client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
    : '';

function getHeaders(): HeadersInit {
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!apiKey) {
        console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada');
    }
    return {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
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
        console.log(`📡 fetchTable(${table}):`, url);

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ fetchTable(${table}) error ${response.status}:`, errorText);
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
    const response = await fetch(`${SUPABASE_URL}/${table}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result[0] || null;
}

export async function updateRow<T>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    const response = await fetch(`${SUPABASE_URL}/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result[0] || null;
}

export async function deleteRow(table: string, id: string): Promise<boolean> {
    const url = `${SUPABASE_URL}/${table}?id=eq.${id}`;
    console.log(`🗑️ deleteRow: ${url}`);

    const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders()
    });

    console.log(`🗑️ deleteRow response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ deleteRow error:`, errorText);
    }

    return response.ok;
}

export async function deleteRows(table: string, ids: string[]): Promise<boolean> {
    const idsParam = ids.map(id => `"${id}"`).join(',');
    const response = await fetch(`${SUPABASE_URL}/${table}?id=in.(${idsParam})`, {
        method: 'DELETE',
        headers: getHeaders()
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
    console.log('📝 registrarCambio llamado:', { tabla, accion, registroId });

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

        console.log('📤 Enviando a historial:', body);

        const response = await fetch(`${SUPABASE_URL}/historial`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        console.log('📥 Respuesta:', response.status, response.statusText);

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
        const response = await fetch(`${SUPABASE_URL}/${table}`, {
            method: 'POST',
            headers: getHeaders(),
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
        const response = await fetch(`${SUPABASE_URL}/${table}?id=eq.${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
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
        const response = await fetch(`${SUPABASE_URL}/${table}?id=eq.${id}`, {
            method: 'DELETE',
            headers: getHeaders()
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
