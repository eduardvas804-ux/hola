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

export async function fetchTable<T>(table: string, query: string = ''): Promise<T[]> {
    if (!isConfigured()) return [];
    try {
        const response = await fetch(`${SUPABASE_URL}/${table}?select=*${query}`, {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        return response.json();
    } catch (error) {
        console.error('Error fetching:', error);
        return [];
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
    const response = await fetch(`${SUPABASE_URL}/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
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
        const body = {
            tabla,
            accion,
            registro_id: registroId,
            datos_anteriores: datosAnteriores,
            datos_nuevos: datosNuevos,
            usuario_id: usuario.id,
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
