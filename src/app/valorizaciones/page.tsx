'use client';

import { useState, useEffect, useRef } from 'react';
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
    ChevronUp,
    FolderInput,
    FileText
} from 'lucide-react';
import { fetchTable, updateMachineHours } from '@/lib/api'; // Usamos updateMachineHours para consistencia
import { formatNumber } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useAuth } from '@/components/auth-provider';
import { puedeVer, puedeCrear } from '@/lib/permisos';
import { Role, Maquinaria, Mantenimiento } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface HorometroExcel {
    codigo: string;
    horometro: number;
    archivo: string;
    encontrado: boolean;
    diferencia?: number;
    horometroAnterior?: number;
    metodoDeteccion?: 'CODIGO' | 'SERIE' | 'PLACA';
    estadoAlertaEstimado?: 'VENCIDO' | 'URGENTE' | 'PROXIMO' | 'EN REGLA';
}

export default function ValorizacionesPage() {
    const [maquinaria, setMaquinaria] = useState<Maquinaria[]>([]);
    const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Estado para los Excel cargados
    const [excelData, setExcelData] = useState<HorometroExcel[]>([]);
    const [filesCount, setFilesCount] = useState(0);
    const [folderName, setFolderName] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [updateResults, setUpdateResults] = useState<{ success: number; errors: number } | null>(null);

    const { profile } = useAuth();
    const router = useRouter();
    const userRole = profile?.rol as Role;
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                fetchTable<Maquinaria>('maquinaria'),
                fetchTable<Mantenimiento>('mantenimientos')
            ]);
            setMaquinaria(maq || []);
            setMantenimientos(mtto || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setProcessing(true);
        setUpdateResults(null);
        setFilesCount(files.length);
        // Intentar obtener el nombre de la carpeta del primer archivo si es posible
        const firstFile = files[0];
        const pathParts = firstFile.webkitRelativePath.split('/');
        setFolderName(pathParts.length > 1 ? pathParts[0] : 'Carpeta seleccionada');

        const horometrosEncontrados: HorometroExcel[] = [];
        const processedCodes = new Set<string>();

        // Procesar archivos secuencialmente para no bloquear el navegador
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Ignorar archivos temporales de Excel (~$)
            if (file.name.startsWith('~$') || (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls'))) {
                continue;
            }

            try {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                    procesarHoja(jsonData, file.name, horometrosEncontrados, processedCodes);
                });

            } catch (err) {
                console.warn(`Error leyendo archivo ${file.name}:`, err);
            }
        }

        setExcelData(horometrosEncontrados.sort((a, b) => {
            if (a.encontrado && !b.encontrado) return -1;
            if (!a.encontrado && b.encontrado) return 1;
            return a.codigo.localeCompare(b.codigo);
        }));

        setShowPreview(true);
        setProcessing(false);
    };

    function procesarHoja(data: any[][], fileName: string, resultados: HorometroExcel[], processedCodes: Set<string>) {
        // Recorrer filas buscando patrones
        data.forEach((row, rowIndex) => {
            if (!row || row.length === 0) return;

            row.forEach((cell, colIndex) => {
                if (typeof cell !== 'string') return;

                const cellStr = cell.trim().toUpperCase();
                let maquinaEncontrada: Maquinaria | undefined;
                let metodo: 'CODIGO' | 'SERIE' | 'PLACA' | undefined;

                // 1. Buscar por CÓDIGO (Ej: EXC-01)
                // Usamos una regex un poco más flexible pero segura
                if (cellStr.match(/^[A-Z]{2,4}-?\d{1,3}$/)) {
                    maquinaEncontrada = maquinaria.find(m => m.codigo === cellStr);
                    if (maquinaEncontrada) metodo = 'CODIGO';
                }

                // 2. Buscar por SERIE (si no encontró por código)
                if (!maquinaEncontrada && cellStr.length > 5) { // Evitar series muy cortas que sean falsos positivos
                    maquinaEncontrada = maquinaria.find(m => m.serie && m.serie.toUpperCase().includes(cellStr));
                    if (maquinaEncontrada) metodo = 'SERIE';
                }

                // 3. Buscar por PLACA (si tenemos ese dato en el futuro, o en algun campo flexible)
                // TODO: Agregar campo placa a interfaz si se confirma su uso

                if (maquinaEncontrada) {
                    // Si ya procesamos esta máquina en este lote, saltar (o nos quedamos con el mayor? por ahora saltamos)
                    if (processedCodes.has(maquinaEncontrada.codigo)) return;

                    // Buscar horómetro en las siguientes celdas de la misma fila
                    let horometroEncontrado = 0;

                    // Buscar en las siguientes 10 columnas
                    for (let i = colIndex + 1; i < Math.min(colIndex + 20, row.length); i++) {
                        const valor = row[i];
                        // Validar que sea número y parezca horómetro (entre 100 y 999999)
                        if (typeof valor === 'number' && valor > 100 && valor < 999999) {
                            horometroEncontrado = valor;
                            break;
                        }
                    }

                    if (horometroEncontrado > 0) {
                        // Calcular datos estimados
                        const mtto = mantenimientos.find(m => m.codigo_maquina === maquinaEncontrada!.codigo);
                        let estadoEst: any = 'EN REGLA';
                        if (mtto) {
                            const dif = mtto.mantenimiento_proximo - horometroEncontrado;
                            if (dif <= 0) estadoEst = 'VENCIDO';
                            else if (dif <= 50) estadoEst = 'URGENTE';
                            else if (dif <= 100) estadoEst = 'PROXIMO';
                        }

                        resultados.push({
                            codigo: maquinaEncontrada.codigo,
                            horometro: horometroEncontrado,
                            archivo: fileName,
                            encontrado: true,
                            horometroAnterior: maquinaEncontrada.horas_actuales,
                            diferencia: horometroEncontrado - maquinaEncontrada.horas_actuales,
                            metodoDeteccion: metodo,
                            estadoAlertaEstimado: estadoEst
                        });
                        processedCodes.add(maquinaEncontrada.codigo);
                    }
                }
            });
        });
    }

    async function aplicarActualizaciones() {
        if (!excelData.length) return;
        setProcessing(true);
        let success = 0;
        let errors = 0;

        for (const item of excelData) {
            if (!item.encontrado || !item.diferencia || item.diferencia <= 0) continue; // Solo actualizar si aumenta

            try {
                // Usar la función centralizada en api.ts
                const result = await updateMachineHours(
                    item.codigo,
                    item.horometro,
                    { id: profile?.id || '', email: profile?.email || '', nombre: profile?.nombre_completo || '' }
                );

                if (result.success) success++;
                else errors++;
            } catch (error) {
                console.error(`Error actualizando ${item.codigo}:`, error);
                errors++;
            }
        }

        setUpdateResults({ success, errors });
        setProcessing(false);
        fetchData(); // Recargar datos frescos
    }

    function exportarReporte() {
        const fecha = new Date().toLocaleDateString();
        const hora = new Date().toLocaleTimeString();

        let contenido = `REPORTE DE IMPORTACIÓN DE HORÓMETROS - VALORIZACIONES\n`;
        contenido += `Fecha: ${fecha} ${hora}\n`;
        contenido += `Carpeta/Archivo: ${folderName || filesCount + ' archivos'}\n`;
        contenido += `Usuario: ${profile?.nombre_completo}\n`;
        contenido += `=================================================================\n\n`;

        // Resumen
        const encontrados = excelData.filter(e => e.encontrado).length;
        const noEncontrados = excelData.length - encontrados;
        const actualizados = excelData.filter(e => e.encontrado && (e.diferencia || 0) > 0).length;

        contenido += `RESUMEN:\n`;
        contenido += `- Máquinas encontradas: ${encontrados}\n`;
        contenido += `- Máquinas no encontradas: ${noEncontrados}\n`;
        contenido += `- Con incremento de horas: ${actualizados}\n\n`;

        contenido += `DETALLE DE HALLAZGOS:\n`;
        contenido += `Código\t| Horómetro\t| Anterior\t| Dif.\t| Estado Est.\t| Archivo\n`;
        contenido += `-----------------------------------------------------------------\n`;

        excelData.forEach(item => {
            const dif = item.diferencia ? (item.diferencia > 0 ? `+${item.diferencia}` : item.diferencia) : '-';
            const estado = item.estadoAlertaEstimado || '-';
            contenido += `${item.codigo.padEnd(8)}\t| ${item.horometro.toString().padEnd(10)}\t| ${String(item.horometroAnterior || '-').padEnd(10)}\t| ${String(dif).padEnd(6)}\t| ${estado.padEnd(12)}\t| ${item.archivo}\n`;
        });

        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Horometros_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function limpiarDatos() {
        setExcelData([]);
        setFilesCount(0);
        setFolderName('');
        setShowPreview(false);
        setUpdateResults(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // Contadores para el dashboard
    const stats = {
        total: excelData.filter(e => e.encontrado).length,
        vencidos: excelData.filter(e => e.estadoAlertaEstimado === 'VENCIDO').length,
        urgentes: excelData.filter(e => e.estadoAlertaEstimado === 'URGENTE').length,
        prox: excelData.filter(e => e.estadoAlertaEstimado === 'PROXIMO').length,
    };

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
                    <p className="text-gray-500 mt-1">Procesar carpetas de valorizaciones y actualizar flota</p>
                </div>

                {showPreview && (
                    <button onClick={exportarReporte} className="btn btn-outline flex items-center gap-2">
                        <FileText size={18} />
                        Exportar Reporte
                    </button>
                )}
            </div>

            {/* Zona de carga */}
            {!showPreview && puedeCrear(userRole, 'valorizaciones') && (
                <div className="card p-10 transition-all hover:shadow-md">
                    <div
                        className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-10 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFolderSelect}
                            className="hidden"
                            // @ts-ignore - webkitdirectory no está en la definición estándar de React pero funciona
                            webkitdirectory=""
                            directory=""
                            multiple
                        />
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                <FolderInput className="text-blue-600" size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-1">
                                    Seleccionar Carpeta de Valorizaciones
                                </h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    El sistema buscará recursivamente en todos los archivos Excel (.xlsx, .xls) dentro de la carpeta seleccionada.
                                </p>
                            </div>
                            <button className="btn btn-primary mt-4">
                                Buscar Archivos
                            </button>
                        </div>
                    </div>
                    {processing && (
                        <div className="flex flex-col items-center justify-center mt-8 gap-3 text-blue-600 animate-pulse">
                            <RefreshCw className="animate-spin" size={32} />
                            <span className="text-lg font-medium">Analizando archivos... esto puede tomar unos segundos.</span>
                        </div>
                    )}
                </div>
            )}

            {/* Dashboard de Resumen (Solo visible tras cargar) */}
            {showPreview && excelData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="card p-4 bg-white border-l-4 border-gray-400">
                        <p className="text-gray-500 text-sm font-medium uppercase">Detectados</p>
                        <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
                    </div>
                    <div className="card p-4 bg-white border-l-4 border-red-500">
                        <p className="text-red-500 text-sm font-medium uppercase">Vencidos (Est)</p>
                        <p className="text-3xl font-bold text-red-600 mt-1">{stats.vencidos}</p>
                    </div>
                    <div className="card p-4 bg-white border-l-4 border-orange-500">
                        <p className="text-orange-500 text-sm font-medium uppercase">Urgentes (Est)</p>
                        <p className="text-3xl font-bold text-orange-600 mt-1">{stats.urgentes}</p>
                    </div>
                    <div className="card p-4 bg-white border-l-4 border-green-500">
                        <p className="text-green-500 text-sm font-medium uppercase">En Regla (Est)</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{stats.prox}</p>
                    </div>
                </div>
            )}

            {/* Vista Previa y Acciones */}
            {showPreview && (
                <div className="card overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <FolderInput size={20} className="text-blue-600" />
                                Resultados: {folderName}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {filesCount} archivos analizados.
                                {excelData.filter(e => e.encontrado).length} máquinas identificadas.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={limpiarDatos} className="btn btn-ghost text-gray-500">
                                <X size={20} /> Cerrar
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-left">Código</th>
                                    <th className="p-3 text-left">Método</th>
                                    <th className="p-3 text-right">Horómetro Excel</th>
                                    <th className="p-3 text-right">Actual Sistema</th>
                                    <th className="p-3 text-right">Diferencia</th>
                                    <th className="p-3 text-left">Est. Mantenimiento</th>
                                    <th className="p-3 text-left">Archivo Origen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {excelData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3">
                                            {item.encontrado ? (
                                                <Check size={18} className="text-green-500" />
                                            ) : (
                                                <AlertTriangle size={18} className="text-amber-400" />
                                            )}
                                        </td>
                                        <td className="p-3 font-bold text-gray-800">{item.codigo}</td>
                                        <td className="p-3 text-xs text-gray-500 bg-gray-100 rounded px-2 w-min whitespace-nowrap">
                                            {item.metodoDeteccion || '-'}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold">
                                            {formatNumber(item.horometro)}
                                        </td>
                                        <td className="p-3 text-right font-mono text-gray-500">
                                            {item.horometroAnterior ? formatNumber(item.horometroAnterior) : '-'}
                                        </td>
                                        <td className="p-3 text-right">
                                            {item.diferencia !== undefined && (
                                                <span className={`font-bold ${item.diferencia > 0 ? 'text-green-600' : item.diferencia < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {item.diferencia > 0 ? '+' : ''}{formatNumber(item.diferencia)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {item.estadoAlertaEstimado === 'VENCIDO' && <span className="badge bg-red-100 text-red-700">Vencido</span>}
                                            {item.estadoAlertaEstimado === 'URGENTE' && <span className="badge bg-orange-100 text-orange-700">Urgente</span>}
                                            {item.estadoAlertaEstimado === 'PROXIMO' && <span className="badge bg-yellow-100 text-yellow-700">Próximo</span>}
                                            {item.estadoAlertaEstimado === 'EN REGLA' && <span className="badge bg-green-100 text-green-700">En Regla</span>}
                                        </td>
                                        <td className="p-3 text-gray-500 text-xs truncate max-w-[200px]" title={item.archivo}>
                                            {item.archivo}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        {updateResults ? (
                            <div className={`flex items-center gap-2 font-medium ${updateResults.errors > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                <Check size={20} />
                                <span>Proceso finalizado: {updateResults.success} actualizados con éxito.</span>
                                {updateResults.errors > 0 && <span className="text-red-600">({updateResults.errors} errores)</span>}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">
                                Revise los datos antes de actualizar. Se registrarán cambios en el historial.
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button onClick={limpiarDatos} className="btn btn-outline">
                                Cancelar
                            </button>
                            {!updateResults && (
                                <button
                                    onClick={aplicarActualizaciones}
                                    disabled={processing || excelData.filter(e => e.encontrado && (e.diferencia || 0) > 0).length === 0}
                                    className="btn btn-primary shadow-lg shadow-blue-200"
                                >
                                    {processing ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={18} />
                                            Actualizando...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={18} />
                                            Actualizar Sistema
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
