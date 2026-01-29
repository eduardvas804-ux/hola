'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    FileSpreadsheet,
    Upload,
    Download,
    Search,
    RefreshCw,
    Check,
    AlertTriangle,
    Clock,
    Truck,
    Calendar,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { fetchTable, updateRow } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useAuth } from '@/components/auth-provider';
import { puedeVer, puedeCrear } from '@/lib/permisos';
import { Role } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface Valorizacion {
    id: string;
    fecha: string;
    periodo: string;
    archivo: string;
    registros: number;
    actualizados: number;
    created_at: string;
}

interface HorometroExcel {
    codigo: string;
    horometro: number;
    encontrado: boolean;
    diferencia?: number;
    horometroAnterior?: number;
}

export default function ValorizacionesPage() {
    const [valorizaciones, setValorizaciones] = useState<Valorizacion[]>([]);
    const [maquinaria, setMaquinaria] = useState<any[]>([]);
    const [mantenimientos, setMantenimientos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Estado para el Excel cargado
    const [excelData, setExcelData] = useState<HorometroExcel[]>([]);
    const [fileName, setFileName] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [updateResults, setUpdateResults] = useState<{ success: number; errors: number } | null>(null);

    const { profile } = useAuth();
    const router = useRouter();
    const userRole = profile?.rol as Role;

    useEffect(() => {
        if (profile && !puedeVer(userRole, 'valorizaciones')) {
            router.push('/');
            return;
        }
        fetchData();
    }, [profile, userRole, router]);

    async function fetchData() {
        try {
            const [maq, mtto] = await Promise.all([
                fetchTable<any>('maquinaria'),
                fetchTable<any>('mantenimientos')
            ]);
            setMaquinaria(maq || []);
            setMantenimientos(mtto || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setProcessing(true);
        setUpdateResults(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Buscar horómetros en todas las hojas
                const horometros: HorometroExcel[] = [];

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                    // Buscar columnas que contengan "código", "horometro", "horómetro", "horas"
                    jsonData.forEach((row, rowIndex) => {
                        if (!row || row.length === 0) return;

                        // Buscar patrones de código de máquina (EXC-01, VOL-01, etc.)
                        row.forEach((cell, colIndex) => {
                            if (typeof cell === 'string') {
                                const codigoMatch = cell.match(/^([A-Z]{2,4}-\d{1,2})$/i);
                                if (codigoMatch) {
                                    const codigo = codigoMatch[1].toUpperCase();

                                    // Buscar horómetro en las celdas cercanas
                                    for (let i = colIndex + 1; i < Math.min(colIndex + 10, row.length); i++) {
                                        const valor = row[i];
                                        if (typeof valor === 'number' && valor > 100 && valor < 999999) {
                                            const maq = maquinaria.find(m => m.codigo === codigo);
                                            const yaExiste = horometros.find(h => h.codigo === codigo);

                                            if (!yaExiste) {
                                                horometros.push({
                                                    codigo,
                                                    horometro: valor,
                                                    encontrado: !!maq,
                                                    horometroAnterior: maq?.horas_actuales,
                                                    diferencia: maq ? valor - maq.horas_actuales : undefined
                                                });
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        });
                    });
                });

                // También buscar en formato tabla con headers
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                    jsonData.forEach(row => {
                        // Buscar campos comunes
                        const codigo = row['CODIGO'] || row['Codigo'] || row['codigo'] ||
                            row['COD'] || row['Cod'] || row['EQUIPO'] || row['Equipo'];

                        const horometro = row['HOROMETRO'] || row['Horometro'] || row['horometro'] ||
                            row['HORAS'] || row['Horas'] || row['horas'] ||
                            row['HRS'] || row['Hrs'] || row['HORÓMETRO'];

                        if (codigo && horometro && typeof horometro === 'number') {
                            const codigoStr = String(codigo).toUpperCase().trim();
                            const maq = maquinaria.find(m => m.codigo === codigoStr);
                            const yaExiste = horometros.find(h => h.codigo === codigoStr);

                            if (!yaExiste && horometro > 100) {
                                horometros.push({
                                    codigo: codigoStr,
                                    horometro,
                                    encontrado: !!maq,
                                    horometroAnterior: maq?.horas_actuales,
                                    diferencia: maq ? horometro - maq.horas_actuales : undefined
                                });
                            }
                        }
                    });
                });

                setExcelData(horometros);
                setShowPreview(true);
            } catch (error) {
                console.error('Error procesando Excel:', error);
                alert('Error al procesar el archivo Excel');
            } finally {
                setProcessing(false);
            }
        };

        reader.readAsArrayBuffer(file);
    }

    async function aplicarActualizaciones() {
        if (excelData.length === 0) return;

        setProcessing(true);
        let success = 0;
        let errors = 0;

        for (const item of excelData) {
            if (!item.encontrado) continue;

            try {
                // Actualizar maquinaria
                const maq = maquinaria.find(m => m.codigo === item.codigo);
                if (maq) {
                    await updateRow('maquinaria', maq.id, {
                        horas_actuales: item.horometro,
                        updated_at: new Date().toISOString()
                    });
                }

                // Actualizar mantenimientos
                const mtto = mantenimientos.find(m => m.codigo_maquina === item.codigo);
                if (mtto) {
                    const diferencia = mtto.mantenimiento_proximo - item.horometro;
                    let estadoAlerta = 'EN REGLA';
                    if (diferencia <= 0) estadoAlerta = 'VENCIDO';
                    else if (diferencia <= 50) estadoAlerta = 'URGENTE';
                    else if (diferencia <= 100) estadoAlerta = 'PROXIMO';

                    await updateRow('mantenimientos', mtto.id, {
                        hora_actual: item.horometro,
                        diferencia_horas: diferencia,
                        estado_alerta: estadoAlerta
                    });
                }

                success++;
            } catch (error) {
                console.error(`Error actualizando ${item.codigo}:`, error);
                errors++;
            }
        }

        setUpdateResults({ success, errors });
        setProcessing(false);

        // Recargar datos
        fetchData();
    }

    function limpiarDatos() {
        setExcelData([]);
        setFileName('');
        setShowPreview(false);
        setUpdateResults(null);
    }

    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="spinner"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FileSpreadsheet className="text-green-600" />
                        Valorizaciones
                    </h1>
                    <p className="text-gray-500 mt-1">Importar Excel y actualizar horómetros automáticamente</p>
                </div>
            </div>

            {/* Zona de carga */}
            {puedeCrear(userRole, 'valorizaciones') ? (
                <div className="card p-8">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="excel-upload"
                        />
                        <label htmlFor="excel-upload" className="cursor-pointer">
                            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-lg font-semibold text-gray-700 mb-2">
                                {fileName || 'Arrastra un archivo Excel o haz clic para seleccionar'}
                            </p>
                            <p className="text-sm text-gray-500">
                                El sistema buscará automáticamente los códigos de máquina y horómetros
                            </p>
                        </label>
                    </div>

                {processing && (
                    <div className="flex items-center justify-center gap-3 mt-6 text-blue-600">
                        <RefreshCw className="animate-spin" size={24} />
                        <span>Procesando archivo...</span>
                    </div>
                )}
            </div>
            ) : (
                <div className="card p-8 bg-amber-50 border border-amber-200">
                    <p className="text-amber-800 text-center">No tienes permisos para subir archivos de valorización</p>
                </div>
            )}

            {/* Preview de datos */}
            {showPreview && excelData.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-gray-800">Vista Previa - {fileName}</h2>
                            <p className="text-sm text-gray-500">
                                {excelData.filter(e => e.encontrado).length} de {excelData.length} equipos encontrados en el sistema
                            </p>
                        </div>
                        <button onClick={limpiarDatos} className="p-2 hover:bg-gray-200 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-left">Código</th>
                                    <th className="p-3 text-right">Horómetro Excel</th>
                                    <th className="p-3 text-right">Horómetro Actual</th>
                                    <th className="p-3 text-right">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {excelData.map((item, index) => (
                                    <tr key={index} className={item.encontrado ? '' : 'bg-red-50'}>
                                        <td className="p-3">
                                            {item.encontrado ? (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <Check size={16} /> Encontrado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-600">
                                                    <AlertTriangle size={16} /> No existe
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 font-bold">{item.codigo}</td>
                                        <td className="p-3 text-right font-mono">{formatNumber(item.horometro)}</td>
                                        <td className="p-3 text-right font-mono text-gray-500">
                                            {item.horometroAnterior ? formatNumber(item.horometroAnterior) : '-'}
                                        </td>
                                        <td className="p-3 text-right">
                                            {item.diferencia !== undefined && (
                                                <span className={`font-bold ${item.diferencia > 0 ? 'text-green-600' : item.diferencia < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {item.diferencia > 0 ? '+' : ''}{formatNumber(item.diferencia)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        {updateResults && (
                            <div className={`flex items-center gap-2 ${updateResults.errors > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                <Check size={20} />
                                <span>{updateResults.success} actualizados correctamente</span>
                                {updateResults.errors > 0 && <span className="text-red-600">({updateResults.errors} errores)</span>}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={limpiarDatos} className="btn btn-outline">
                                Cancelar
                            </button>
                            <button
                                onClick={aplicarActualizaciones}
                                disabled={processing || excelData.filter(e => e.encontrado).length === 0}
                                className="btn btn-primary"
                            >
                                {processing ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={18} />
                                        Actualizando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={18} />
                                        Actualizar {excelData.filter(e => e.encontrado).length} Equipos
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="card p-6 bg-blue-50 border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3">¿Cómo funciona?</h3>
                <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold">1</span>
                        <span>Sube un archivo Excel con valorizaciones que contenga códigos de máquina (EXC-01, VOL-01, etc.) y horómetros</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold">2</span>
                        <span>El sistema detecta automáticamente los códigos y horómetros en el archivo</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold">3</span>
                        <span>Revisa la vista previa y confirma para actualizar los horómetros en Maquinaria y Mantenimientos</span>
                    </li>
                </ul>
            </div>

            {/* Resumen de equipos */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="font-bold text-gray-800">Equipos Registrados</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                    {maquinaria.map(m => (
                        <div key={m.id} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-bold text-gray-800">{m.codigo}</p>
                            <p className="text-sm text-gray-500">{m.tipo}</p>
                            <p className="text-sm font-mono text-blue-600 flex items-center gap-1 mt-1">
                                <Clock size={14} />
                                {formatNumber(m.horas_actuales)} hrs
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
