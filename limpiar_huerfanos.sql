-- =============================================
-- ENCONTRAR Y LIMPIAR REGISTROS HUÉRFANOS
-- =============================================

-- 1. Ver qué códigos de maquinaria existen actualmente
SELECT codigo FROM maquinaria ORDER BY codigo;

-- 2. Ver SOAT que NO tienen maquinaria correspondiente
SELECT s.codigo, s.tipo, s.fecha_vencimiento
FROM soat s
WHERE NOT EXISTS (
    SELECT 1 FROM maquinaria m WHERE m.codigo = s.codigo
);

-- 3. Ver CITV que NO tienen maquinaria correspondiente
SELECT c.codigo, c.tipo, c.fecha_vencimiento
FROM citv c
WHERE NOT EXISTS (
    SELECT 1 FROM maquinaria m WHERE m.codigo = c.codigo
);

-- 4. Ver MANTENIMIENTOS que NO tienen maquinaria correspondiente
SELECT m.codigo_maquina, m.tipo_mantenimiento
FROM mantenimientos m
WHERE NOT EXISTS (
    SELECT 1 FROM maquinaria maq WHERE maq.codigo = m.codigo_maquina
);

-- =============================================
-- PARA ELIMINAR LOS HUÉRFANOS (descomentar y ejecutar)
-- =============================================

-- DELETE FROM soat WHERE NOT EXISTS (SELECT 1 FROM maquinaria m WHERE m.codigo = soat.codigo);
-- DELETE FROM citv WHERE NOT EXISTS (SELECT 1 FROM maquinaria m WHERE m.codigo = citv.codigo);
-- DELETE FROM mantenimientos WHERE NOT EXISTS (SELECT 1 FROM maquinaria m WHERE m.codigo = mantenimientos.codigo_maquina);
