'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    Printer,
    Calendar,
    Truck,
    Wrench,
    FileCheck,
    Fuel,
    BarChart3,
    PieChart
} from 'lucide-react';
import { fetchTable } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';

type TipoReporte = 'general' | 'maquinaria' | 'mantenimientos' | 'combustible' | 'documentos';

export default function ReportesPage() {
    const [tipoReporte, setTipoReporte] = useState<TipoReporte>('general');
    const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Datos
    const [maquinaria, setMaquinaria] = useState<any[]>([]);
    const [mantenimientos, setMantenimientos] = useState<any[]>([]);
    const [soat, setSoat] = useState<any[]>([]);
    const [citv, setCitv] = useState<any[]>([]);
    const [combustible, setCombustible] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [maq, mtto, soatData, citvData, combData] = await Promise.all([
                fetchTable<any>('maquinaria'),
                fetchTable<any>('mantenimientos'),
                fetchTable<any>('soat'),
                fetchTable<any>('citv'),
                fetchTable<any>('combustible')
            ]);

            setMaquinaria(maq || []);
            setMantenimientos(mtto || []);
            setSoat(soatData || []);
            setCitv(citvData || []);
            setCombustible(combData || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    function generarReporte() {
        setGenerating(true);

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Permite las ventanas emergentes para generar el reporte');
            setGenerating(false);
            return;
        }

        const html = generarHTML();
        printWindow.document.write(html);
        printWindow.document.close();
        setGenerating(false);
    }

    function generarHTML(): string {
        const fecha = new Date().toLocaleDateString('es-PE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // Estadísticas
        const stats = {
            totalEquipos: maquinaria.length,
            operativos: maquinaria.filter(m => m.estado === 'OPERATIVO').length,
            enMantenimiento: maquinaria.filter(m => m.estado === 'EN MANTENIMIENTO').length,
            inoperativos: maquinaria.filter(m => m.estado === 'INOPERATIVO').length,
            mttoVencidos: mantenimientos.filter(m => m.estado_alerta === 'VENCIDO').length,
            mttoUrgentes: mantenimientos.filter(m => m.estado_alerta === 'URGENTE').length,
            soatVencer: soat.filter(s => s.dias_restantes <= 30 && s.dias_restantes > 0).length,
            citvVencer: citv.filter(c => c.dias_restantes <= 30 && c.dias_restantes > 0).length,
            totalCombustible: combustible.reduce((sum, c) => sum + (c.galones || 0), 0),
            gastoCombustible: combustible.reduce((sum, c) => sum + (c.total || 0), 0)
        };

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte ${tipoReporte.toUpperCase()} - Maquinaria PRO</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                .header { text-align: center; border-bottom: 3px solid #1E3A5F; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { color: #1E3A5F; font-size: 28px; margin-bottom: 5px; }
                .header p { color: #666; }
                .section { margin-bottom: 30px; }
                .section h2 { color: #1E3A5F; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                .stat-card { background: #f8fafc; border-radius: 8px; padding: 15px; text-align: center; border-left: 4px solid #1E3A5F; }
                .stat-card.success { border-left-color: #22c55e; }
                .stat-card.warning { border-left-color: #f59e0b; }
                .stat-card.danger { border-left-color: #ef4444; }
                .stat-number { font-size: 32px; font-weight: bold; color: #1E3A5F; }
                .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #1E3A5F; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
                td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
                tr:nth-child(even) { background: #f8fafc; }
                .badge { display: inline-block; padding: 4px 8px; border-radius: 20px; font-size: 10px; font-weight: bold; }
                .badge-success { background: #dcfce7; color: #166534; }
                .badge-warning { background: #fef3c7; color: #92400e; }
                .badge-danger { background: #fee2e2; color: #991b1b; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 11px; }
                @media print {
                    body { padding: 0; }
                    .stats-grid { grid-template-columns: repeat(4, 1fr); }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>MAQUINARIA PRO</h1>
                <p>REPORTE ${tipoReporte.toUpperCase()} - ${fecha}</p>
                <p>Grupo Vásquez - Sistema de Control de Maquinaria</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card success">
                    <div class="stat-number">${stats.operativos}</div>
                    <div class="stat-label">OPERATIVOS</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-number">${stats.enMantenimiento}</div>
                    <div class="stat-label">EN MANTENIMIENTO</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-number">${stats.inoperativos}</div>
                    <div class="stat-label">INOPERATIVOS</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalEquipos}</div>
                    <div class="stat-label">TOTAL EQUIPOS</div>
                </div>
            </div>

            ${tipoReporte === 'general' || tipoReporte === 'maquinaria' ? `
            <div class="section">
                <h2>INVENTARIO DE MAQUINARIA</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Horómetro</th>
                            <th>Estado</th>
                            <th>Operador</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${maquinaria.map(m => `
                            <tr>
                                <td><strong>${m.codigo}</strong></td>
                                <td>${m.tipo}</td>
                                <td>${m.marca}</td>
                                <td>${m.modelo}</td>
                                <td>${formatNumber(m.horas_actuales)}</td>
                                <td><span class="badge ${m.estado === 'OPERATIVO' ? 'badge-success' : m.estado === 'INOPERATIVO' ? 'badge-danger' : 'badge-warning'}">${m.estado}</span></td>
                                <td>${m.operador || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${tipoReporte === 'general' || tipoReporte === 'mantenimientos' ? `
            <div class="section">
                <h2>ESTADO DE MANTENIMIENTOS</h2>
                <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 15px;">
                    <div class="stat-card danger">
                        <div class="stat-number">${stats.mttoVencidos}</div>
                        <div class="stat-label">VENCIDOS</div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-number">${stats.mttoUrgentes}</div>
                        <div class="stat-label">URGENTES</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-number">${mantenimientos.filter(m => m.estado_alerta === 'EN REGLA').length}</div>
                        <div class="stat-label">EN REGLA</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Último Mtto</th>
                            <th>Próximo</th>
                            <th>Actual</th>
                            <th>Diferencia</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mantenimientos.map(m => `
                            <tr>
                                <td><strong>${m.codigo_maquina}</strong></td>
                                <td>${m.tipo_mantenimiento || '-'}</td>
                                <td>${formatNumber(m.mantenimiento_ultimo)}</td>
                                <td>${formatNumber(m.mantenimiento_proximo)}</td>
                                <td>${formatNumber(m.hora_actual)}</td>
                                <td>${m.diferencia_horas}</td>
                                <td><span class="badge ${m.estado_alerta === 'EN REGLA' ? 'badge-success' : m.estado_alerta === 'VENCIDO' ? 'badge-danger' : 'badge-warning'}">${m.estado_alerta}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${tipoReporte === 'general' || tipoReporte === 'documentos' ? `
            <div class="section">
                <h2>DOCUMENTOS PRÓXIMOS A VENCER</h2>
                <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 15px;">
                    <div class="stat-card warning">
                        <div class="stat-number">${stats.soatVencer}</div>
                        <div class="stat-label">SOAT POR VENCER</div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-number">${stats.citvVencer}</div>
                        <div class="stat-label">CITV POR VENCER</div>
                    </div>
                </div>
                ${soat.filter(s => s.dias_restantes <= 30).length > 0 ? `
                <h3 style="font-size: 14px; margin: 15px 0 10px;">SOAT</h3>
                <table>
                    <thead>
                        <tr><th>Código</th><th>Tipo</th><th>Placa</th><th>Vencimiento</th><th>Días</th></tr>
                    </thead>
                    <tbody>
                        ${soat.filter(s => s.dias_restantes <= 30).map(s => `
                            <tr>
                                <td><strong>${s.codigo}</strong></td>
                                <td>${s.tipo || '-'}</td>
                                <td>${s.placa_serie || '-'}</td>
                                <td>${s.fecha_vencimiento}</td>
                                <td><span class="badge ${s.dias_restantes <= 0 ? 'badge-danger' : 'badge-warning'}">${s.dias_restantes} días</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}
            </div>
            ` : ''}

            ${tipoReporte === 'combustible' ? `
            <div class="section">
                <h2>RESUMEN DE COMBUSTIBLE</h2>
                <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 15px;">
                    <div class="stat-card">
                        <div class="stat-number">${formatNumber(stats.totalCombustible)}</div>
                        <div class="stat-label">TOTAL GALONES</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-number">S/ ${formatNumber(stats.gastoCombustible)}</div>
                        <div class="stat-label">GASTO TOTAL</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr><th>Fecha</th><th>Código</th><th>Galones</th><th>Precio</th><th>Total</th><th>Proveedor</th></tr>
                    </thead>
                    <tbody>
                        ${combustible.slice(0, 20).map(c => `
                            <tr>
                                <td>${c.fecha}</td>
                                <td><strong>${c.codigo_maquina}</strong></td>
                                <td>${c.galones}</td>
                                <td>S/ ${c.precio_galon?.toFixed(2)}</td>
                                <td><strong>S/ ${c.total?.toFixed(2)}</strong></td>
                                <td>${c.proveedor || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <div class="footer">
                <p>Reporte generado el ${new Date().toLocaleString('es-PE')}</p>
                <p>MAQUINARIA PRO - Grupo Vásquez</p>
            </div>

            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
        `;
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
                        <FileText className="text-purple-600" />
                        Reportes
                    </h1>
                    <p className="text-gray-500 mt-1">Genera reportes PDF de tu flota</p>
                </div>
            </div>

            {/* Tipo de Reporte */}
            <div className="card p-6">
                <h2 className="font-bold text-gray-800 mb-4">Selecciona el tipo de reporte</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { id: 'general', label: 'General', icon: BarChart3, color: 'purple' },
                        { id: 'maquinaria', label: 'Maquinaria', icon: Truck, color: 'blue' },
                        { id: 'mantenimientos', label: 'Mantenimientos', icon: Wrench, color: 'amber' },
                        { id: 'documentos', label: 'Documentos', icon: FileCheck, color: 'green' },
                        { id: 'combustible', label: 'Combustible', icon: Fuel, color: 'red' }
                    ].map(tipo => {
                        const Icon = tipo.icon;
                        const isActive = tipoReporte === tipo.id;
                        return (
                            <button
                                key={tipo.id}
                                onClick={() => setTipoReporte(tipo.id as TipoReporte)}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                    isActive
                                        ? `border-${tipo.color}-500 bg-${tipo.color}-50`
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Icon size={24} className={isActive ? `text-${tipo.color}-600` : 'text-gray-400'} />
                                <span className={`text-sm font-medium ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                                    {tipo.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Generar */}
            <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="font-bold text-gray-800">Reporte {tipoReporte.charAt(0).toUpperCase() + tipoReporte.slice(1)}</h2>
                        <p className="text-sm text-gray-500">Se generará un PDF listo para imprimir</p>
                    </div>
                    <button
                        onClick={generarReporte}
                        disabled={generating}
                        className="btn btn-primary"
                    >
                        {generating ? (
                            <>Generando...</>
                        ) : (
                            <>
                                <Printer size={20} />
                                Generar e Imprimir PDF
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Preview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <Truck className="text-blue-600" size={24} />
                        <div>
                            <p className="text-2xl font-bold">{maquinaria.length}</p>
                            <p className="text-sm text-gray-500">Equipos</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <Wrench className="text-amber-600" size={24} />
                        <div>
                            <p className="text-2xl font-bold">{mantenimientos.filter(m => m.estado_alerta !== 'EN REGLA').length}</p>
                            <p className="text-sm text-gray-500">Alertas Mtto</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <FileCheck className="text-green-600" size={24} />
                        <div>
                            <p className="text-2xl font-bold">{soat.filter(s => s.dias_restantes <= 30).length + citv.filter(c => c.dias_restantes <= 30).length}</p>
                            <p className="text-sm text-gray-500">Docs por vencer</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <Fuel className="text-red-600" size={24} />
                        <div>
                            <p className="text-2xl font-bold">{formatNumber(combustible.reduce((s, c) => s + (c.galones || 0), 0))}</p>
                            <p className="text-sm text-gray-500">Galones</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
