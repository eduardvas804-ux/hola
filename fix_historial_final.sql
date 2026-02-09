-- =============================================
-- VERIFICAR Y ARREGLAR TABLA HISTORIAL
-- =============================================

-- 1. Ver qué tablas de historial existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%historial%';

-- 2. Ver estructura de la tabla historial
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'historial'
ORDER BY ordinal_position;

-- 3. Ver cuántos registros hay
SELECT 'historial' as tabla, COUNT(*) as registros FROM historial
UNION ALL
SELECT 'historial_cambios' as tabla, COUNT(*) as registros FROM historial_cambios;

-- 4. Arreglar políticas RLS para historial
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

-- 5. Verificar políticas creadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'historial';

-- 6. Probar SELECT
SELECT * FROM historial ORDER BY created_at DESC LIMIT 5;
