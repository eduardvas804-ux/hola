// Datos maestros de equipos - Código, Tipo, Modelo y Serie vinculados
// Este archivo contiene la información base de todos los equipos del sistema
// La vinculación se realiza principalmente por el campo 'codigo'

export interface Equipo {
    codigo: string;
    tipo: string;
    modelo: string;
    serie: string;
    marca?: string;
    empresa?: string;
}

export const EQUIPOS_MAESTRO: Equipo[] = [
    // Cargadores
    { codigo: 'CARG-01', tipo: 'CARGADOR FRONTAL', modelo: '950H', serie: 'N1A01325' },
    { codigo: 'CARG-02', tipo: 'CARGADOR FRONTAL', modelo: '950H', serie: 'JLX00670' },
    { codigo: 'CARG-03', tipo: 'CARGADOR FRONTAL', modelo: '950H', serie: 'JLX00891' },
    { codigo: 'CARG-04', tipo: 'CARGADOR FRONTAL', modelo: '962L', serie: 'MTN00312' },

    // Cisternas
    { codigo: 'CIST-01', tipo: 'CISTERNA DE AGUA', modelo: 'FM', serie: 'ADI-737' },
    { codigo: 'CIST-02', tipo: 'CISTERNA DE AGUA', modelo: 'ACTROS 3336K', serie: 'T6B-849' },
    { codigo: 'CIST-03', tipo: 'CISTERNA DE AGUA', modelo: 'ACTROS 3341K', serie: 'T2Y-812' },
    { codigo: 'CIST-04', tipo: 'CISTERNA DE COMBUSTIBLE', modelo: 'CANTER', serie: 'A5Z-949' },

    // Excavadoras
    { codigo: 'EXC-01', tipo: 'EXCAVADORA', modelo: '320D', serie: 'FAL10955' },
    { codigo: 'EXC-02', tipo: 'EXCAVADORA', modelo: '320D', serie: 'A6FO2293' },
    { codigo: 'EXC-03', tipo: 'EXCAVADORA', modelo: '320D', serie: 'A6F02331' },
    { codigo: 'EXC-04', tipo: 'EXCAVADORA', modelo: '329DL', serie: 'DFP01380' },
    { codigo: 'EXC-05', tipo: 'EXCAVADORA', modelo: '320D2L', serie: 'PBB00191' },
    { codigo: 'EXC-06', tipo: 'EXCAVADORA', modelo: '336D2L', serie: 'ZCT00879' },
    { codigo: 'EXC-07', tipo: 'EXCAVADORA', modelo: '320D3', serie: 'ESX00129' },

    // Motoniveladoras
    { codigo: 'MOT-01', tipo: 'MOTONIVELADORA', modelo: '135H', serie: '8WN00983' },
    { codigo: 'MOT-02', tipo: 'MOTONIVELADORA', modelo: '140H', serie: 'CCAD3069' },
    { codigo: 'MOT-03', tipo: 'MOTONIVELADORA', modelo: '140K', serie: 'JPA01420' },
    { codigo: 'MOT-04', tipo: 'MOTONIVELADORA', modelo: '140K', serie: 'JPA01723' },
    { codigo: 'MOT-05', tipo: 'MOTONIVELADORA', modelo: '140M', serie: 'B9D03073' },

    // Rodillos
    { codigo: 'ROD-01', tipo: 'RODILLO LISO', modelo: 'CS-533E', serie: 'DZE02502' },
    { codigo: 'ROD-02', tipo: 'RODILLO LISO', modelo: 'CS-533E', serie: 'TUD2350' },
    { codigo: 'ROD-03', tipo: 'RODILLO LISO', modelo: 'CSS4B', serie: 'MFC00117' },

    // Retroexcavadora
    { codigo: 'RETRO-01', tipo: 'RETROEXCAVADORA', modelo: '420F', serie: 'LTG01081' },

    // Volquetes
    { codigo: 'VOLQ-01', tipo: 'VOLQUETE', modelo: 'FM 6X4R', serie: 'A8W-901' },
    { codigo: 'VOLQ-02', tipo: 'VOLQUETE', modelo: 'FMX 6X4R', serie: 'C9O-835' },
    { codigo: 'VOLQ-03', tipo: 'VOLQUETE', modelo: 'ACTROS 3343K', serie: 'C2D-877' },
    { codigo: 'VOLQ-04', tipo: 'VOLQUETE', modelo: 'FMX 6X4R', serie: 'D7T-763' },
    { codigo: 'VOLQ-05', tipo: 'VOLQUETE', modelo: 'FMX 6X4R', serie: 'ASS-888' },
    { codigo: 'VOLQ-06', tipo: 'VOLQUETE', modelo: 'FMX 6X4R', serie: 'T9J-863' },
    { codigo: 'VOLQ-07', tipo: 'VOLQUETE', modelo: 'ACTROS 3344K', serie: 'T9O-863' },
    { codigo: 'VOLQ-08', tipo: 'VOLQUETE', modelo: 'ACTROS 3344K', serie: 'T9T-860' },
    { codigo: 'VOLQ-09', tipo: 'VOLQUETE', modelo: 'ACTROS 3344K', serie: 'AVY-764' },

    // Otros
    { codigo: 'TRACT-01', tipo: 'TRACTOR SOBRE ORUGAS', modelo: 'D6TXL', serie: 'GCT00681' },
    { codigo: 'CAM-01', tipo: 'CAMA BAJA', modelo: 'ACTROS 2641', serie: 'F8I-776' },
    { codigo: 'PLATAFORMA', tipo: 'CAMION PLATAFORMA', modelo: 'FMX 6X4R', serie: 'E1T-813' },
];

// Función para obtener el formato CODIGO(SERIE)
export function getCodigoConSerie(codigo: string): string {
    const equipo = EQUIPOS_MAESTRO.find(e => e.codigo === codigo);
    if (equipo) {
        return `${equipo.codigo}(${equipo.serie})`;
    }
    return codigo;
}

// Función para obtener serie por código
export function getSeriePorCodigo(codigo: string): string {
    const equipo = EQUIPOS_MAESTRO.find(e => e.codigo === codigo);
    return equipo?.serie || '';
}

// Función para obtener tipo por código
export function getTipoPorCodigo(codigo: string): string {
    const equipo = EQUIPOS_MAESTRO.find(e => e.codigo === codigo);
    return equipo?.tipo || '';
}

// Función para obtener modelo por código
export function getModeloPorCodigo(codigo: string): string {
    const equipo = EQUIPOS_MAESTRO.find(e => e.codigo === codigo);
    return equipo?.modelo || '';
}

// Función para buscar equipos (por código, serie o modelo)
export function buscarEquipos(termino: string): Equipo[] {
    const term = termino.toLowerCase();
    return EQUIPOS_MAESTRO.filter(e =>
        e.codigo.toLowerCase().includes(term) ||
        e.serie.toLowerCase().includes(term) ||
        e.modelo.toLowerCase().includes(term)
    );
}

// Obtener todos los códigos ordenados
export function getCodigosOrdenados(): string[] {
    return EQUIPOS_MAESTRO.map(e => e.codigo).sort();
}

// Función para obtener código a partir de la serie
export function getCodigoPorSerie(serie: string): string {
    const equipo = EQUIPOS_MAESTRO.find(e => e.serie.toLowerCase() === serie.toLowerCase());
    return equipo?.codigo || '';
}

// Función para obtener equipo completo por serie
export function getEquipoPorSerie(serie: string): Equipo | undefined {
    return EQUIPOS_MAESTRO.find(e => e.serie.toLowerCase() === serie.toLowerCase());
}

// Función para mostrar formato CODIGO - MODELO (SERIE)
export function formatearEquipo(serie: string): string {
    const equipo = EQUIPOS_MAESTRO.find(e => e.serie.toLowerCase() === serie.toLowerCase());
    if (equipo) {
        return `${equipo.codigo} - ${equipo.modelo} (${equipo.serie})`;
    }
    return serie;
}

// Función para mostrar formato completo para dropdowns
export function formatearEquipoCompleto(equipo: Equipo): string {
    return `${equipo.codigo} - ${equipo.tipo} ${equipo.modelo} (${equipo.serie})`;
}

// Validar si un código existe en los equipos maestros
export function existeEnMaestro(codigo: string): boolean {
    return EQUIPOS_MAESTRO.some(e => e.codigo === codigo);
}

// Obtener lista de tipos únicos
export function getTiposUnicos(): string[] {
    return [...new Set(EQUIPOS_MAESTRO.map(e => e.tipo))].sort();
}

// Obtener equipos por tipo
export function getEquiposPorTipo(tipo: string): Equipo[] {
    return EQUIPOS_MAESTRO.filter(e => e.tipo === tipo);
}

// Buscar equipo por cualquier campo (código, serie, modelo)
export function buscarEquipoPorIdentificador(identificador: string): Equipo | undefined {
    const term = identificador.toLowerCase();
    return EQUIPOS_MAESTRO.find(e =>
        e.codigo.toLowerCase() === term ||
        e.serie.toLowerCase() === term
    );
}

// Normalizar código (convertir a mayúsculas y eliminar espacios)
export function normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase();
}

// Obtener información para vincular con otras tablas
export function getInfoVinculacion(codigo: string): {
    codigo: string;
    serie: string;
    tipo: string;
    modelo: string;
} | null {
    const equipo = EQUIPOS_MAESTRO.find(e => e.codigo === codigo);
    if (!equipo) return null;
    return {
        codigo: equipo.codigo,
        serie: equipo.serie,
        tipo: equipo.tipo,
        modelo: equipo.modelo
    };
}
