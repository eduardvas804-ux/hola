// Constantes compartidas para toda la aplicación MAQUINARIA PRO

// Estados de maquinaria
export const ESTADOS_MAQUINARIA = {
    OPERATIVO: 'OPERATIVO',
    EN_MANTENIMIENTO: 'EN MANTENIMIENTO',
    INOPERATIVO: 'INOPERATIVO',
    ALQUILADO: 'ALQUILADO',
} as const;

export const ESTADOS_MAQUINARIA_ARRAY = Object.values(ESTADOS_MAQUINARIA);

// Estados de alerta
export const ESTADOS_ALERTA = {
    VENCIDO: 'VENCIDO',
    URGENTE: 'URGENTE',
    PROXIMO: 'PROXIMO',
    EN_REGLA: 'EN REGLA',
} as const;

export const ESTADOS_ALERTA_ARRAY = Object.values(ESTADOS_ALERTA);

// Tipos de mantenimiento
export const TIPOS_MANTENIMIENTO = {
    PREVENTIVO_250H: 'PREVENTIVO 250H',
    PREVENTIVO_500H: 'PREVENTIVO 500H',
    PREVENTIVO_1000H: 'PREVENTIVO 1000H',
    CORRECTIVO: 'CORRECTIVO',
} as const;

export const TIPOS_MANTENIMIENTO_ARRAY = Object.values(TIPOS_MANTENIMIENTO);

// Fuentes de combustible
export const FUENTES_COMBUSTIBLE = {
    CISTERNA: 'CISTERNA',
    GRIFO: 'GRIFO',
} as const;

export const FUENTES_COMBUSTIBLE_ARRAY = Object.values(FUENTES_COMBUSTIBLE);

// Tipos de movimiento de combustible
export const TIPOS_MOVIMIENTO_COMBUSTIBLE = {
    ENTRADA: 'ENTRADA',
    SALIDA: 'SALIDA',
} as const;

export const TIPOS_MOVIMIENTO_ARRAY = Object.values(TIPOS_MOVIMIENTO_COMBUSTIBLE);

// Colores para estados de alerta
export const COLORES_ALERTA = {
    VENCIDO: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
    },
    URGENTE: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
    },
    PROXIMO: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
    },
    EN_REGLA: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
    },
} as const;

// Colores para estados de maquinaria
export const COLORES_ESTADO_MAQUINARIA = {
    OPERATIVO: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        hex: '#22c55e',
    },
    'EN MANTENIMIENTO': {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        hex: '#f59e0b',
    },
    INOPERATIVO: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        hex: '#ef4444',
    },
    ALQUILADO: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        hex: '#3b82f6',
    },
} as const;

// Umbrales de alerta (en horas o días)
export const UMBRALES_ALERTA = {
    // Mantenimiento (horas)
    MANTENIMIENTO_VENCIDO: 0,
    MANTENIMIENTO_URGENTE: 50,
    MANTENIMIENTO_PROXIMO: 100,

    // Documentos (días)
    DOCUMENTO_VENCIDO: 0,
    DOCUMENTO_URGENTE: 7,
    DOCUMENTO_PROXIMO: 30,
} as const;

// Intervalos de mantenimiento estándar (horas)
export const INTERVALOS_MANTENIMIENTO = {
    PM1: 250,   // Preventivo menor
    PM2: 500,   // Preventivo intermedio
    PM3: 1000,  // Preventivo mayor
    PM4: 2000,  // Overhaul parcial
} as const;

// Nombres de tablas en Supabase
export const TABLAS = {
    MAQUINARIA: 'maquinaria',
    MANTENIMIENTOS: 'mantenimientos',
    SOAT: 'soat',
    CITV: 'citv',
    FILTROS: 'filtros',
    COMBUSTIBLE: 'combustible',
    HISTORIAL: 'historial',
    PERFILES: 'perfiles',
    ALERTAS: 'alertas',
    VALORIZACIONES: 'valorizaciones',
} as const;

// Campos de vinculación entre tablas
export const CAMPOS_VINCULACION = {
    // Campo principal de vinculación (código de máquina)
    MAQUINARIA: 'codigo',
    MANTENIMIENTOS: 'codigo_maquina',
    SOAT: 'codigo',
    CITV: 'codigo',
    FILTROS: 'maquinaria_codigo',
    COMBUSTIBLE: 'codigo_maquina',
} as const;

// Configuración de cache
export const CACHE_CONFIG = {
    STALE_TIME: 30 * 1000,      // 30 segundos
    CACHE_TIME: 10 * 60 * 1000, // 10 minutos
    TOKEN_EXPIRY: 55 * 60 * 1000, // 55 minutos
} as const;

// Mensajes de estado comunes
export const MENSAJES = {
    ERROR_CONEXION: 'Error de conexión con el servidor',
    ERROR_GUARDAR: 'Error al guardar los datos',
    ERROR_ELIMINAR: 'Error al eliminar el registro',
    EXITO_GUARDAR: 'Datos guardados correctamente',
    EXITO_ELIMINAR: 'Registro eliminado correctamente',
    CONFIRMACION_ELIMINAR: '¿Está seguro de eliminar este registro?',
    SIN_DATOS: 'No hay datos disponibles',
    CARGANDO: 'Cargando...',
    MODO_DEMO: 'Datos de demostración',
} as const;

// Helper para calcular estado de alerta de mantenimiento
export function calcularEstadoAlertaMantenimiento(diferenciaHoras: number): keyof typeof ESTADOS_ALERTA {
    if (diferenciaHoras <= UMBRALES_ALERTA.MANTENIMIENTO_VENCIDO) return 'VENCIDO';
    if (diferenciaHoras <= UMBRALES_ALERTA.MANTENIMIENTO_URGENTE) return 'URGENTE';
    if (diferenciaHoras <= UMBRALES_ALERTA.MANTENIMIENTO_PROXIMO) return 'PROXIMO';
    return 'EN_REGLA';
}

// Helper para calcular estado de alerta de documentos
export function calcularEstadoAlertaDocumento(diasRestantes: number): keyof typeof ESTADOS_ALERTA {
    if (diasRestantes <= UMBRALES_ALERTA.DOCUMENTO_VENCIDO) return 'VENCIDO';
    if (diasRestantes <= UMBRALES_ALERTA.DOCUMENTO_URGENTE) return 'URGENTE';
    if (diasRestantes <= UMBRALES_ALERTA.DOCUMENTO_PROXIMO) return 'PROXIMO';
    return 'EN_REGLA';
}

// Helper para obtener clases de color por estado de alerta
export function getAlertaClasses(estado: string): { bg: string; text: string; border: string } {
    const estadoKey = estado.replace(' ', '_') as keyof typeof COLORES_ALERTA;
    return COLORES_ALERTA[estadoKey] || COLORES_ALERTA.EN_REGLA;
}
