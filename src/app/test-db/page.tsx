'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function TestDBPage() {
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        testConnection();
    }, []);

    async function testConnection() {
        const supabase = createClient();
        const testResults: any = {
            supabaseClient: supabase ? '✅ Conectado' : '❌ No conectado',
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Falta',
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Falta',
            tables: {}
        };

        if (supabase) {
            // Test cada tabla
            const tables = ['maquinaria', 'combustible', 'historial', 'mantenimientos', 'soat', 'citv', 'perfiles'];

            for (const table of tables) {
                try {
                    const { data, error, count } = await supabase
                        .from(table)
                        .select('*', { count: 'exact', head: false })
                        .limit(5);

                    if (error) {
                        testResults.tables[table] = `❌ Error: ${error.message}`;
                    } else {
                        testResults.tables[table] = `✅ OK - ${data?.length || 0} registros`;
                    }
                } catch (e: any) {
                    testResults.tables[table] = `❌ Exception: ${e.message}`;
                }
            }
        }

        setResults(testResults);
        setLoading(false);
    }

    if (loading) {
        return <div className="p-8">Probando conexión...</div>;
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Test de Conexión a Supabase</h1>

            <div className="space-y-4">
                <div className="card p-4">
                    <h2 className="font-bold mb-2">Configuración</h2>
                    <p>Cliente Supabase: {results.supabaseClient}</p>
                    <p>URL: {results.url}</p>
                    <p>API Key: {results.key}</p>
                </div>

                <div className="card p-4">
                    <h2 className="font-bold mb-2">Tablas</h2>
                    {Object.entries(results.tables || {}).map(([table, status]) => (
                        <p key={table} className="py-1">
                            <span className="font-mono">{table}:</span> {status as string}
                        </p>
                    ))}
                </div>

                <button
                    onClick={() => { setLoading(true); testConnection(); }}
                    className="btn btn-primary"
                >
                    Probar de nuevo
                </button>
            </div>
        </div>
    );
}
