import { z } from 'zod';

// Tipos de maquinaria como array para reutilizar
const TIPOS_MAQUINARIA = [
    'EXCAVADORA',
    'RETROEXCAVADORA',
    'CARGADOR FRONTAL',
    'TRACTOR ORUGA',
    'MOTONIVELADORA',
    'RODILLO',
    'VOLQUETE',
    'CAMION',
    'CISTERNA DE AGUA',
    'CISTERNA DE COMBUSTIBLE',
    'CAMIONETA'
] as const;

const ESTADOS_MAQUINARIA = ['OPERATIVO', 'EN MANTENIMIENTO', 'INOPERATIVO', 'ALQUILADO'] as const;

const TIPOS_MANTENIMIENTO = [
    'PREVENTIVO 250H',
    'PREVENTIVO 500H',
    'PREVENTIVO 1000H',
    'PREVENTIVO 2000H',
    'PREVENTIVO 4000H',
    'CORRECTIVO'
] as const;

const ESTADOS_ALERTA = ['URGENTE', 'PROXIMO', 'EN REGLA', 'VENCIDO'] as const;

const ROLES_USUARIO = ['admin', 'supervisor', 'operador', 'visualizador'] as const;

// Schema para Maquinaria - coincide con el tipo Maquinaria en types.ts
export const MaquinariaSchema = z.object({
    item: z.number().min(1, 'El número de item es requerido'),
    serie: z.string().min(1, 'La serie es requerida'),
    codigo: z.string().min(1, 'El código es requerido'),
    tipo: z.enum(TIPOS_MAQUINARIA, { message: 'Seleccione un tipo válido' }),
    marca: z.string().min(1, 'La marca es requerida'),
    modelo: z.string().min(1, 'El modelo es requerido'),
    año: z.number().min(1980, 'El año debe ser mayor a 1980').max(new Date().getFullYear() + 1, 'Año inválido'),
    estado: z.enum(ESTADOS_MAQUINARIA, { message: 'Seleccione un estado válido' }),
    operador: z.string().optional(),
    empresa: z.string().optional(),
    tramo: z.string().optional(),
    horas_actuales: z.number().min(0, 'Las horas no pueden ser negativas').optional(),
    alerta_mtto: z.boolean().optional(),
});

// Schema para crear Maquinaria (sin ID)
export const CreateMaquinariaSchema = MaquinariaSchema;

// Schema para actualizar Maquinaria (todos los campos opcionales)
export const UpdateMaquinariaSchema = MaquinariaSchema.partial();

// Schema para Mantenimiento - coincide con el tipo Mantenimiento en types.ts
export const MantenimientoSchema = z.object({
    codigo_maquina: z.string().min(1, 'El código de máquina es requerido'),
    mantenimiento_ultimo: z.number().min(0, 'Las horas no pueden ser negativas'),
    mantenimiento_proximo: z.number().min(0, 'Las horas no pueden ser negativas'),
    hora_actual: z.number().min(0, 'Las horas no pueden ser negativas'),
    diferencia_horas: z.number(),
    operador: z.string().optional(),
    tramo: z.string().optional(),
    fecha_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
    tipo_mantenimiento: z.enum(TIPOS_MANTENIMIENTO),
    estado_alerta: z.enum(ESTADOS_ALERTA),
});

// Schema para SOAT - coincide con el tipo SOAT en types.ts
export const SOATSchema = z.object({
    codigo: z.string().min(1, 'El código es requerido'),
    tipo: z.string().min(1, 'El tipo es requerido'),
    modelo: z.string().min(1, 'El modelo es requerido'),
    placa_serie: z.string().min(1, 'La placa/serie es requerida'),
    empresa: z.string().min(1, 'La empresa es requerida'),
    fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    dias_restantes: z.number(),
    accion_requerida: z.string().optional(),
});

// Schema para CITV - coincide con el tipo CITV en types.ts
export const CITVSchema = z.object({
    codigo: z.string().min(1, 'El código es requerido'),
    tipo: z.string().min(1, 'El tipo es requerido'),
    modelo: z.string().min(1, 'El modelo es requerido'),
    placa_serie: z.string().min(1, 'La placa/serie es requerida'),
    empresa: z.string().min(1, 'La empresa es requerida'),
    fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    dias_restantes: z.number(),
    accion_requerida: z.string().optional(),
});

// Schema para Usuario
export const UserProfileSchema = z.object({
    email: z.string().email('Email inválido'),
    nombre_completo: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    rol: z.enum(ROLES_USUARIO),
    activo: z.boolean().optional(),
});

// Schema para crear Usuario (incluye password)
export const CreateUserSchema = UserProfileSchema.extend({
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
});

// Schema para Login
export const LoginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

// Schema para actualizar horas
export const UpdateHoursSchema = z.object({
    horas_actuales: z.number().min(0, 'Las horas no pueden ser negativas'),
});

// Schema para registro de mantenimiento completado
export const CompletedMaintenanceSchema = z.object({
    horas_mantenimiento: z.number().min(0, 'Las horas no pueden ser negativas'),
    proximo_mantenimiento: z.number().min(0, 'Las horas no pueden ser negativas'),
    descripcion: z.string().optional(),
});

// Types inferidos de los schemas
export type MaquinariaInput = z.infer<typeof MaquinariaSchema>;
export type CreateMaquinariaInput = z.infer<typeof CreateMaquinariaSchema>;
export type UpdateMaquinariaInput = z.infer<typeof UpdateMaquinariaSchema>;
export type MantenimientoInput = z.infer<typeof MantenimientoSchema>;
export type SOATInput = z.infer<typeof SOATSchema>;
export type CITVInput = z.infer<typeof CITVSchema>;
export type UserProfileInput = z.infer<typeof UserProfileSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateHoursInput = z.infer<typeof UpdateHoursSchema>;
export type CompletedMaintenanceInput = z.infer<typeof CompletedMaintenanceSchema>;

// Helper function para validar y obtener errores
export function validateWithErrors<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Record<string, string>;
} {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
            errors[path] = err.message;
        }
    });

    return { success: false, errors };
}

// Helper para crear errores de formulario
export function getFieldError(errors: Record<string, string> | undefined, field: string): string | undefined {
    return errors?.[field];
}
