import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { destinatarios } = await request.json();

        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json(
                { error: 'RESEND_API_KEY no configurada. Agrégala en Vercel.' },
                { status: 500 }
            );
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const supabase = createClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase no configurado' },
                { status: 500 }
            );
        }

        // Obtener datos de alertas
        const alertas = await obtenerAlertas(supabase);

        if (alertas.total === 0) {
            return NextResponse.json({
                success: true,
                message: 'No hay alertas pendientes'
            });
        }

        // Generar HTML del email
        const html = generarEmailHTML(alertas);

        // Enviar email
        const { data, error } = await resend.emails.send({
            from: 'Maquinaria PRO <alertas@resend.dev>',
            to: destinatarios || ['tu-email@empresa.com'],
            subject: `⚠️ Alertas Maquinaria PRO - ${alertas.total} pendientes`,
            html: html
        });

        if (error) {
            console.error('Error enviando email:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Email enviado a ${destinatarios?.length || 1} destinatario(s)`,
            alertas: alertas.total,
            id: data?.id
        });

    } catch (error: any) {
        console.error('Error en API alertas:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno' },
            { status: 500 }
        );
    }
}

async function obtenerAlertas(supabase: any) {
    const alertas = {
        mantenimientos: [] as any[],
        soat: [] as any[],
        citv: [] as any[],
        total: 0
    };

    // Mantenimientos urgentes o vencidos
    const { data: mtto } = await supabase
        .from('mantenimientos')
        .select('*')
        .in('estado_alerta', ['VENCIDO', 'URGENTE', 'PROXIMO']);

    if (mtto) {
        alertas.mantenimientos = mtto;
    }

    // SOAT próximos a vencer (menos de 30 días)
    const { data: soat } = await supabase
        .from('soat')
        .select('*')
        .lt('dias_restantes', 30)
        .gt('dias_restantes', -30);

    if (soat) {
        alertas.soat = soat;
    }

    // CITV próximos a vencer (menos de 30 días)
    const { data: citv } = await supabase
        .from('citv')
        .select('*')
        .lt('dias_restantes', 30)
        .gt('dias_restantes', -30);

    if (citv) {
        alertas.citv = citv;
    }

    alertas.total = alertas.mantenimientos.length + alertas.soat.length + alertas.citv.length;

    return alertas;
}

function generarEmailHTML(alertas: any) {
    const fecha = new Date().toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1E3A5F 0%, #152a43 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 10px 0 0; opacity: 0.8; }
            .content { padding: 30px; }
            .alert-section { margin-bottom: 25px; }
            .alert-section h2 { font-size: 16px; color: #1E3A5F; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; }
            .alert-item { background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid #ef4444; }
            .alert-item.warning { border-left-color: #f59e0b; }
            .alert-item.info { border-left-color: #3b82f6; }
            .alert-item .codigo { font-weight: bold; color: #1E3A5F; }
            .alert-item .detalle { color: #64748b; font-size: 14px; margin-top: 5px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .badge-danger { background: #fee2e2; color: #991b1b; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-info { background: #dbeafe; color: #1e40af; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            .summary { background: #1E3A5F; color: white; padding: 20px; text-align: center; }
            .summary-number { font-size: 48px; font-weight: bold; }
            .no-alerts { text-align: center; color: #22c55e; padding: 40px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚜 MAQUINARIA PRO</h1>
                <p>Reporte de Alertas - ${fecha}</p>
            </div>

            <div class="summary">
                <div class="summary-number">${alertas.total}</div>
                <div>Alertas Pendientes</div>
            </div>

            <div class="content">
                ${alertas.mantenimientos.length > 0 ? `
                <div class="alert-section">
                    <h2>🔧 Mantenimientos (${alertas.mantenimientos.length})</h2>
                    ${alertas.mantenimientos.map((m: any) => `
                        <div class="alert-item ${m.estado_alerta === 'VENCIDO' ? '' : m.estado_alerta === 'URGENTE' ? 'warning' : 'info'}">
                            <span class="codigo">${m.codigo_maquina}</span>
                            <span class="badge ${m.estado_alerta === 'VENCIDO' ? 'badge-danger' : m.estado_alerta === 'URGENTE' ? 'badge-warning' : 'badge-info'}">${m.estado_alerta}</span>
                            <div class="detalle">
                                Diferencia: ${m.diferencia_horas} horas | Próximo: ${m.mantenimiento_proximo} hrs
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${alertas.soat.length > 0 ? `
                <div class="alert-section">
                    <h2>📋 SOAT (${alertas.soat.length})</h2>
                    ${alertas.soat.map((s: any) => `
                        <div class="alert-item ${s.dias_restantes <= 0 ? '' : s.dias_restantes <= 15 ? 'warning' : 'info'}">
                            <span class="codigo">${s.codigo}</span>
                            <span class="badge ${s.dias_restantes <= 0 ? 'badge-danger' : s.dias_restantes <= 15 ? 'badge-warning' : 'badge-info'}">
                                ${s.dias_restantes <= 0 ? 'VENCIDO' : s.dias_restantes + ' días'}
                            </span>
                            <div class="detalle">
                                Vence: ${s.fecha_vencimiento} | ${s.tipo || 'N/A'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${alertas.citv.length > 0 ? `
                <div class="alert-section">
                    <h2>🔍 Revisiones CITV (${alertas.citv.length})</h2>
                    ${alertas.citv.map((c: any) => `
                        <div class="alert-item ${c.dias_restantes <= 0 ? '' : c.dias_restantes <= 15 ? 'warning' : 'info'}">
                            <span class="codigo">${c.codigo}</span>
                            <span class="badge ${c.dias_restantes <= 0 ? 'badge-danger' : c.dias_restantes <= 15 ? 'badge-warning' : 'badge-info'}">
                                ${c.dias_restantes <= 0 ? 'VENCIDO' : c.dias_restantes + ' días'}
                            </span>
                            <div class="detalle">
                                Vence: ${c.fecha_vencimiento} | ${c.tipo || 'N/A'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${alertas.total === 0 ? `
                <div class="no-alerts">
                    ✅ No hay alertas pendientes
                </div>
                ` : ''}
            </div>

            <div class="footer">
                <p>Este es un email automático del sistema Maquinaria PRO</p>
                <p>Grupo Vásquez - ${new Date().getFullYear()}</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// GET para verificar alertas pendientes
export async function GET() {
    try {
        const supabase = createClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 });
        }

        const alertas = await obtenerAlertas(supabase);

        return NextResponse.json({
            success: true,
            alertas: {
                mantenimientos: alertas.mantenimientos.length,
                soat: alertas.soat.length,
                citv: alertas.citv.length,
                total: alertas.total
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
