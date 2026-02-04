import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Maquinaria, SOAT, CITV } from './types';

// Configuración del PDF
const PDF_CONFIG = {
    title: 'MAQUINARIA PRO',
    subtitle: 'Sistema de Control de Maquinaria Pesada',
    headerColor: [30, 58, 95] as [number, number, number], // #1E3A5F
    accentColor: [46, 125, 50] as [number, number, number], // #2E7D32
};

// Generar encabezado del PDF
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Fondo del encabezado
    doc.setFillColor(...PDF_CONFIG.headerColor);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(PDF_CONFIG.title, 14, 15);

    // Subtítulo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(PDF_CONFIG.subtitle, 14, 22);

    // Título del reporte
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 30);

    // Fecha
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const fecha = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    doc.text(`Generado: ${fecha}`, pageWidth - 14, 15, { align: 'right' });

    if (subtitle) {
        doc.text(subtitle, pageWidth - 14, 22, { align: 'right' });
    }

    return 45; // Y position after header
}

// Agregar pie de página
function addFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.text(
            'MAQUINARIA PRO - Documento generado automáticamente',
            14,
            pageHeight - 10
        );
    }
}

// Exportar reporte de maquinaria
export function exportMaquinariaPDF(data: Maquinaria[], filters?: string) {
    const doc = new jsPDF('landscape');
    const startY = addHeader(doc, 'Reporte de Maquinaria', filters);

    // Estadísticas rápidas
    const operativos = data.filter(m => m.estado === 'operativo').length;
    const mantenimiento = data.filter(m => m.estado === 'mantenimiento').length;
    const inoperativos = data.filter(m => m.estado === 'inoperativo').length;

    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Total: ${data.length} | Operativos: ${operativos} | En Mantenimiento: ${mantenimiento} | Inoperativos: ${inoperativos}`, 14, startY - 5);

    // Tabla de datos
    autoTable(doc, {
        startY: startY + 2,
        head: [['#', 'Código', 'Serie', 'Tipo', 'Marca/Modelo', 'Año', 'Estado', 'Operador', 'Ubicación', 'Horas']],
        body: data.map((m, i) => [
            i + 1,
            m.codigo_equipo || '-',
            m.serie,
            m.tipo,
            `${m.marca} ${m.modelo}`,
            m.ano,
            m.estado.toUpperCase(),
            m.operador || '-',
            m.ubicacion || '-',
            m.hours_actuales?.toLocaleString() || '-',
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
            fillColor: PDF_CONFIG.headerColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
            0: { cellWidth: 10 },
            6: { fontStyle: 'bold' },
        },
    });

    addFooter(doc);
    doc.save(`maquinaria_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Exportar reporte de SOAT/CITV
export function exportDocumentosPDF(
    soatData: SOAT[],
    citvData: CITV[],
    title: string = 'Documentos Legales'
) {
    const doc = new jsPDF();
    let currentY = addHeader(doc, title);

    // Sección SOAT
    if (soatData.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(...PDF_CONFIG.headerColor);
        doc.setFont('helvetica', 'bold');
        doc.text('SOAT - Seguro Obligatorio', 14, currentY);
        currentY += 5;

        autoTable(doc, {
            startY: currentY,
            head: [['Equipo', 'Póliza', 'Aseguradora', 'Vencimiento', 'Estado']],
            body: soatData.map((s) => {
                const dias = Math.ceil((new Date(s.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const estado = dias < 0 ? 'VENCIDO' : dias <= 30 ? 'PRÓXIMO' : 'VIGENTE';
                return [
                    s.codigo_equipo,
                    s.numero_poliza,
                    s.aseguradora,
                    format(new Date(s.fecha_vencimiento), 'dd/MM/yyyy'),
                    estado,
                ];
            }),
            styles: { fontSize: 9 },
            headStyles: { fillColor: PDF_CONFIG.headerColor },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Sección CITV
    if (citvData.length > 0) {
        // Verificar si necesitamos nueva página
        if (currentY > 200) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(...PDF_CONFIG.headerColor);
        doc.setFont('helvetica', 'bold');
        doc.text('CITV - Inspección Técnica Vehicular', 14, currentY);
        currentY += 5;

        autoTable(doc, {
            startY: currentY,
            head: [['Equipo', 'Certificado', 'Entidad', 'Vencimiento', 'Estado']],
            body: citvData.map((c) => {
                const dias = Math.ceil((new Date(c.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const estado = dias < 0 ? 'VENCIDO' : dias <= 30 ? 'PRÓXIMO' : 'VIGENTE';
                return [
                    c.codigo_equipo,
                    c.numero_certificado,
                    c.entidad,
                    format(new Date(c.fecha_vencimiento), 'dd/MM/yyyy'),
                    estado,
                ];
            }),
            styles: { fontSize: 9 },
            headStyles: { fillColor: PDF_CONFIG.headerColor },
        });
    }

    addFooter(doc);
    doc.save(`documentos_legales_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Exportar reporte de alertas
export function exportAlertasPDF(
    alertas: { tipo: string; equipo: string; mensaje: string; urgencia: string }[]
) {
    const doc = new jsPDF();
    const startY = addHeader(doc, 'Reporte de Alertas', `${alertas.length} alertas activas`);

    const urgentes = alertas.filter(a => a.urgencia === 'alta').length;
    const proximas = alertas.filter(a => a.urgencia === 'media').length;

    // Resumen
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(14, startY - 3, 50, 15, 3, 3, 'F');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(10);
    doc.text(`${urgentes} Urgentes`, 20, startY + 6);

    doc.setFillColor(254, 243, 199);
    doc.roundedRect(70, startY - 3, 50, 15, 3, 3, 'F');
    doc.setTextColor(146, 64, 14);
    doc.text(`${proximas} Próximos`, 76, startY + 6);

    // Tabla de alertas
    autoTable(doc, {
        startY: startY + 18,
        head: [['Tipo', 'Equipo', 'Mensaje', 'Urgencia']],
        body: alertas.map((a) => [
            a.tipo,
            a.equipo,
            a.mensaje,
            a.urgencia.toUpperCase(),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 38, 38] },
        columnStyles: {
            3: {
                fontStyle: 'bold',
                cellWidth: 25,
            },
        },
        didDrawCell: (data: any) => {
            if (data.column.index === 3 && data.cell.section === 'body') {
                const text = data.cell.raw as string;
                if (text === 'ALTA') {
                    doc.setTextColor(153, 27, 27);
                } else if (text === 'MEDIA') {
                    doc.setTextColor(146, 64, 14);
                }
            }
        },
    });

    addFooter(doc);
    doc.save(`alertas_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Exportar reporte de mantenimientos
export function exportMantenimientosPDF(
    data: any[],
    title: string = 'Estado de Mantenimientos'
) {
    const doc = new jsPDF('landscape');
    const startY = addHeader(doc, title);

    // Contadores
    const pendientes = data.filter(m => {
        const diff = (m.proximo_mantenimiento || 0) - (m.hours_actuales || 0);
        return diff <= 0;
    }).length;

    const proximos = data.filter(m => {
        const diff = (m.proximo_mantenimiento || 0) - (m.hours_actuales || 0);
        return diff > 0 && diff <= 50;
    }).length;

    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Total: ${data.length} | Vencidos: ${pendientes} | Próximos: ${proximos}`, 14, startY - 5);

    autoTable(doc, {
        startY: startY + 2,
        head: [['#', 'Código', 'Serie', 'Tipo', 'Horas Actuales', 'Próx. Mtto', 'Hrs Restantes', 'Estado', 'Operador', 'Ubicación']],
        body: data.map((m, i) => {
            const hrsRestantes = (m.proximo_mantenimiento || 0) - (m.hours_actuales || 0);
            const estado = hrsRestantes <= 0 ? 'VENCIDO' : hrsRestantes <= 50 ? 'PRÓXIMO' : 'AL DÍA';
            return [
                i + 1,
                m.codigo_equipo || '-',
                m.serie,
                m.tipo,
                m.hours_actuales?.toLocaleString() || '-',
                m.proximo_mantenimiento?.toLocaleString() || '-',
                hrsRestantes,
                estado,
                m.operador || '-',
                m.ubicacion || '-',
            ];
        }),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: PDF_CONFIG.headerColor },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
            7: { fontStyle: 'bold' },
        },
    });

    addFooter(doc);
    doc.save(`mantenimientos_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
