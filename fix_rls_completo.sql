-- =============================================
-- SCRIPT PARA ARREGLAR RLS - PERMITE TODAS LAS OPERACIONES
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- OPCIÓN 1: DESHABILITAR RLS (más simple, menos seguro)
-- Descomentar estas líneas si quieres desactivar RLS completamente
-- =============================================
-- ALTER TABLE maquinaria DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE combustible DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE historial DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE mantenimientos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE soat DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE citv DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE filtros DISABLE ROW LEVEL SECURITY;

-- =============================================
-- OPCIÓN 2: POLÍTICAS PERMISIVAS (recomendado)
-- =============================================

-- COMBUSTIBLE
ALTER TABLE combustible ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "combustible_select" ON combustible;
DROP POLICY IF EXISTS "combustible_insert" ON combustible;
DROP POLICY IF EXISTS "combustible_update" ON combustible;
DROP POLICY IF EXISTS "combustible_delete" ON combustible;
DROP POLICY IF EXISTS "Todos pueden ver combustible" ON combustible;
DROP POLICY IF EXISTS "Todos pueden insertar combustible" ON combustible;
DROP POLICY IF EXISTS "Todos pueden actualizar combustible" ON combustible;
DROP POLICY IF EXISTS "Todos pueden eliminar combustible" ON combustible;

CREATE POLICY "combustible_select" ON combustible FOR SELECT USING (true);
CREATE POLICY "combustible_insert" ON combustible FOR INSERT WITH CHECK (true);
CREATE POLICY "combustible_update" ON combustible FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "combustible_delete" ON combustible FOR DELETE USING (true);

-- HISTORIAL
ALTER TABLE historial ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "historial_select" ON historial;
DROP POLICY IF EXISTS "historial_insert" ON historial;
DROP POLICY IF EXISTS "historial_update" ON historial;
DROP POLICY IF EXISTS "historial_delete" ON historial;
DROP POLICY IF EXISTS "Todos pueden ver historial" ON historial;
DROP POLICY IF EXISTS "Sistema puede insertar historial" ON historial;
DROP POLICY IF EXISTS "Admins pueden ver historial" ON historial;

CREATE POLICY "historial_select" ON historial FOR SELECT USING (true);
CREATE POLICY "historial_insert" ON historial FOR INSERT WITH CHECK (true);
CREATE POLICY "historial_update" ON historial FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "historial_delete" ON historial FOR DELETE USING (true);

-- MAQUINARIA
ALTER TABLE maquinaria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maquinaria_select" ON maquinaria;
DROP POLICY IF EXISTS "maquinaria_insert" ON maquinaria;
DROP POLICY IF EXISTS "maquinaria_update" ON maquinaria;
DROP POLICY IF EXISTS "maquinaria_delete" ON maquinaria;
DROP POLICY IF EXISTS "Todos pueden ver maquinaria" ON maquinaria;
DROP POLICY IF EXISTS "Todos pueden insertar maquinaria" ON maquinaria;
DROP POLICY IF EXISTS "Todos pueden actualizar maquinaria" ON maquinaria;
DROP POLICY IF EXISTS "Todos pueden eliminar maquinaria" ON maquinaria;

CREATE POLICY "maquinaria_select" ON maquinaria FOR SELECT USING (true);
CREATE POLICY "maquinaria_insert" ON maquinaria FOR INSERT WITH CHECK (true);
CREATE POLICY "maquinaria_update" ON maquinaria FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "maquinaria_delete" ON maquinaria FOR DELETE USING (true);

-- PERFILES
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perfiles_select" ON perfiles;
DROP POLICY IF EXISTS "perfiles_insert" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update" ON perfiles;
DROP POLICY IF EXISTS "perfiles_delete" ON perfiles;
DROP POLICY IF EXISTS "Todos pueden ver perfiles" ON perfiles;
DROP POLICY IF EXISTS "Sistema puede insertar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Sistema puede actualizar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Sistema puede eliminar perfiles" ON perfiles;

CREATE POLICY "perfiles_select" ON perfiles FOR SELECT USING (true);
CREATE POLICY "perfiles_insert" ON perfiles FOR INSERT WITH CHECK (true);
CREATE POLICY "perfiles_update" ON perfiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "perfiles_delete" ON perfiles FOR DELETE USING (true);

-- MANTENIMIENTOS
ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mantenimientos_select" ON mantenimientos;
DROP POLICY IF EXISTS "mantenimientos_insert" ON mantenimientos;
DROP POLICY IF EXISTS "mantenimientos_update" ON mantenimientos;
DROP POLICY IF EXISTS "mantenimientos_delete" ON mantenimientos;
DROP POLICY IF EXISTS "Todos pueden ver mantenimientos" ON mantenimientos;
DROP POLICY IF EXISTS "Todos pueden insertar mantenimientos" ON mantenimientos;
DROP POLICY IF EXISTS "Todos pueden actualizar mantenimientos" ON mantenimientos;
DROP POLICY IF EXISTS "Todos pueden eliminar mantenimientos" ON mantenimientos;

CREATE POLICY "mantenimientos_select" ON mantenimientos FOR SELECT USING (true);
CREATE POLICY "mantenimientos_insert" ON mantenimientos FOR INSERT WITH CHECK (true);
CREATE POLICY "mantenimientos_update" ON mantenimientos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "mantenimientos_delete" ON mantenimientos FOR DELETE USING (true);

-- SOAT
ALTER TABLE soat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "soat_select" ON soat;
DROP POLICY IF EXISTS "soat_insert" ON soat;
DROP POLICY IF EXISTS "soat_update" ON soat;
DROP POLICY IF EXISTS "soat_delete" ON soat;
DROP POLICY IF EXISTS "Todos pueden ver soat" ON soat;
DROP POLICY IF EXISTS "Todos pueden insertar soat" ON soat;
DROP POLICY IF EXISTS "Todos pueden actualizar soat" ON soat;
DROP POLICY IF EXISTS "Todos pueden eliminar soat" ON soat;

CREATE POLICY "soat_select" ON soat FOR SELECT USING (true);
CREATE POLICY "soat_insert" ON soat FOR INSERT WITH CHECK (true);
CREATE POLICY "soat_update" ON soat FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "soat_delete" ON soat FOR DELETE USING (true);

-- CITV
ALTER TABLE citv ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "citv_select" ON citv;
DROP POLICY IF EXISTS "citv_insert" ON citv;
DROP POLICY IF EXISTS "citv_update" ON citv;
DROP POLICY IF EXISTS "citv_delete" ON citv;
DROP POLICY IF EXISTS "Todos pueden ver citv" ON citv;
DROP POLICY IF EXISTS "Todos pueden insertar citv" ON citv;
DROP POLICY IF EXISTS "Todos pueden actualizar citv" ON citv;
DROP POLICY IF EXISTS "Todos pueden eliminar citv" ON citv;

CREATE POLICY "citv_select" ON citv FOR SELECT USING (true);
CREATE POLICY "citv_insert" ON citv FOR INSERT WITH CHECK (true);
CREATE POLICY "citv_update" ON citv FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "citv_delete" ON citv FOR DELETE USING (true);

-- FILTROS
ALTER TABLE filtros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "filtros_select" ON filtros;
DROP POLICY IF EXISTS "filtros_insert" ON filtros;
DROP POLICY IF EXISTS "filtros_update" ON filtros;
DROP POLICY IF EXISTS "filtros_delete" ON filtros;
DROP POLICY IF EXISTS "Todos pueden ver filtros" ON filtros;
DROP POLICY IF EXISTS "Todos pueden insertar filtros" ON filtros;
DROP POLICY IF EXISTS "Todos pueden actualizar filtros" ON filtros;
DROP POLICY IF EXISTS "Todos pueden eliminar filtros" ON filtros;

CREATE POLICY "filtros_select" ON filtros FOR SELECT USING (true);
CREATE POLICY "filtros_insert" ON filtros FOR INSERT WITH CHECK (true);
CREATE POLICY "filtros_update" ON filtros FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "filtros_delete" ON filtros FOR DELETE USING (true);

-- =============================================
-- VERIFICAR POLÍTICAS CREADAS
-- =============================================
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
