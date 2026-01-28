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
