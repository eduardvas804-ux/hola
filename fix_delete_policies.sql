-- =============================================
-- ARREGLAR POLÍTICAS DE DELETE PARA TODAS LAS TABLAS
-- =============================================

-- MANTENIMIENTOS
DROP POLICY IF EXISTS "mantenimientos_delete" ON mantenimientos;
DROP POLICY IF EXISTS "mantenimientos_delete_all" ON mantenimientos;
CREATE POLICY "mantenimientos_delete_all" ON mantenimientos FOR DELETE USING (true);

-- SOAT
DROP POLICY IF EXISTS "soat_delete" ON soat;
DROP POLICY IF EXISTS "soat_delete_all" ON soat;
CREATE POLICY "soat_delete_all" ON soat FOR DELETE USING (true);

-- CITV
DROP POLICY IF EXISTS "citv_delete" ON citv;
DROP POLICY IF EXISTS "citv_delete_all" ON citv;
CREATE POLICY "citv_delete_all" ON citv FOR DELETE USING (true);

-- HISTORIAL (por si acaso)
DROP POLICY IF EXISTS "historial_delete" ON historial;
DROP POLICY IF EXISTS "historial_delete_all" ON historial;
CREATE POLICY "historial_delete_all" ON historial FOR DELETE USING (true);

-- COMBUSTIBLE
DROP POLICY IF EXISTS "combustible_delete" ON combustible;
DROP POLICY IF EXISTS "combustible_delete_all" ON combustible;
CREATE POLICY "combustible_delete_all" ON combustible FOR DELETE USING (true);

-- MAQUINARIA
DROP POLICY IF EXISTS "maquinaria_delete" ON maquinaria;
DROP POLICY IF EXISTS "maquinaria_delete_all" ON maquinaria;
CREATE POLICY "maquinaria_delete_all" ON maquinaria FOR DELETE USING (true);

-- PERFILES
DROP POLICY IF EXISTS "perfiles_delete" ON perfiles;
DROP POLICY IF EXISTS "perfiles_delete_all" ON perfiles;
CREATE POLICY "perfiles_delete_all" ON perfiles FOR DELETE USING (true);

-- FILTROS
DROP POLICY IF EXISTS "filtros_delete" ON filtros;
DROP POLICY IF EXISTS "filtros_delete_all" ON filtros;
CREATE POLICY "filtros_delete_all" ON filtros FOR DELETE USING (true);

-- Verificar
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND cmd = 'DELETE'
ORDER BY tablename;
