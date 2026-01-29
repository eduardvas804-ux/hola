// Sistema de permisos por rol y sección

import { Role } from './types';

export type Seccion =
    | 'dashboard'
    | 'maquinaria'
    | 'mantenimientos'
    | 'soat'
    | 'citv'
    | 'filtros'
    | 'alertas'
    | 'importar'
    | 'combustible'
    | 'valorizaciones'
    | 'reportes'
    | 'historial'
    | 'usuarios';

export type Permiso = 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar';

// Matriz de permisos por rol
const PERMISOS: Record<Role, Record<Seccion, Permiso[]>> = {
    admin: {
        dashboard: ['ver'],
        maquinaria: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
        mantenimientos: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
        soat: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
        citv: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
        filtros: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
        alertas: ['ver', 'crear'],
        importar: ['ver', 'crear'],
        combustible: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
        valorizaciones: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
        reportes: ['ver', 'exportar'],
        historial: ['ver'],
        usuarios: ['ver', 'crear', 'editar', 'eliminar'],
    },
    supervisor: {
        dashboard: ['ver'],
        maquinaria: ['ver', 'editar', 'exportar'],
        mantenimientos: ['ver', 'crear', 'editar', 'exportar'],
        soat: ['ver', 'editar', 'exportar'],
        citv: ['ver', 'editar', 'exportar'],
        filtros: ['ver', 'exportar'],
        alertas: ['ver'],
        importar: ['ver', 'crear'],
        combustible: ['ver', 'crear', 'editar', 'exportar'],
        valorizaciones: ['ver', 'crear', 'exportar'],
        reportes: ['ver', 'exportar'],
        historial: ['ver'],
        usuarios: [],
    },
    operador: {
        dashboard: ['ver'],
        maquinaria: ['ver'],
        mantenimientos: ['ver', 'editar'],
        soat: ['ver'],
        citv: ['ver'],
        filtros: ['ver'],
        alertas: [],
        importar: [],
        combustible: ['ver', 'crear'],
        valorizaciones: [],
        reportes: [],
        historial: [],
        usuarios: [],
    },
    visualizador: {
        dashboard: ['ver'],
        maquinaria: ['ver'],
        mantenimientos: ['ver'],
        soat: ['ver'],
        citv: ['ver'],
        filtros: ['ver'],
        alertas: [],
        importar: [],
        combustible: ['ver'],
        valorizaciones: ['ver'],
        reportes: ['ver'],
        historial: [],
        usuarios: [],
    },
};

// Verificar si un rol tiene permiso en una sección
export function tienePermiso(rol: Role | undefined, seccion: Seccion, permiso: Permiso): boolean {
    if (!rol) return false;
    const permisosRol = PERMISOS[rol];
    if (!permisosRol) return false;
    const permisosSeccion = permisosRol[seccion];
    if (!permisosSeccion) return false;
    return permisosSeccion.includes(permiso);
}

// Verificar si un rol puede ver una sección
export function puedeVer(rol: Role | undefined, seccion: Seccion): boolean {
    return tienePermiso(rol, seccion, 'ver');
}

// Verificar si un rol puede editar en una sección
export function puedeEditar(rol: Role | undefined, seccion: Seccion): boolean {
    return tienePermiso(rol, seccion, 'editar');
}

// Verificar si un rol puede crear en una sección
export function puedeCrear(rol: Role | undefined, seccion: Seccion): boolean {
    return tienePermiso(rol, seccion, 'crear');
}

// Verificar si un rol puede eliminar en una sección
export function puedeEliminar(rol: Role | undefined, seccion: Seccion): boolean {
    return tienePermiso(rol, seccion, 'eliminar');
}

// Obtener todas las secciones permitidas para un rol
export function getSeccionesPermitidas(rol: Role | undefined): Seccion[] {
    if (!rol) return [];
    const permisosRol = PERMISOS[rol];
    return Object.entries(permisosRol)
        .filter(([_, permisos]) => permisos.includes('ver'))
        .map(([seccion]) => seccion as Seccion);
}

// Descripciones de secciones
export const SECCIONES_INFO: Record<Seccion, { label: string; path: string }> = {
    dashboard: { label: 'Dashboard', path: '/' },
    maquinaria: { label: 'Maquinaria', path: '/maquinaria' },
    mantenimientos: { label: 'Mantenimientos', path: '/mantenimientos' },
    soat: { label: 'Control SOAT', path: '/soat' },
    citv: { label: 'Revisiones CITV', path: '/citv' },
    filtros: { label: 'Filtros', path: '/filtros' },
    alertas: { label: 'Alertas Email', path: '/alertas' },
    importar: { label: 'Importar Datos', path: '/importar' },
    combustible: { label: 'Combustible', path: '/combustible' },
    valorizaciones: { label: 'Valorizaciones', path: '/valorizaciones' },
    reportes: { label: 'Reportes', path: '/reportes' },
    historial: { label: 'Historial', path: '/historial' },
    usuarios: { label: 'Usuarios', path: '/admin/usuarios' },
};
