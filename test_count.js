const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();
            envVars[key] = val;
        }
    });

    const supabase = createClient(
        envVars.NEXT_PUBLIC_SUPABASE_URL,
        envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    async function test() {
        // Count records
        const { count, error } = await supabase
            .from('maquinaria')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('COUNT:', count);
        }
    }

    test();

} catch (err) {
    console.error(err);
}
