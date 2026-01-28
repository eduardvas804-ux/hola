-- =====================================================
-- MAQUINARIA PRO - Script de Creación de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. TABLA MAQUINARIA (Principal)
-- =====================================================
CREATE TABLE IF NOT EXISTS maquinaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item INTEGER,
    serie TEXT NOT NULL,
    tipo TEXT NOT NULL,
    modelo TEXT NOT NULL,
    marca TEXT NOT NULL,
    año INTEGER,
    codigo TEXT UNIQUE NOT NULL,
    empresa TEXT NOT NULL,
    operador TEXT,
    tramo TEXT,
    estado TEXT DEFAULT 'OPERATIVO',
    horas_actuales DECIMAL(10,2) DEFAULT 0,
    alerta_mtto BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA MANTENIMIENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS mantenimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_maquina TEXT NOT NULL REFERENCES maquinaria(codigo) ON DELETE CASCADE,
    tipo TEXT,
    modelo TEXT,
    mantenimiento_ultimo DECIMAL(10,2),
    mantenimiento_proximo DECIMAL(10,2),
    hora_actual DECIMAL(10,2),
    diferencia_horas DECIMAL(10,2),
    operador TEXT,
    tramo TEXT,
    fecha_programada DATE,
    tipo_mantenimiento TEXT DEFAULT 'PREVENTIVO 250H',
    estado_alerta TEXT DEFAULT 'EN REGLA',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA SOAT
-- =====================================================
CREATE TABLE IF NOT EXISTS soat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL,
    tipo TEXT,
    modelo TEXT,
    placa_serie TEXT,
    empresa TEXT,
    fecha_vencimiento DATE NOT NULL,
    dias_restantes INTEGER,
    accion_requerida TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA CITV (Revisiones Técnicas)
-- =====================================================
CREATE TABLE IF NOT EXISTS citv (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL,
    tipo TEXT,
    modelo TEXT,
    placa_serie TEXT,
    empresa TEXT,
    fecha_vencimiento DATE NOT NULL,
    dias_restantes INTEGER,
    accion_requerida TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA FILTROS
-- =====================================================
CREATE TABLE IF NOT EXISTS filtros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maquinaria_codigo TEXT NOT NULL,
    maquinaria_descripcion TEXT,
    filtro_separador_1 TEXT,
    cantidad_sep_1 INTEGER DEFAULT 1,
    filtro_separador_2 TEXT,
    cantidad_sep_2 INTEGER DEFAULT 0,
    filtro_combustible_1 TEXT,
    cantidad_comb_1 INTEGER DEFAULT 1,
    filtro_combustible_2 TEXT,
    cantidad_comb_2 INTEGER DEFAULT 0,
    filtro_aceite_motor TEXT,
    cantidad_aceite INTEGER DEFAULT 1,
    filtro_aire_primario TEXT,
    cantidad_aire_prim INTEGER DEFAULT 1,
    filtro_aire_secundario TEXT,
    cantidad_aire_sec INTEGER DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE maquinaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE soat ENABLE ROW LEVEL SECURITY;
ALTER TABLE citv ENABLE ROW LEVEL SECURITY;
ALTER TABLE filtros ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE ACCESO PÚBLICO (Para desarrollo)
-- =====================================================

-- Maquinaria
CREATE POLICY "maquinaria_select" ON maquinaria FOR SELECT USING (true);
CREATE POLICY "maquinaria_insert" ON maquinaria FOR INSERT WITH CHECK (true);
CREATE POLICY "maquinaria_update" ON maquinaria FOR UPDATE USING (true);
CREATE POLICY "maquinaria_delete" ON maquinaria FOR DELETE USING (true);

-- Mantenimientos
CREATE POLICY "mantenimientos_select" ON mantenimientos FOR SELECT USING (true);
CREATE POLICY "mantenimientos_insert" ON mantenimientos FOR INSERT WITH CHECK (true);
CREATE POLICY "mantenimientos_update" ON mantenimientos FOR UPDATE USING (true);
CREATE POLICY "mantenimientos_delete" ON mantenimientos FOR DELETE USING (true);

-- SOAT
CREATE POLICY "soat_select" ON soat FOR SELECT USING (true);
CREATE POLICY "soat_insert" ON soat FOR INSERT WITH CHECK (true);
CREATE POLICY "soat_update" ON soat FOR UPDATE USING (true);
CREATE POLICY "soat_delete" ON soat FOR DELETE USING (true);

-- CITV
CREATE POLICY "citv_select" ON citv FOR SELECT USING (true);
CREATE POLICY "citv_insert" ON citv FOR INSERT WITH CHECK (true);
CREATE POLICY "citv_update" ON citv FOR UPDATE USING (true);
CREATE POLICY "citv_delete" ON citv FOR DELETE USING (true);

-- Filtros
CREATE POLICY "filtros_select" ON filtros FOR SELECT USING (true);
CREATE POLICY "filtros_insert" ON filtros FOR INSERT WITH CHECK (true);
CREATE POLICY "filtros_update" ON filtros FOR UPDATE USING (true);
CREATE POLICY "filtros_delete" ON filtros FOR DELETE USING (true);

-- =====================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_maquinaria_codigo ON maquinaria(codigo);
CREATE INDEX IF NOT EXISTS idx_maquinaria_estado ON maquinaria(estado);
CREATE INDEX IF NOT EXISTS idx_maquinaria_tipo ON maquinaria(tipo);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_codigo ON mantenimientos(codigo_maquina);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_estado ON mantenimientos(estado_alerta);
CREATE INDEX IF NOT EXISTS idx_soat_vencimiento ON soat(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_citv_vencimiento ON citv(fecha_vencimiento);

-- =====================================================
-- ¡LISTO! Las tablas han sido creadas correctamente
-- =====================================================
