'use client';

import { useState, useRef } from 'react';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertCircle,
    Loader2,
    Database,
    ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase';

type ImportType = 'maquinaria' | 'mantenimientos' | 'soat' | 'citv' | 'filtros';

const IMPORT_OPTIONS: { type: ImportType; label: string; icon: string; sheets: string[] }[] = [
    { type: 'maquinaria', label: 'Maquinaria', icon: '🚜', sheets: ['BD MAQUINARIA'] },
    { type: 'mantenimientos', label: 'Mantenimientos', icon: '🛠️', sheets: ['CONTROL MANTENIMIENTOS'] },
    { type: 'soat', label: 'Control SOAT', icon: '📋', sheets: ['CONTROL SOAT'] },
    { type: 'citv', label: 'Revisiones CITV', icon: '🔍', sheets: ['REVISIONES TECNICAS'] },
    { type: 'filtros', label: 'Filtros', icon: '🔧', sheets: ['FILTROS MAQUINARIA'] },
];

export default function ImportarPage() {
    const [selectedType, setSelectedType] = useState<ImportType>('maquinaria');
    const [file, setFile] = useState<File | null>(null);
    const [sheets, setSheets] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState('');
    const [data, setData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ success: number; error: number } | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const buffer = await uploadedFile.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            setSheets(workbook.SheetNames);

            // Auto-select sheet based on import type
            const importOption = IMPORT_OPTIONS.find(o => o.type === selectedType);
            const matchingSheet = workbook.SheetNames.find(s =>
                importOption?.sheets.some(expected => s.toLowerCase().includes(expected.toLowerCase()))
            );

            if (matchingSheet) {
                setSelectedSheet(matchingSheet);
                loadSheetData(workbook, matchingSheet);
            } else if (workbook.SheetNames.length > 0) {
                setSelectedSheet(workbook.SheetNames[0]);
                loadSheetData(workbook, workbook.SheetNames[0]);
            }
        } catch (err) {
            setError('Error al leer el archivo Excel');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function loadSheetData(workbook: XLSX.WorkBook, sheetName: string) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length > 0) {
            setHeaders(jsonData[0].map(h => String(h || '').trim()));
            const rows = jsonData.slice(1).filter(row => row.some(cell => cell != null && cell !== ''));
            setData(rows);
        }
    }

    function handleSheetChange(sheetName: string) {
        setSelectedSheet(sheetName);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result;
                const workbook = XLSX.read(buffer, { type: 'array' });
                loadSheetData(workbook, sheetName);
            };
            reader.readAsArrayBuffer(file);
        }
    }

    async function handleImport() {
        if (!data.length) return;

        setImporting(true);
        setError('');

        let successCount = 0;
        let errorCount = 0;

        try {
            const supabase = createClient();

            // Mapear datos según el tipo de importación
            const mappedData = data.map(row => {
                const obj: Record<string, any> = {};
                headers.forEach((header, index) => {
                    obj[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
                });
                return obj;
            });

            // Intentar insertar en Supabase
            for (const item of mappedData) {
                try {
                    const { error } = await supabase.from(selectedType).insert([item]);
                    if (error) {
                        errorCount++;
                    } else {
                        successCount++;
                    }
                } catch {
                    errorCount++;
                }
            }

            setResult({ success: successCount, error: errorCount });
        } catch (err) {
            setError('Error durante la importación. Verifique que Supabase esté configurado.');
            console.error(err);
        } finally {
            setImporting(false);
        }
    }

    function resetImport() {
        setFile(null);
        setSheets([]);
        setSelectedSheet('');
        setData([]);
        setHeaders([]);
        setResult(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Importar Datos</h1>
                <p className="text-gray-500 mt-1">Carga datos desde archivos Excel a la base de datos</p>
            </div>

            {/* Import Type Selection */}
            <div className="card p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-4">1. Selecciona el tipo de datos a importar</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {IMPORT_OPTIONS.map((option) => (
                        <button
                            key={option.type}
                            onClick={() => { setSelectedType(option.type); resetImport(); }}
                            className={`p-4 rounded-xl border-2 transition-all text-center ${selectedType === option.type
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-3xl block mb-2">{option.icon}</span>
                            <span className="font-medium text-gray-700">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* File Upload */}
            <div className="card p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-4">2. Carga el archivo Excel</h2>

                {!file ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-3" />
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Haz clic para seleccionar</span> o arrastra el archivo
                            </p>
                            <p className="text-xs text-gray-400">Excel (.xlsx, .xls)</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                        />
                    </label>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-800">{file.name}</p>
                            <p className="text-sm text-gray-500">{sheets.length} hojas encontradas</p>
                        </div>
                        <button onClick={resetImport} className="btn btn-outline py-2 px-4">
                            Cambiar archivo
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <span className="ml-3 text-gray-600">Leyendo archivo...</span>
                    </div>
                )}
            </div>

            {/* Sheet Selection */}
            {sheets.length > 0 && (
                <div className="card p-5">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">3. Selecciona la hoja</h2>
                    <div className="flex flex-wrap gap-2">
                        {sheets.map((sheet) => (
                            <button
                                key={sheet}
                                onClick={() => handleSheetChange(sheet)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedSheet === sheet
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {sheet}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Preview */}
            {data.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">4. Vista previa de datos</h2>
                            <p className="text-sm text-gray-500">{data.length} registros encontrados</p>
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="btn btn-secondary"
                        >
                            {importing ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Importando...
                                </>
                            ) : (
                                <>
                                    <Database size={18} />
                                    Importar a Supabase
                                </>
                            )}
                        </button>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="data-table text-sm">
                            <thead>
                                <tr>
                                    <th className="text-xs">#</th>
                                    {headers.map((h, i) => (
                                        <th key={i} className="text-xs">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 20).map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td className="text-gray-400">{rowIndex + 1}</td>
                                        {headers.map((_, colIndex) => (
                                            <td key={colIndex} className="max-w-32 truncate">
                                                {row[colIndex] !== undefined ? String(row[colIndex]) : ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {data.length > 20 && (
                        <div className="p-3 bg-gray-50 text-center text-sm text-gray-500">
                            Mostrando primeros 20 de {data.length} registros
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="card p-5 bg-red-50 border border-red-200">
                    <div className="flex items-center gap-3 text-red-700">
                        <AlertCircle size={24} />
                        <div>
                            <p className="font-medium">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="card p-5">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Resultado de la importación</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                            <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
                            <p className="text-3xl font-bold text-green-600">{result.success}</p>
                            <p className="text-sm text-green-700">Importados correctamente</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                            <AlertCircle className="text-red-500 mx-auto mb-2" size={32} />
                            <p className="text-3xl font-bold text-red-600">{result.error}</p>
                            <p className="text-sm text-red-700">Con errores</p>
                        </div>
                    </div>
                    <button onClick={resetImport} className="btn btn-primary w-full mt-4">
                        Nueva importación
                    </button>
                </div>
            )}

            {/* Help Info */}
            <div className="card p-5 bg-blue-50 border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">💡 Información importante</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• El archivo debe estar en formato Excel (.xlsx o .xls)</li>
                    <li>• La primera fila debe contener los nombres de las columnas</li>
                    <li>• Para importar correctamente, las columnas deben coincidir con la estructura de la tabla</li>
                    <li>• Se recomienda usar el archivo <strong>CONTROL DE MAQUINARIA.xlsx</strong> como plantilla</li>
                </ul>
            </div>
        </div>
    );
}
