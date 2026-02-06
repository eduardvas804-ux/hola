-- =============================================
-- MIGRACIÓN DE COMBUSTIBLE V3
-- =============================================
-- Propósito: Actualizar tabla combustible para el nuevo modelo del frontend
-- 
-- CAMPOS REQUERIDOS POR EL FRONTEND (types.ts - RegistroCombustible):
--   id: string
--   fecha: string
--   tipo_movimiento: 'ENTRADA' | 'SALIDA'
--   fuente_combustible: 'CISTERNA' | 'GRIFO'  <-- NUEVO
--   codigo_maquina: string
--   tipo_maquina?: string
--   horometro?: number
--   galones: number
--   precio_galon?: number
--   total?: number
--   proveedor?: string
--   nombre_grifo?: string   <-- NUEVO
--   numero_factura?: string
--   operador?: string
--   observaciones?: string
--   created_at?: string
--
-- Ejecutar este script en Supabase SQL Editor
-- =============================================

-- ===========================================
-- PASO 1: Verificar si la tabla existe
-- ===========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'combustible') THEN
        RAISE EXCEPTION 'La tabla combustible no existe. Por favor, ejecuta primero supabase_tables.sql';
    END IF;
END $$;

-- ===========================================
-- PASO 2: Agregar columna fuente_combustible
-- ===========================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'combustible' 
        AND column_name = 'fuente_combustible'
    ) THEN
        -- Agregar columna sin constraint primero
        ALTER TABLE public.combustible 
        ADD COLUMN fuente_combustible TEXT DEFAULT 'CISTERNA';
        
        -- Actualizar valores existentes
        UPDATE public.combustible SET fuente_combustible = 'CISTERNA' WHERE fuente_combustible IS NULL;
        
        -- Agregar constraint NOT NULL y CHECK
        ALTER TABLE public.combustible 
        ALTER COLUMN fuente_combustible SET NOT NULL;
        
        ALTER TABLE public.combustible 
        ADD CONSTRAINT combustible_fuente_check 
        CHECK (fuente_combustible IN ('CISTERNA', 'GRIFO'));
        
        RAISE NOTICE '✅ Columna fuente_combustible agregada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ Columna fuente_combustible ya existe';
    END IF;
END $$;

-- ===========================================
-- PASO 3: Agregar columna nombre_grifo
-- ===========================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'combustible' 
        AND column_name = 'nombre_grifo'
    ) THEN
        ALTER TABLE public.combustible ADD COLUMN nombre_grifo TEXT;
        RAISE NOTICE '✅ Columna nombre_grifo agregada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ Columna nombre_grifo ya existe';
    END IF;
END $$;

-- ===========================================
-- PASO 4: Migrar datos de 'origen' si existe
-- (En caso de que se haya usado update_schema_v2.sql)
-- ===========================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'combustible' 
        AND column_name = 'origen'
    ) THEN
        -- Copiar valores de 'origen' a 'fuente_combustible'
        UPDATE public.combustible 
        SET fuente_combustible = CASE 
            WHEN origen = 'GRIFO' THEN 'GRIFO'
            ELSE 'CISTERNA'
        END
        WHERE origen IS NOT NULL;
        
        RAISE NOTICE '✅ Datos migrados desde columna origen';
    END IF;
END $$;

-- ===========================================
-- PASO 5: Crear índice para rendimiento
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_combustible_fuente 
ON public.combustible(fuente_combustible);

RAISE NOTICE '✅ Índice idx_combustible_fuente creado';

-- ===========================================
-- PASO 6: Verificar estructura final
-- ===========================================
SELECT 
    column_name as "Columna",
    data_type as "Tipo",
    column_default as "Default",
    is_nullable as "Nullable"
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'combustible'
ORDER BY ordinal_position;

-- ===========================================
-- RESULTADO ESPERADO DE LA TABLA:
-- ===========================================
-- id                  | uuid      | gen_random_uuid()
-- fecha               | date      | CURRENT_DATE
-- tipo_movimiento     | text      | -
-- fuente_combustible  | text      | 'CISTERNA'     <-- NUEVO
-- codigo_maquina      | text      | -
-- tipo_maquina        | text      | -
-- horometro           | numeric   | -
-- galones             | numeric   | 0
-- precio_galon        | numeric   | -
-- total               | numeric   | -
-- proveedor           | text      | -
-- nombre_grifo        | text      | -              <-- NUEVO
-- numero_factura      | text      | -
-- operador            | text      | -
-- observaciones       | text      | -
-- created_at          | timestamp | NOW()
-- updated_at          | timestamp | NOW()
-- ===========================================

-- =============================================
-- ¡MIGRACIÓN COMPLETADA!
-- =============================================
-- Verifica que las columnas fuente_combustible y nombre_grifo 
-- aparecen en el resultado de la consulta anterior.
-- =============================================
