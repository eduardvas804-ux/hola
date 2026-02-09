-- =============================================
-- ARREGLAR RECURSIÓN INFINITA EN PERFILES
-- =============================================

-- Primero eliminar TODAS las políticas de perfiles
DROP POLICY IF EXISTS "perfiles_select" ON perfiles;
DROP POLICY IF EXISTS "perfiles_insert" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update" ON perfiles;
DROP POLICY IF EXISTS "perfiles_delete" ON perfiles;
DROP POLICY IF EXISTS "Todos pueden ver perfiles" ON perfiles;
DROP POLICY IF EXISTS "Sistema puede insertar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Sistema puede actualizar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Sistema puede eliminar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON perfiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON perfiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON perfiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON perfiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON perfiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON perfiles;

-- Verificar que no queden políticas
SELECT policyname FROM pg_policies WHERE tablename = 'perfiles';

-- Crear políticas SIMPLES sin recursión (no verifican la tabla perfiles)
CREATE POLICY "perfiles_select_all" ON perfiles
    FOR SELECT USING (true);

CREATE POLICY "perfiles_insert_all" ON perfiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "perfiles_update_all" ON perfiles
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "perfiles_delete_all" ON perfiles
    FOR DELETE USING (true);

-- Verificar políticas creadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'perfiles';

-- También arreglar historial por si acaso
DROP POLICY IF EXISTS "historial_select" ON historial;
DROP POLICY IF EXISTS "historial_insert" ON historial;
DROP POLICY IF EXISTS "historial_update" ON historial;
DROP POLICY IF EXISTS "historial_delete" ON historial;

CREATE POLICY "historial_select_all" ON historial FOR SELECT USING (true);
CREATE POLICY "historial_insert_all" ON historial FOR INSERT WITH CHECK (true);
CREATE POLICY "historial_update_all" ON historial FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "historial_delete_all" ON historial FOR DELETE USING (true);

SELECT policyname, cmd FROM pg_policies WHERE tablename = 'historial';
