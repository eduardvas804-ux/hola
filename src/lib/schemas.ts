import { z } from 'zod';

// Schema para Maquinaria
export const MaquinariaSchema = z.object({
    item: z.number().min(1, 'El número de item es requerido'),
    serie: z.string().min(1, 'La serie es requerida'),
    codigo_equipo: z.string().min(1, 'El código de equipo es requerido'),
    tipo: z.enum(['excavadora', 'retroexcavadora', 'cargador_frontal', 'tractor_oruga', 'rodillo', 'volquete', 'camion', 'cisterna', 'minivan', 'camioneta', 'automovil', 'moto'], {
        errorMap: () => ({ message: 'Seleccione un tipo válido' }),
    }),
    marca: z.string().min(1, 'La marca es requerida'),
    modelo: z.string().min(1, 'El modelo es requerido'),
    ano: z.number().min(1980, 'El año debe ser mayor a 1980').max(new Date().getFullYear() + 1, 'Año inválido'),
    estado: z.enum(['operativo', 'mantenimiento', 'inoperativo', 'alquilado'], {
        errorMap: () => ({ message: 'Seleccione un estado válido' }),
    }),
    operador: z.string().optional().nullable(),
    ubicacion: z.string().optional().nullable(),
    hours_actuales: z.number().min(0, 'Las horas no pueden ser negativas').optional().nullable(),
    proximo_mantenimiento: z.number().min(0, 'Las horas de próximo mantenimiento no pueden ser negativas').optional().nullable(),
    placa: z.string().optional().nullable(),
    observaciones: z.string().optional().nullable(),
});

// Schema para crear Maquinaria (sin ID)
export const CreateMaquinariaSchema = MaquinariaSchema;

// Schema para actualizar Maquinaria (todos los campos opcionales excepto ID)
export const UpdateMaquinariaSchema = MaquinariaSchema.partial();

// Schema para Mantenimiento
export const MantenimientoSchema = z.object({
    maquinaria_id: z.string().uuid('ID de maquinaria inválido'),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    tipo: z.enum(['preventivo', 'correctivo', 'predictivo', 'emergencia']),
    descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
    horas_realizadas: z.number().min(0, 'Las horas no pueden ser negativas'),
    costo: z.number().min(0, 'El costo no puede ser negativo').optional().nullable(),
    tecnico: z.string().min(1, 'El técnico es requerido').optional().nullable(),
    repuestos: z.string().optional().nullable(),
    observaciones: z.string().optional().nullable(),
});

// Schema para SOAT
export const SOATSchema = z.object({
    codigo_equipo: z.string().min(1, 'El código de equipo es requerido'),
    numero_poliza: z.string().min(1, 'El número de póliza es requerido'),
    aseguradora: z.string().min(1, 'La aseguradora es requerida'),
    fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    costo: z.number().min(0, 'El costo no puede ser negativo').optional().nullable(),
    observaciones: z.string().optional().nullable(),
}).refine((data) => new Date(data.fecha_vencimiento) > new Date(data.fecha_inicio), {
    message: 'La fecha de vencimiento debe ser posterior a la fecha de inicio',
    path: ['fecha_vencimiento'],
});

// Schema para CITV
export const CITVSchema = z.object({
    codigo_equipo: z.string().min(1, 'El código de equipo es requerido'),
    numero_certificado: z.string().min(1, 'El número de certificado es requerido'),
    entidad: z.string().min(1, 'La entidad certificadora es requerida'),
    fecha_inspeccion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    resultado: z.enum(['aprobado', 'observado', 'desaprobado']),
    observaciones: z.string().optional().nullable(),
}).refine((data) => new Date(data.fecha_vencimiento) > new Date(data.fecha_inspeccion), {
    message: 'La fecha de vencimiento debe ser posterior a la fecha de inspección',
    path: ['fecha_vencimiento'],
});

// Schema para Usuario
export const UserProfileSchema = z.object({
    email: z.string().email('Email inválido'),
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    rol: z.enum(['admin', 'supervisor', 'operador', 'visualizador']),
    estado: z.enum(['activo', 'inactivo']).optional(),
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
    hours_actuales: z.number().min(0, 'Las horas no pueden ser negativas'),
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
