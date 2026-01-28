'use client';

import * as XLSX from 'xlsx';

// Función para exportar datos a Excel
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Datos') {
    if (!data || data.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Convertir datos a hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Descargar archivo
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Función para formatear datos de maquinaria para exportación
export function formatMaquinariaForExport(maquinaria: any[]) {
    return maquinaria.map(m => ({
        'ITEM': m.item,
        'SERIE': m.serie,
        'TIPO': m.tipo,
        'MODELO': m.modelo,
        'MARCA': m.marca,
        'AÑO': m.año,
        'CÓDIGO': m.codigo,
        'EMPRESA': m.empresa,
        'OPERADOR': m.operador,
        'TRAMO': m.tramo,
        'ESTADO': m.estado,
        'HORAS ACTUALES': m.horas_actuales,
    }));
}

// Función para formatear datos de mantenimientos para exportación
export function formatMantenimientosForExport(mantenimientos: any[]) {
    return mantenimientos.map(m => ({
        'CÓDIGO': m.codigo_maquina,
        'TIPO': m.tipo,
        'MODELO': m.modelo,
        'MTTO ÚLTIMO': m.mantenimiento_ultimo,
        'MTTO PRÓXIMO': m.mantenimiento_proximo,
        'HORA ACTUAL': m.hora_actual,
        'DIFERENCIA': m.diferencia_horas,
        'OPERADOR': m.operador,
        'TRAMO': m.tramo,
        'ESTADO': m.estado_alerta,
    }));
}

// Función para formatear datos de SOAT para exportación
export function formatSoatForExport(soat: any[]) {
    return soat.map(s => ({
        'CÓDIGO': s.codigo,
        'TIPO': s.tipo,
        'MODELO': s.modelo,
        'PLACA/SERIE': s.placa_serie,
        'EMPRESA': s.empresa,
        'FECHA VENCIMIENTO': s.fecha_vencimiento,
        'DÍAS RESTANTES': s.dias_restantes,
    }));
}

// Función para formatear datos de CITV para exportación
export function formatCitvForExport(citv: any[]) {
    return citv.map(c => ({
        'CÓDIGO': c.codigo,
        'TIPO': c.tipo,
        'MODELO': c.modelo,
        'PLACA/SERIE': c.placa_serie,
        'EMPRESA': c.empresa,
        'FECHA VENCIMIENTO': c.fecha_vencimiento,
        'DÍAS RESTANTES': c.dias_restantes,
    }));
}

// Función para formatear datos de filtros para exportación
export function formatFiltrosForExport(filtros: any[]) {
    return filtros.map(f => ({
        'CÓDIGO MAQUINARIA': f.maquinaria_codigo,
        'DESCRIPCIÓN': f.maquinaria_descripcion,
        'SEPARADOR 1': f.filtro_separador_1,
        'CANT SEP 1': f.cantidad_sep_1,
        'COMBUSTIBLE 1': f.filtro_combustible_1,
        'CANT COMB 1': f.cantidad_comb_1,
        'ACEITE MOTOR': f.filtro_aceite_motor,
        'CANT ACEITE': f.cantidad_aceite,
        'AIRE PRIMARIO': f.filtro_aire_primario,
        'CANT AIRE PRIM': f.cantidad_aire_prim,
        'AIRE SECUNDARIO': f.filtro_aire_secundario,
        'CANT AIRE SEC': f.cantidad_aire_sec,
    }));
}
