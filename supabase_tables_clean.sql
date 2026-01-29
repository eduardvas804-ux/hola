-- =============================================
-- SCRIPTS SQL PARA SUPABASE (LIMPIO)
-- Sistema de Control de Maquinaria
-- Ejecutar en: Supabase > SQL Editor
-- =============================================

-- 1. TABLA DE PERFILES DE USUARIO
-- =============================================
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'visualizador' CHECK (rol IN ('admin', 'supervisor', 'operador', 'visualizador')),
    estado BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, email, nombre_completo, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'visualizador')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON perfiles;
DROP POLICY IF EXISTS "Admins pueden actualizar perfiles" ON perfiles;

CREATE POLICY "Usuarios pueden ver su propio perfil" ON perfiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins pueden ver todos los perfiles" ON perfiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Admins pueden actualizar perfiles" ON perfiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);


-- 2. TABLA DE MAQUINARIA
-- =============================================
CREATE TABLE IF NOT EXISTS maquinaria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    serie TEXT,
    placa TEXT,
    anio INTEGER,
    horas_actuales NUMERIC DEFAULT 0,
    estado TEXT DEFAULT 'OPERATIVO' CHECK (estado IN ('OPERATIVO', 'EN MANTENIMIENTO', 'INOPERATIVO', 'ALQUILADO')),
    operador TEXT,
    ubicacion TEXT,
    empresa TEXT,
    tramo TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE maquinaria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden ver maquinaria" ON maquinaria;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar maquinaria" ON maquinaria;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar maquinaria" ON maquinaria;
DROP POLICY IF EXISTS "Admins pueden eliminar maquinaria" ON maquinaria;

CREATE POLICY "Todos pueden ver maquinaria" ON maquinaria FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar maquinaria" ON maquinaria FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar maquinaria" ON maquinaria FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins pueden eliminar maquinaria" ON maquinaria FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
);


-- 3. TABLA DE MANTENIMIENTOS
-- =============================================
CREATE TABLE IF NOT EXISTS mantenimientos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_maquina TEXT NOT NULL,
    tipo TEXT,
    modelo TEXT,
    tipo_mantenimiento TEXT,
    mantenimiento_ultimo NUMERIC DEFAULT 0,
    mantenimiento_proximo NUMERIC DEFAULT 0,
    hora_actual NUMERIC DEFAULT 0,
    diferencia_horas NUMERIC DEFAULT 0,
    estado_alerta TEXT DEFAULT 'EN REGLA' CHECK (estado_alerta IN ('VENCIDO', 'URGENTE', 'PROXIMO', 'EN REGLA')),
    operador TEXT,
    tramo TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden ver mantenimientos" ON mantenimientos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar mantenimientos" ON mantenimientos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar mantenimientos" ON mantenimientos;
DROP POLICY IF EXISTS "Admins pueden eliminar mantenimientos" ON mantenimientos;

CREATE POLICY "Todos pueden ver mantenimientos" ON mantenimientos FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar mantenimientos" ON mantenimientos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar mantenimientos" ON mantenimientos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins pueden eliminar mantenimientos" ON mantenimientos FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
);


-- 4. TABLA DE COMBUSTIBLE
-- =============================================
CREATE TABLE IF NOT EXISTS combustible (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA')),
    codigo_maquina TEXT NOT NULL,
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

ALTER TABLE combustible ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden ver combustible" ON combustible;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar combustible" ON combustible;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar combustible" ON combustible;
DROP POLICY IF EXISTS "Admins pueden eliminar combustible" ON combustible;

CREATE POLICY "Todos pueden ver combustible" ON combustible FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar combustible" ON combustible FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar combustible" ON combustible FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins pueden eliminar combustible" ON combustible FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
);


-- 5. TABLA DE SOAT
-- =============================================
CREATE TABLE IF NOT EXISTS soat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT NOT NULL,
    tipo TEXT,
    modelo TEXT,
    placa_serie TEXT,
    empresa TEXT,
    fecha_vencimiento DATE NOT NULL,
    dias_restantes INTEGER,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE soat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden ver soat" ON soat;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar soat" ON soat;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar soat" ON soat;
DROP POLICY IF EXISTS "Admins pueden eliminar soat" ON soat;

CREATE POLICY "Todos pueden ver soat" ON soat FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar soat" ON soat FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar soat" ON soat FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins pueden eliminar soat" ON soat FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
);


-- 6. TABLA DE CITV
-- =============================================
CREATE TABLE IF NOT EXISTS citv (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT NOT NULL,
    tipo TEXT,
    modelo TEXT,
    placa_serie TEXT,
    empresa TEXT,
    fecha_vencimiento DATE NOT NULL,
    dias_restantes INTEGER,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE citv ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden ver citv" ON citv;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar citv" ON citv;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar citv" ON citv;
DROP POLICY IF EXISTS "Admins pueden eliminar citv" ON citv;

CREATE POLICY "Todos pueden ver citv" ON citv FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar citv" ON citv FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar citv" ON citv FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins pueden eliminar citv" ON citv FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
);


-- 7. TABLA DE FILTROS
-- =============================================
CREATE TABLE IF NOT EXISTS filtros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    maquinaria_codigo TEXT NOT NULL,
    maquinaria_descripcion TEXT,
    filtro_separador_1 TEXT,
    cantidad_sep_1 INTEGER DEFAULT 1,
    filtro_separador_2 TEXT,
    cantidad_sep_2 INTEGER DEFAULT 1,
    filtro_combustible_1 TEXT,
    cantidad_comb_1 INTEGER DEFAULT 1,
    filtro_combustible_2 TEXT,
    cantidad_comb_2 INTEGER DEFAULT 1,
    filtro_aceite_motor TEXT,
    cantidad_aceite INTEGER DEFAULT 1,
    filtro_aire_primario TEXT,
    cantidad_aire_prim INTEGER DEFAULT 1,
    filtro_aire_secundario TEXT,
    cantidad_aire_sec INTEGER DEFAULT 1,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE filtros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden ver filtros" ON filtros;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar filtros" ON filtros;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar filtros" ON filtros;
DROP POLICY IF EXISTS "Admins pueden eliminar filtros" ON filtros;

CREATE POLICY "Todos pueden ver filtros" ON filtros FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar filtros" ON filtros FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar filtros" ON filtros FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins pueden eliminar filtros" ON filtros FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
);


-- 8. TABLA DE HISTORIAL (Auditoría)
-- =============================================
CREATE TABLE IF NOT EXISTS historial (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tabla TEXT NOT NULL,
    registro_id TEXT NOT NULL,
    accion TEXT NOT NULL CHECK (accion IN ('CREATE', 'UPDATE', 'DELETE')),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id UUID,
    usuario_email TEXT,
    usuario_nombre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE historial ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins pueden ver historial" ON historial;
DROP POLICY IF EXISTS "Sistema puede insertar historial" ON historial;

CREATE POLICY "Admins pueden ver historial" ON historial FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
);
CREATE POLICY "Sistema puede insertar historial" ON historial FOR INSERT WITH CHECK (true);


-- 9. TABLA DE ALERTAS
-- =============================================
CREATE TABLE IF NOT EXISTS alertas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('mantenimiento', 'soat', 'citv', 'combustible')),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    destinatarios TEXT[] NOT NULL,
    enviado BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden ver alertas" ON alertas;
DROP POLICY IF EXISTS "Sistema puede insertar alertas" ON alertas;
DROP POLICY IF EXISTS "Sistema puede actualizar alertas" ON alertas;

CREATE POLICY "Todos pueden ver alertas" ON alertas FOR SELECT USING (true);
CREATE POLICY "Sistema puede insertar alertas" ON alertas FOR INSERT WITH CHECK (true);
CREATE POLICY "Sistema puede actualizar alertas" ON alertas FOR UPDATE USING (true);


-- 10. TABLA DE VALORIZACIONES
-- =============================================
CREATE TABLE IF NOT EXISTS valorizaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_archivo TEXT NOT NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    periodo TEXT,
    datos JSONB,
    horometros_extraidos JSONB,
    usuario_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE valorizaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden ver valorizaciones" ON valorizaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar valorizaciones" ON valorizaciones;

CREATE POLICY "Todos pueden ver valorizaciones" ON valorizaciones FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar valorizaciones" ON valorizaciones FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- =============================================
-- INDICES PARA MEJOR RENDIMIENTO
-- =============================================
CREATE INDEX IF NOT EXISTS idx_maquinaria_codigo ON maquinaria(codigo);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_codigo ON mantenimientos(codigo_maquina);
CREATE INDEX IF NOT EXISTS idx_combustible_fecha ON combustible(fecha);
CREATE INDEX IF NOT EXISTS idx_combustible_tipo ON combustible(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_combustible_codigo ON combustible(codigo_maquina);
CREATE INDEX IF NOT EXISTS idx_soat_vencimiento ON soat(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_citv_vencimiento ON citv(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_historial_tabla ON historial(tabla);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial(created_at);


-- =============================================
-- FUNCION PARA ACTUALIZAR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_maquinaria_updated_at ON maquinaria;
DROP TRIGGER IF EXISTS update_mantenimientos_updated_at ON mantenimientos;
DROP TRIGGER IF EXISTS update_combustible_updated_at ON combustible;
DROP TRIGGER IF EXISTS update_soat_updated_at ON soat;
DROP TRIGGER IF EXISTS update_citv_updated_at ON citv;
DROP TRIGGER IF EXISTS update_filtros_updated_at ON filtros;

CREATE TRIGGER update_maquinaria_updated_at BEFORE UPDATE ON maquinaria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mantenimientos_updated_at BEFORE UPDATE ON mantenimientos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_combustible_updated_at BEFORE UPDATE ON combustible FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soat_updated_at BEFORE UPDATE ON soat FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_citv_updated_at BEFORE UPDATE ON citv FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_filtros_updated_at BEFORE UPDATE ON filtros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
