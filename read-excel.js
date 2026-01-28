const XLSX = require('xlsx');
const path = require('path');

// Leer el archivo Excel
const filePath = path.join(__dirname, '..', 'CONTROL DE MAQUINARIA.xlsx');
console.log('Leyendo archivo:', filePath);

try {
    const workbook = XLSX.readFile(filePath);

    console.log('\n========================================');
    console.log('HOJAS ENCONTRADAS:', workbook.SheetNames);
    console.log('========================================\n');

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(`\n=== HOJA: ${sheetName} ===`);
        console.log(`Total filas: ${data.length}`);

        // Mostrar las primeras 5 filas
        for (let i = 0; i < Math.min(5, data.length); i++) {
            const row = data[i];
            if (row && row.length > 0) {
                console.log(`\nFila ${i}:`, row.slice(0, 10).map(c => c === undefined ? '(vacío)' : c));
            }
        }
        console.log('\n---');
    });

} catch (error) {
    console.error('Error:', error.message);
}
