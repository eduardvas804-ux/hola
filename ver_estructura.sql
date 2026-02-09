-- Ver estructura de las tablas para alertas

-- SOAT
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'soat'
ORDER BY ordinal_position;

-- CITV
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'citv'
ORDER BY ordinal_position;

-- MANTENIMIENTOS
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mantenimientos'
ORDER BY ordinal_position;

-- Ver algunos datos de ejemplo
SELECT * FROM soat LIMIT 3;
SELECT * FROM citv LIMIT 3;
SELECT * FROM mantenimientos LIMIT 3;
