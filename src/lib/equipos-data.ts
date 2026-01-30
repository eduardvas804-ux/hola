// Datos maestros de equipos - Código y Serie vinculados
export interface Equipo {
    codigo: string;
    serie: string;
    tipo: string;
}

export const EQUIPOS_MAESTRO: Equipo[] = [
    // Cargadores
    { codigo: 'CARG-01', serie: 'N1A01325', tipo: 'CARGADOR FRONTAL' },
    { codigo: 'CARG-02', serie: 'JLX00670', tipo: 'CARGADOR FRONTAL' },
    { codigo: 'CARG-03', serie: 'JLX00891', tipo: 'CARGADOR FRONTAL' },
    { codigo: 'CARG-04', serie: 'MTN00312', tipo: 'CARGADOR FRONTAL' },

    // Cisternas
    { codigo: 'CIST-01', serie: 'ADI-737', tipo: 'CISTERNA DE AGUA' },
    { codigo: 'CIST-02', serie: 'T6B-849', tipo: 'CISTERNA DE AGUA' },
    { codigo: 'CIST-03', serie: 'T2Y-812', tipo: 'CISTERNA DE AGUA' },
    { codigo: 'CIST-04', serie: 'A5Z-949', tipo: 'CISTERNA DE COMBUSTIBLE' },

    // Excavadoras
    { codigo: 'EXC-01', serie: 'FAL10955', tipo: 'EXCAVADORA' },
    { codigo: 'EXC-02', serie: 'A6FO2293', tipo: 'EXCAVADORA' },
    { codigo: 'EXC-03', serie: 'A6F02331', tipo: 'EXCAVADORA' },
    { codigo: 'EXC-04', serie: 'DFP01380', tipo: 'EXCAVADORA' },
    { codigo: 'EXC-05', serie: 'PBB00191', tipo: 'EXCAVADORA' },
    { codigo: 'EXC-06', serie: 'ZCT00879', tipo: 'EXCAVADORA' },
    { codigo: 'EXC-07', serie: 'ESX00129', tipo: 'EXCAVADORA' },

    // Motoniveladoras
    { codigo: 'MOT-01', serie: '8WN00983', tipo: 'MOTONIVELADORA' },
    { codigo: 'MOT-02', serie: 'CCAD3069', tipo: 'MOTONIVELADORA' },
    { codigo: 'MOT-03', serie: 'JPA01420', tipo: 'MOTONIVELADORA' },
    { codigo: 'MOT-04', serie: 'JPA01723', tipo: 'MOTONIVELADORA' },
    { codigo: 'MOT-05', serie: 'B9D03073', tipo: 'MOTONIVELADORA' },

    // Rodillos
    { codigo: 'ROD-01', serie: 'DZE02502', tipo: 'RODILLO LISO' },
    { codigo: 'ROD-02', serie: 'TUD2350', tipo: 'RODILLO LISO' },
    { codigo: 'ROD-03', serie: 'MFC00117', tipo: 'RODILLO LISO' },

    // Retroexcavadora
    { codigo: 'RETRO-01', serie: 'LTG01081', tipo: 'RETROEXCAVADORA' },

    // Volquetes
    { codigo: 'VOLQ-01', serie: 'A8W-901', tipo: 'VOLQUETE' },
    { codigo: 'VOLQ-02', serie: 'C9O-835', tipo: 'VOLQUETE' },
    { codigo: 'VOLQ-03', serie: 'C2D-877', tipo: 'VOLQUETE' },
    { codigo: 'VOLQ-04', serie: 'D7T-763', tipo: 'VOLQUETE' },
    { codigo: 'VOLQ-05', serie: 'ASS-888', tipo: 'VOLQUETE' },
    { codigo: 'VOLQ-06', serie: 'T9J-863', tipo: 'VOLQUETE' },
    { codigo: 'VOLQ-07', serie: 'T9O-863', tipo: 'VOLQUETE' },
    { codigo: 'VOLQ-08', serie: 'T9T-860', tipo: 'VOLQUETE' },
    { codigo: 'VOLQ-09', serie: 'AVY-764', tipo: 'VOLQUETE' },

    // Otros
    { codigo: 'TRACT-01', serie: 'GCT00681', tipo: 'TRACTOR' },
    { codigo: 'CAM-01', serie: 'F8I-776', tipo: 'CAMIONETA' },
    { codigo: 'PLATAFORMA', serie: 'E1T-813', tipo: 'PLATAFORMA' },
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

// Función para buscar equipos (por código o serie)
export function buscarEquipos(termino: string): Equipo[] {
    const term = termino.toLowerCase();
    return EQUIPOS_MAESTRO.filter(e =>
        e.codigo.toLowerCase().includes(term) ||
        e.serie.toLowerCase().includes(term)
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

// Función para mostrar formato CODIGO (SERIE)
export function formatearEquipo(serie: string): string {
    const equipo = EQUIPOS_MAESTRO.find(e => e.serie.toLowerCase() === serie.toLowerCase());
    if (equipo) {
        return `${equipo.codigo} (${equipo.serie})`;
    }
    return serie;
}
