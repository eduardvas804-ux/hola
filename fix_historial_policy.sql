-- Ejecutar en Supabase SQL Editor para arreglar políticas de historial

-- Eliminar política restrictiva
DROP POLICY IF EXISTS "Admins pueden ver historial" ON historial;

-- Crear política que permite a todos ver
CREATE POLICY "Todos pueden ver historial" ON historial
    FOR SELECT USING (true);

-- Verificar que la política de inserción existe
DROP POLICY IF EXISTS "Sistema puede insertar historial" ON historial;
CREATE POLICY "Sistema puede insertar historial" ON historial
    FOR INSERT WITH CHECK (true);
