-- =====================================================
-- FIX: Remover constraint de foreign key que causa errores
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Eliminar la restricción de foreign key en mantenimientos
ALTER TABLE IF EXISTS mantenimientos 
DROP CONSTRAINT IF EXISTS mantenimientos_codigo_maquina_fkey;

-- Hacer que las columnas NOT NULL permitan vacío para importaciones parciales
ALTER TABLE maquinaria ALTER COLUMN serie DROP NOT NULL;
ALTER TABLE maquinaria ALTER COLUMN tipo DROP NOT NULL;
ALTER TABLE maquinaria ALTER COLUMN modelo DROP NOT NULL;
ALTER TABLE maquinaria ALTER COLUMN marca DROP NOT NULL;
ALTER TABLE maquinaria ALTER COLUMN empresa DROP NOT NULL;

-- El código ya no es UNIQUE para permitir importaciones sin errores
ALTER TABLE maquinaria DROP CONSTRAINT IF EXISTS maquinaria_codigo_key;

-- Mensaje de confirmación
SELECT 'Restricciones eliminadas. Ahora puedes importar datos sin errores.' as mensaje;
