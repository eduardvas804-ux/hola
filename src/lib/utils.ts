import { differenceInDays } from 'date-fns';
import { EstadoAlerta } from './types';

// Calcular alerta de mantenimiento
export function calcularAlertaMantenimiento(
    horasActuales: number,
    mantenimientoProximo: number
): { estado: EstadoAlerta; diferencia: number } {
    const diferencia = mantenimientoProximo - horasActuales;

    if (diferencia <= 0) {
        return { estado: 'VENCIDO', diferencia };
    } else if (diferencia <= 50) {
        return { estado: 'URGENTE', diferencia };
    } else if (diferencia <= 100) {
        return { estado: 'PROXIMO', diferencia };
    }
    return { estado: 'EN REGLA', diferencia };
}

// Calcular alerta de documento (SOAT, CITV)
export function calcularAlertaDocumento(
    fechaVencimiento: string
): { accion: string; diasRestantes: number; color: string } {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = differenceInDays(vencimiento, hoy);

    if (diasRestantes < 0) {
        return { accion: '⛔ VENCIDO', diasRestantes, color: '#7f1d1d' };
    } else if (diasRestantes <= 7) {
        return { accion: '🔴 RENOVAR ESTA SEMANA', diasRestantes, color: '#dc2626' };
    } else if (diasRestantes <= 15) {
        return { accion: '🟡 RENOVAR PRONTO', diasRestantes, color: '#f59e0b' };
    } else if (diasRestantes <= 30) {
        return { accion: '🔵 PROGRAMAR RENOVACIÓN', diasRestantes, color: '#3b82f6' };
    }
    return { accion: '✅ EN REGLA', diasRestantes, color: '#22c55e' };
}

// Color por estado de alerta de mantenimiento
export function getColorAlertaMantenimiento(estado: EstadoAlerta): string {
    switch (estado) {
        case 'VENCIDO': return '#7f1d1d';
        case 'URGENTE': return '#dc2626';
        case 'PROXIMO': return '#f59e0b';
        case 'EN REGLA': return '#22c55e';
        default: return '#6b7280';
    }
}

// Formato de número con separador de miles
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
}

// Formato de fecha
export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
