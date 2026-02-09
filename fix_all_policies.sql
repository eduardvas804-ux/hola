-- ============================================
-- SCRIPT COMPLETO PARA ARREGLAR POLÍTICAS RLS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLA PERFILES (gestión de usuarios)
-- ============================================
DROP POLICY IF EXISTS "Todos pueden ver perfiles" ON perfiles;
DROP POLICY IF EXISTS "Admins pueden modificar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Sistema puede insertar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden ver su perfil" ON perfiles;
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON perfiles;

-- Permitir ver todos los perfiles (necesario para listar usuarios)
CREATE POLICY "Todos pueden ver perfiles" ON perfiles
    FOR SELECT USING (true);

-- Permitir insertar perfiles (necesario para crear usuarios desde API)
CREATE POLICY "Sistema puede insertar perfiles" ON perfiles
    FOR INSERT WITH CHECK (true);

-- Permitir actualizar perfiles (necesario para editar usuarios)
CREATE POLICY "Sistema puede actualizar perfiles" ON perfiles
    FOR UPDATE USING (true) WITH CHECK (true);

-- Permitir eliminar perfiles
CREATE POLICY "Sistema puede eliminar perfiles" ON perfiles
    FOR DELETE USING (true);

-- ============================================
-- 2. TABLA HISTORIAL (auditoría)
-- ============================================
DROP POLICY IF EXISTS "Todos pueden ver historial" ON historial;
DROP POLICY IF EXISTS "Sistema puede insertar historial" ON historial;
DROP POLICY IF EXISTS "Admins pueden ver historial" ON historial;

-- Permitir ver todo el historial
CREATE POLICY "Todos pueden ver historial" ON historial
    FOR SELECT USING (true);

-- Permitir insertar en historial (registro de cambios)
CREATE POLICY "Sistema puede insertar historial" ON historial
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 3. TABLA MAQUINARIA
-- ============================================
DROP POLICY IF EXISTS "Todos pueden ver maquinaria" ON maquinaria;
DROP POLICY IF EXISTS "Todos pueden modificar maquinaria" ON maquinaria;

CREATE POLICY "Todos pueden ver maquinaria" ON maquinaria
    FOR SELECT USING (true);

CREATE POLICY "Todos pueden insertar maquinaria" ON maquinaria
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar maquinaria" ON maquinaria
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar maquinaria" ON maquinaria
    FOR DELETE USING (true);

-- ============================================
-- 4. TABLA MANTENIMIENTOS
-- ============================================
DROP POLICY IF EXISTS "Todos pueden ver mantenimientos" ON mantenimientos;
DROP POLICY IF EXISTS "Todos pueden modificar mantenimientos" ON mantenimientos;

CREATE POLICY "Todos pueden ver mantenimientos" ON mantenimientos
    FOR SELECT USING (true);

CREATE POLICY "Todos pueden insertar mantenimientos" ON mantenimientos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar mantenimientos" ON mantenimientos
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar mantenimientos" ON mantenimientos
    FOR DELETE USING (true);

-- ============================================
-- 5. TABLA COMBUSTIBLE
-- ============================================
DROP POLICY IF EXISTS "Todos pueden ver combustible" ON combustible;
DROP POLICY IF EXISTS "Todos pueden modificar combustible" ON combustible;

CREATE POLICY "Todos pueden ver combustible" ON combustible
    FOR SELECT USING (true);

CREATE POLICY "Todos pueden insertar combustible" ON combustible
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar combustible" ON combustible
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar combustible" ON combustible
    FOR DELETE USING (true);

-- ============================================
-- 6. TABLA SOAT
-- ============================================
DROP POLICY IF EXISTS "Todos pueden ver soat" ON soat;
DROP POLICY IF EXISTS "Todos pueden modificar soat" ON soat;

CREATE POLICY "Todos pueden ver soat" ON soat
    FOR SELECT USING (true);

CREATE POLICY "Todos pueden insertar soat" ON soat
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar soat" ON soat
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar soat" ON soat
    FOR DELETE USING (true);

-- ============================================
-- 7. TABLA CITV
-- ============================================
DROP POLICY IF EXISTS "Todos pueden ver citv" ON citv;
DROP POLICY IF EXISTS "Todos pueden modificar citv" ON citv;

CREATE POLICY "Todos pueden ver citv" ON citv
    FOR SELECT USING (true);

CREATE POLICY "Todos pueden insertar citv" ON citv
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar citv" ON citv
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar citv" ON citv
    FOR DELETE USING (true);

-- ============================================
-- 8. TABLA FILTROS
-- ============================================
DROP POLICY IF EXISTS "Todos pueden ver filtros" ON filtros;
DROP POLICY IF EXISTS "Todos pueden modificar filtros" ON filtros;

CREATE POLICY "Todos pueden ver filtros" ON filtros
    FOR SELECT USING (true);

CREATE POLICY "Todos pueden insertar filtros" ON filtros
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar filtros" ON filtros
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar filtros" ON filtros
    FOR DELETE USING (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
