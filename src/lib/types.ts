// Tipos de datos para MAQUINARIA PRO

export type TipoMaquinaria = 
  | 'MOTONIVELADORA'
  | 'EXCAVADORA'
  | 'RETROEXCAVADORA'
  | 'CARGADOR FRONTAL'
  | 'RODILLO LISO'
  | 'VOLQUETE'
  | 'CISTERNA DE AGUA'
  | 'CISTERNA DE COMBUSTIBLE'
  | 'CAMIONETA';

export type EstadoMaquinaria = 
  | 'OPERATIVO'
  | 'EN MANTENIMIENTO'
  | 'INOPERATIVO'
  | 'ALQUILADO';

export type EstadoAlerta = 'URGENTE' | 'PROXIMO' | 'EN REGLA' | 'VENCIDO';

export type TipoMantenimiento = 
  | 'PREVENTIVO 250H'
  | 'PREVENTIVO 500H'
  | 'PREVENTIVO 1000H'
  | 'CORRECTIVO';

export interface Maquinaria {
  id: string;
  item: number;
  serie: string;
  tipo: TipoMaquinaria;
  modelo: string;
  marca: string;
  año: number;
  codigo: string;
  empresa: string;
  operador: string;
  tramo: string;
  estado: EstadoMaquinaria;
  horas_actuales: number;
  alerta_mtto: boolean;
  updated_at: string;
}

export interface Mantenimiento {
  id: string;
  codigo_maquina: string;
  mantenimiento_ultimo: number;
  mantenimiento_proximo: number;
  hora_actual: number;
  diferencia_horas: number;
  operador: string;
  tramo: string;
  fecha_programada: string;
  tipo_mantenimiento: TipoMantenimiento;
  estado_alerta: EstadoAlerta;
}

export interface SOAT {
  id: string;
  codigo: string;
  tipo: string;
  modelo: string;
  placa_serie: string;
  empresa: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  accion_requerida: string;
}

export interface CITV {
  id: string;
  codigo: string;
  tipo: string;
  modelo: string;
  placa_serie: string;
  empresa: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  accion_requerida: string;
}

export interface Filtro {
  id: string;
  maquinaria_codigo: string;
  maquinaria_descripcion: string;
  filtro_separador_1: string;
  cantidad_sep_1: number;
  filtro_separador_2: string;
  cantidad_sep_2: number;
  filtro_combustible_1: string;
  cantidad_comb_1: number;
  filtro_combustible_2: string;
  cantidad_comb_2: number;
  filtro_aceite_motor: string;
  cantidad_aceite: number;
  filtro_aire_primario: string;
  cantidad_aire_prim: number;
  filtro_aire_secundario: string;
  cantidad_aire_sec: number;
}

// Iconos por tipo de maquinaria
export const ICONOS_MAQUINARIA: Record<TipoMaquinaria, string> = {
  'CARGADOR FRONTAL': '🚜',
  'EXCAVADORA': '🔧',
  'MOTONIVELADORA': '🚧',
  'RETROEXCAVADORA': '⚙️',
  'RODILLO LISO': '🛞',
  'VOLQUETE': '🚛',
  'CISTERNA DE AGUA': '💧',
  'CISTERNA DE COMBUSTIBLE': '⛽',
  'CAMIONETA': '🚗',
};

// Colores por estado
export const COLORES_ESTADO: Record<EstadoMaquinaria, string> = {
  'OPERATIVO': '#22c55e',
  'EN MANTENIMIENTO': '#f59e0b',
  'INOPERATIVO': '#ef4444',
  'ALQUILADO': '#3b82f6',
};

// Empresas del grupo
export const EMPRESAS = [
  'JLMX VASQUEZ EJECUTORES E.I.R.L',
  'JOMEX CONSTRUCTORA S.A.C',
  'JORGE LUIS VASQUEZ CUSMA',
];
