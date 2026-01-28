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
    { type: 'filtros', label: 'Filtros', icon: '🔧', sheets: ['FILTROS MAQUINARIA', '_FILTROS_BD'] },
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
            // Buscar la fila que contiene los encabezados reales
            // Los encabezados conocidos que buscamos
            const knownHeaders = ['item', 'serie', 'tipo', 'modelo', 'marca', 'código', 'codigo', 'empresa', 'horas', 'placa', 'maquina', 'máquina', 'operador', 'fecha', 'separador'];

            let headerRowIndex = 0;
            let maxMatches = 0;

            // Buscar en las primeras 10 filas cuál tiene más coincidencias con cabeceras conocidas
            for (let i = 0; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i];
                if (!row || !Array.isArray(row)) continue;

                const matches = row.filter(cell => {
                    if (!cell) return false;
                    const cellStr = String(cell).toLowerCase().trim();
                    return knownHeaders.some(h => cellStr.includes(h) || h.includes(cellStr));
                }).length;

                if (matches > maxMatches) {
                    maxMatches = matches;
                    headerRowIndex = i;
                }
            }

            console.log('Fila de cabeceras detectada:', headerRowIndex);
            console.log('Cabeceras:', jsonData[headerRowIndex]);

            const headerRow = jsonData[headerRowIndex] || jsonData[0];
            setHeaders(headerRow.map((h: any) => String(h || '').trim()));

            // Los datos empiezan después de la fila de cabeceras
            const rows = jsonData.slice(headerRowIndex + 1).filter(row =>
                row && row.some(cell => cell != null && cell !== '')
            );
            setData(rows);

            console.log(`Total filas de datos: ${rows.length}`);
            console.log('Primera fila de datos:', rows[0]);
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

    // Mapeo de columnas Excel a campos de base de datos
    // Basado en estructura exacta del Excel CONTROL DE MAQUINARIA.xlsx

    function getColumnIndex(headers: string[], possibleNames: string[]): number {
        for (const name of possibleNames) {
            const index = headers.findIndex(h => {
                const headerClean = h.toLowerCase().trim();
                const nameClean = name.toLowerCase().trim();
                return headerClean === nameClean ||
                    headerClean.includes(nameClean) ||
                    headerClean.replace(/[°º]/g, '').includes(nameClean.replace(/[°º]/g, ''));
            });
            if (index !== -1) return index;
        }
        return -1;
    }

    function getCellValue(row: any[], headers: string[], possibleNames: string[]): any {
        const index = getColumnIndex(headers, possibleNames);
        if (index !== -1 && row[index] !== undefined && row[index] !== null && row[index] !== '') {
            return row[index];
        }
        return null;
    }

    // BD MAQUINARIA tiene columnas (fila 2): ITEM, SERIE, TIPO, MODELO, MARCA, AÑO, CÓDIGO, EMPRESA, OPERADOR, TRAMO
    // NOTA: La columna CÓDIGO puede estar vacía, en ese caso usar SERIE
    function mapRowToMaquinaria(row: any[], headers: string[]) {
        // Intentar obtener valores por índice directo según estructura conocida
        // Headers: ['ITEM', 'SERIE', 'TIPO', 'MODELO', 'MARCA', 'AÑO', 'CÓDIGO', 'EMPRESA', 'OPERADOR', 'TRAMO']
        // Indices:    0       1       2        3         4       5        6           7           8         9

        const item = row[0];
        const serie = row[1];
        const tipo = row[2];
        const modelo = row[3];
        const marca = row[4];
        const año = row[5];
        const codigoCol = row[6]; // Puede estar vacío
        const empresa = row[7];
        const operador = row[8];
        const tramo = row[9];
        const estado = row[10] || 'OPERATIVO';
        const horas = row[11];

        // Skip empty rows
        if (!serie && !tipo) return null;

        // Usar SERIE como código si CÓDIGO está vacío
        const codigo = codigoCol || serie || `MAQ-${Date.now()}`;

        console.log('Mapeando fila:', { item, serie, tipo, modelo, marca, codigo, empresa });

        return {
            item: item ? parseInt(String(item)) : null,
            serie: String(serie || ''),
            tipo: String(tipo || ''),
            modelo: String(modelo || ''),
            marca: String(marca || ''),
            año: año ? parseInt(String(año)) : null,
            codigo: String(codigo),
            empresa: String(empresa || ''),
            operador: String(operador || ''),
            tramo: String(tramo || ''),
            estado: String(estado),
            horas_actuales: horas ? parseFloat(String(horas).replace(',', '.')) : 0,
            alerta_mtto: false,
        };
    }

    // CONTROL MANTENIMIENTOS: ITEM, CODIGO, MAQUINA, MODELO, AÑO, SERIE, MANTENIMIENTO PROX, HORA ACTUAL, DIFERENCIA DE HORA
    function mapRowToMantenimiento(row: any[], headers: string[]) {
        // Indices para CONTROL MANTENIMIENTOS (fila 2): ITEM, CODIGO, MAQUINA, MODELO, AÑO, SERIE, MANTENIMIENTO, MANTENIMIENTO PROX, HORA ACTUAL, DIFERENCIA DE HORA
        const codigo = row[1];
        const maquina = row[2];
        const modelo = row[3];
        const horaActualVal = row[8];
        const mttoProxVal = row[7];
        const diferenciaVal = row[9];
        const operador = row[10];
        const tramo = row[11];

        if (!codigo && !maquina) return null;

        const horaActual = horaActualVal ? parseFloat(String(horaActualVal).replace(',', '.')) : 0;
        const mttoProximo = mttoProxVal ? parseFloat(String(mttoProxVal).replace(',', '.')) : horaActual + 250;
        const diferencia = diferenciaVal ? parseFloat(String(diferenciaVal).replace(',', '.')) : (mttoProximo - horaActual);
        const mttoUltimo = mttoProximo - 250;

        let estadoAlerta = 'EN REGLA';
        if (diferencia <= 0) estadoAlerta = 'VENCIDO';
        else if (diferencia <= 50) estadoAlerta = 'URGENTE';
        else if (diferencia <= 100) estadoAlerta = 'PROXIMO';

        return {
            codigo_maquina: String(codigo || ''),
            tipo: String(maquina || ''),
            modelo: String(modelo || ''),
            mantenimiento_ultimo: mttoUltimo,
            mantenimiento_proximo: mttoProximo,
            hora_actual: horaActual,
            diferencia_horas: diferencia,
            operador: String(operador || ''),
            tramo: String(tramo || ''),
            tipo_mantenimiento: 'PREVENTIVO 250H',
            estado_alerta: estadoAlerta,
        };
    }

    // CONTROL SOAT (fila 2): ITEM, CÓDIGO, TIPO, MODELO, PLACA/SERIE, EMPRESA, FECHA VENCIMIENTO, DÍAS RESTANTES, ACCIÓN REQUERIDA
    function mapRowToSoat(row: any[], headers: string[]) {
        // Indices: 0=ITEM, 1=CÓDIGO, 2=TIPO, 3=MODELO, 4=PLACA/SERIE, 5=EMPRESA, 6=FECHA VENCIMIENTO
        const codigo = row[1];
        const tipo = row[2];
        const modelo = row[3];
        const placaSerie = row[4];
        const empresa = row[5];
        let fecha = row[6];

        if (!codigo && !placaSerie) return null;

        // Convertir fecha Excel a formato ISO
        if (typeof fecha === 'number') {
            const date = new Date((fecha - 25569) * 86400 * 1000);
            fecha = date.toISOString().split('T')[0];
        } else if (fecha) {
            const parsed = new Date(fecha);
            if (!isNaN(parsed.getTime())) {
                fecha = parsed.toISOString().split('T')[0];
            }
        }

        console.log('Mapeando SOAT:', { codigo, tipo, modelo, placaSerie, empresa, fecha });

        return {
            codigo: String(codigo || ''),
            tipo: String(tipo || ''),
            modelo: String(modelo || ''),
            placa_serie: String(placaSerie || ''),
            empresa: String(empresa || ''),
            fecha_vencimiento: fecha || new Date().toISOString().split('T')[0],
        };
    }

    // REVISIONES TECNICAS: Same as SOAT
    function mapRowToCitv(row: any[], headers: string[]) {
        return mapRowToSoat(row, headers);
    }

    // FILTROS - Maneja DOS estructuras:
    // 1) HORIZONTAL (FILTROS MAQUINARIA): Cada fila = máquina con filtros en columnas
    //    Col0: Máquina, Col1: Separador1, Col2: Separador2, Col3: Combustible1, Col4: Combustible2, Col5: Aceite, Col6: AirePrim, Col7: AireSec
    // 2) VERTICAL (_FILTROS_BD): Fila máquina, luego 5 filas de filtros
    function processFilterData(allRows: any[][]): any[] {
        const filtros: any[] = [];

        console.log('processFilterData: Total filas:', allRows.length);
        if (allRows.length < 2) return filtros;

        // Detectar si es estructura HORIZONTAL (FILTROS MAQUINARIA)
        // Los headers contienen "SEPARADOR", "COMBUSTIBLE", "ACEITE", "AIRE"
        const headers = allRows[0] || [];
        const headerStr = headers.join(' ').toUpperCase();
        const esHorizontal = headerStr.includes('SEPARADOR') || headerStr.includes('ACEITE') ||
            headerStr.includes('PRIMARIO') || headerStr.includes('SECUNDARIO');

        console.log('Estructura detectada:', esHorizontal ? 'HORIZONTAL' : 'VERTICAL');

        if (esHorizontal) {
            // ESTRUCTURA HORIZONTAL - cada fila es una máquina completa
            for (let i = 1; i < allRows.length; i++) {
                const row = allRows[i];
                if (!row || row.length < 2) continue;

                const maquina = String(row[0] || '').trim();
                // Ignorar filas vacías o que son headers repetidos
                if (!maquina || maquina.toUpperCase().includes('MÁQUINA') || maquina.toUpperCase().includes('MAQUINA') || maquina.toUpperCase().includes('BUSCADOR')) continue;

                // Extraer código y cantidad de strings como "438-5386 1"
                const parseFiltro = (val: any): { codigo: string; cantidad: number } => {
                    const str = String(val || '').trim();
                    if (!str || str === '0' || str === '—') return { codigo: '', cantidad: 0 };
                    const parts = str.split(' ');
                    return {
                        codigo: parts[0] || '',
                        cantidad: parseInt(parts[1]) || 1
                    };
                };

                // Limpiar nombre de máquina (quitar emojis)
                const nombreLimpio = maquina.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
                const match = nombreLimpio.match(/^([^(]+)/);
                const codigo = match ? match[1].trim().replace(/\s+/g, '-').substring(0, 20) : nombreLimpio.substring(0, 20);

                const sep1 = parseFiltro(row[1]);
                const sep2 = parseFiltro(row[2]);
                const comb1 = parseFiltro(row[3]);
                const comb2 = parseFiltro(row[4]); // A veces hay segundo combustible
                const aceite = parseFiltro(row[5]);
                const airePrim = parseFiltro(row[6]);
                const aireSec = parseFiltro(row[7]);

                filtros.push({
                    maquinaria_codigo: codigo,
                    maquinaria_descripcion: nombreLimpio,
                    filtro_separador_1: sep1.codigo,
                    cantidad_sep_1: sep1.cantidad,
                    filtro_separador_2: sep2.codigo,
                    cantidad_sep_2: sep2.cantidad,
                    filtro_combustible_1: comb1.codigo,
                    cantidad_comb_1: comb1.cantidad,
                    filtro_combustible_2: comb2.codigo,
                    cantidad_comb_2: comb2.cantidad,
                    filtro_aceite_motor: aceite.codigo,
                    cantidad_aceite: aceite.cantidad,
                    filtro_aire_primario: airePrim.codigo,
                    cantidad_aire_prim: airePrim.cantidad,
                    filtro_aire_secundario: aireSec.codigo,
                    cantidad_aire_sec: aireSec.cantidad,
                });
            }
        } else {
            // ESTRUCTURA VERTICAL (_FILTROS_BD) - fila máquina + 5 filas filtros
            let currentMachine: string | null = null;
            let currentFiltro: any = null;

            for (let i = 1; i < allRows.length; i++) {
                const row = allRows[i];
                if (!row || row.length === 0) continue;

                const col0 = String(row[0] || '').trim();
                const col1 = String(row[1] || '').trim();
                const col2 = row[2];

                const esFiltro = col1.toUpperCase().includes('FILTRO');
                const esPosibleMaquina = col0.includes('(') ||
                    col0.toUpperCase().includes('EXCAVADORA') ||
                    col0.toUpperCase().includes('MOTONIVELADORA') ||
                    col0.toUpperCase().includes('CARGADOR') ||
                    col0.toUpperCase().includes('VOLQUETE') ||
                    col0.toUpperCase().includes('CISTERNA') ||
                    col0.toUpperCase().includes('RETROEXCAVADORA') ||
                    col0.toUpperCase().includes('RODILLO') ||
                    col0.toUpperCase().includes('CAMION');

                if (col0 && !esFiltro && esPosibleMaquina) {
                    if (currentFiltro && currentMachine) {
                        filtros.push(currentFiltro);
                    }
                    currentMachine = col0;
                    const match = col0.match(/^([^(]+)/);
                    const codigo = match ? match[1].trim().replace(/\s+/g, '-').substring(0, 15) : col0.substring(0, 15);

                    currentFiltro = {
                        maquinaria_codigo: codigo,
                        maquinaria_descripcion: col0,
                        filtro_separador_1: '', cantidad_sep_1: 0,
                        filtro_combustible_1: '', cantidad_comb_1: 0,
                        filtro_aceite_motor: '', cantidad_aceite: 0,
                        filtro_aire_primario: '', cantidad_aire_prim: 0,
                        filtro_aire_secundario: '', cantidad_aire_sec: 0,
                    };
                } else if (col0 && esFiltro && currentFiltro) {
                    const descripcionLower = col1.toLowerCase();
                    const cantidad = parseInt(col2) || 1;

                    if (descripcionLower.includes('separador')) {
                        currentFiltro.filtro_separador_1 = col0;
                        currentFiltro.cantidad_sep_1 = cantidad;
                    } else if (descripcionLower.includes('combustible') && !descripcionLower.includes('separador')) {
                        currentFiltro.filtro_combustible_1 = col0;
                        currentFiltro.cantidad_comb_1 = cantidad;
                    } else if (descripcionLower.includes('aceite')) {
                        currentFiltro.filtro_aceite_motor = col0;
                        currentFiltro.cantidad_aceite = cantidad;
                    } else if (descripcionLower.includes('primario')) {
                        currentFiltro.filtro_aire_primario = col0;
                        currentFiltro.cantidad_aire_prim = cantidad;
                    } else if (descripcionLower.includes('secundario')) {
                        currentFiltro.filtro_aire_secundario = col0;
                        currentFiltro.cantidad_aire_sec = cantidad;
                    }
                }
            }
            if (currentFiltro && currentMachine) {
                filtros.push(currentFiltro);
            }
        }

        console.log('Filtros procesados total:', filtros.length);
        if (filtros.length > 0) {
            console.log('Primer filtro:', filtros[0]);
        }
        return filtros;
    }

    // Función dummy para mantener compatibilidad - no se usa directamente
    function mapRowToFiltro(row: any[], headers: string[]) {
        return null; // Los filtros se procesan con processFilterData
    }


    async function handleImport() {
        if (!data.length) return;

        setImporting(true);
        setError('');

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        try {
            const supabase = createClient();
            if (!supabase) {
                alert('Error: Supabase no está configurado');
                setImporting(false);
                return;
            }

            let mappedData: any[];

            // Para filtros, usamos processFilterData que maneja la estructura vertical
            if (selectedType === 'filtros') {
                // Reconstruir todas las filas incluyendo headers para processFilterData
                const allRows = [headers, ...data];
                mappedData = processFilterData(allRows);
                console.log('Filtros procesados:', mappedData.length, mappedData);
            } else {
                // Para otros tipos, mapear fila por fila
                mappedData = data.map(row => {
                    switch (selectedType) {
                        case 'maquinaria':
                            return mapRowToMaquinaria(row, headers);
                        case 'mantenimientos':
                            return mapRowToMantenimiento(row, headers);
                        case 'soat':
                            return mapRowToSoat(row, headers);
                        case 'citv':
                            return mapRowToCitv(row, headers);
                        default:
                            return null;
                    }
                }).filter(Boolean);
            }

            console.log('Datos mapeados:', mappedData);

            // Insertar en lote para mejor rendimiento
            const { data: insertedData, error: insertError } = await supabase
                .from(selectedType)
                .insert(mappedData)
                .select();

            if (insertError) {
                console.error('Error de inserción:', insertError);
                errors.push(insertError.message);

                // Intentar insertar uno por uno para ver cuáles fallan
                for (const item of mappedData) {
                    try {
                        const { error: singleError } = await supabase.from(selectedType).insert([item]);
                        if (singleError) {
                            errorCount++;
                            console.error('Error en item:', item, singleError);
                        } else {
                            successCount++;
                        }
                    } catch (e) {
                        errorCount++;
                    }
                }
            } else {
                successCount = insertedData?.length || mappedData.length;
            }

            setResult({ success: successCount, error: errorCount });
            if (errors.length > 0) {
                setError(`Algunos errores: ${errors.join(', ')}`);
            }
        } catch (err: any) {
            setError(`Error durante la importación: ${err.message || 'Verifique que Supabase esté configurado.'}`);
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
