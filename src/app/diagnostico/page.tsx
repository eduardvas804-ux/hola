'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface TestResult {
    table: string;
    select: string;
    insert: string;
    update: string;
    delete: string;
}

export default function DiagnosticoPage() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [envVars, setEnvVars] = useState<any>({});

    useEffect(() => {
        runDiagnostics();
    }, []);

    async function runDiagnostics() {
        setLoading(true);

        // Check env vars
        setEnvVars({
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Falta',
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Falta',
        });

        const supabase = createClient();
        if (!supabase) {
            setResults([]);
            setLoading(false);
            return;
        }

        const tables = ['maquinaria', 'combustible', 'historial', 'perfiles', 'mantenimientos', 'soat', 'citv', 'filtros'];
        const testResults: TestResult[] = [];

        for (const table of tables) {
            const result: TestResult = {
                table,
                select: '⏳',
                insert: '⏳',
                update: '-',
                delete: '-'
            };

            // Test SELECT
            try {
                const { data, error } = await supabase.from(table).select('*').limit(1);
                result.select = error ? `❌ ${error.code}` : `✅ ${data?.length || 0} reg`;
            } catch (e: any) {
                result.select = `❌ ${e.message}`;
            }

            // Test INSERT (con un registro de prueba que luego eliminamos)
            const testId = `test-${Date.now()}`;
            try {
                let testData: any = { id: testId };

                // Datos específicos por tabla
                if (table === 'maquinaria') {
                    testData = { codigo: testId, tipo: 'TEST', estado: 'TEST' };
                } else if (table === 'combustible') {
                    testData = { fecha: '2026-01-01', tipo_movimiento: 'ENTRADA', codigo_maquina: 'TEST', galones: 1 };
                } else if (table === 'historial') {
                    testData = { tabla: 'test', accion: 'CREATE', registro_id: testId, usuario_email: 'test@test.com', usuario_nombre: 'Test' };
                } else if (table === 'perfiles') {
                    testData = { id: testId, email: 'test@test.com', nombre_completo: 'Test', rol: 'operador', estado: true };
                } else if (table === 'mantenimientos') {
                    testData = { codigo_maquina: testId };
                } else if (table === 'soat' || table === 'citv') {
                    testData = { codigo: testId, fecha_vencimiento: '2026-12-31' };
                } else if (table === 'filtros') {
                    testData = { maquinaria_codigo: testId };
                }

                const { data: insertData, error: insertError } = await supabase
                    .from(table)
                    .insert([testData])
                    .select();

                if (insertError) {
                    result.insert = `❌ ${insertError.code}: ${insertError.message.substring(0, 50)}`;
                } else {
                    result.insert = '✅ OK';

                    // Si insert funciona, intentar delete
                    const insertedId = insertData?.[0]?.id || (table === 'maquinaria' ? testId : null);
                    if (insertedId) {
                        try {
                            const deleteField = table === 'maquinaria' ? 'codigo' : 'id';
                            const { error: deleteError } = await supabase
                                .from(table)
                                .delete()
                                .eq(deleteField, table === 'maquinaria' ? testId : insertedId);

                            result.delete = deleteError ? `❌ ${deleteError.code}` : '✅ OK';
                        } catch (e: any) {
                            result.delete = `❌ ${e.message}`;
                        }
                    }
                }
            } catch (e: any) {
                result.insert = `❌ ${e.message}`;
            }

            testResults.push(result);
        }

        setResults(testResults);
        setLoading(false);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Diagnóstico de Conexión a Supabase</h1>

            <div className="card p-4 mb-6">
                <h2 className="font-bold mb-2">Variables de Entorno</h2>
                <p>URL: {envVars.url}</p>
                <p>ANON KEY: {envVars.key}</p>
            </div>

            {loading ? (
                <div className="text-center py-8">Ejecutando diagnóstico...</div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">Tabla</th>
                                <th className="p-3 text-left">SELECT</th>
                                <th className="p-3 text-left">INSERT</th>
                                <th className="p-3 text-left">DELETE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(r => (
                                <tr key={r.table} className="border-t">
                                    <td className="p-3 font-mono font-bold">{r.table}</td>
                                    <td className="p-3">{r.select}</td>
                                    <td className="p-3">{r.insert}</td>
                                    <td className="p-3">{r.delete}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-6 flex gap-4">
                <button
                    onClick={runDiagnostics}
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Ejecutando...' : 'Ejecutar de nuevo'}
                </button>
            </div>

            <div className="mt-8 card p-4 bg-amber-50 border-amber-200">
                <h3 className="font-bold text-amber-800 mb-2">Si ves errores:</h3>
                <ol className="list-decimal list-inside text-amber-700 space-y-1">
                    <li>Ve a Supabase Dashboard → SQL Editor</li>
                    <li>Ejecuta el script <code className="bg-amber-100 px-1">fix_all_policies.sql</code></li>
                    <li>Vuelve a ejecutar el diagnóstico</li>
                </ol>
            </div>
        </div>
    );
}
