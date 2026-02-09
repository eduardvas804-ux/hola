-- =============================================
-- ACTUALIZACIÓN DE SCHEMA V2 (MEJORADO)
-- Propósito: Agregar campos de licencia, inventario de combustible y verificar tabla
-- =============================================

-- 1. Actualizar tabla PERFILES
-- Agregar campos para control de conductores
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS licencia TEXT,
ADD COLUMN IF NOT EXISTS categoria_licencia TEXT,
ADD COLUMN IF NOT EXISTS vencimiento_licencia DATE,
ADD COLUMN IF NOT EXISTS maquina_asignada TEXT;

-- 2. Verificar tabla COMBUSTIBLE (Creación si no existe)
-- Se agregan campos para control de Cisterna vs Grifo
CREATE TABLE IF NOT EXISTS public.combustible (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Tipo de operación: 
    -- 'ABASTECIMIENTO_CISTERNA' (Llenar la cisterna)
    -- 'CONSUMO_MAQUINARIA' (Máquina gasta)
    tipo_registro TEXT NOT NULL DEFAULT 'CONSUMO_MAQUINARIA' CHECK (tipo_registro IN ('ABASTECIMIENTO_CISTERNA', 'CONSUMO_MAQUINARIA')),
    
    -- Origen del combustible (Solo para Consumo):
    -- 'CISTERNA' (Sale de nuestra cisterna)
    -- 'GRIFO' (Sale de grifo externo)
    -- NULL (Para abast. de cisterna)
    origen TEXT CHECK (origen IN ('CISTERNA', 'GRIFO')),
    
    codigo_maquina TEXT, -- NULL si es abastecimiento de cisterna
    tipo_maquina TEXT,
    
    horometro NUMERIC,
    galones NUMERIC NOT NULL DEFAULT 0,
    precio_galon NUMERIC,
    total NUMERIC,
    proveedor TEXT,
    numero_factura TEXT,
    operador TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la tabla ya existe, intentamos agregar las columnas nuevas
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.combustible ADD COLUMN tipo_registro TEXT DEFAULT 'CONSUMO_MAQUINARIA';
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.combustible ADD COLUMN origen TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;


-- Políticas RLS para combustible (si se acaba de crear)
ALTER TABLE public.combustible ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combustible' AND policyname = 'Todos pueden ver combustible') THEN
        CREATE POLICY "Todos pueden ver combustible" ON public.combustible FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combustible' AND policyname = 'Usuarios autenticados pueden insertar') THEN
        CREATE POLICY "Usuarios autenticados pueden insertar" ON public.combustible FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combustible' AND policyname = 'Usuarios autenticados pueden actualizar') THEN
        CREATE POLICY "Usuarios autenticados pueden actualizar" ON public.combustible FOR UPDATE USING (auth.uid() IS NOT NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combustible' AND policyname = 'Admins pueden eliminar') THEN
        CREATE POLICY "Admins pueden eliminar" ON public.combustible FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
        );
    END IF;
END $$;
