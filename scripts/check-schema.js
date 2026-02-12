const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTable(tableName) {
    console.log(`Checking table: ${tableName}...`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        console.error(`Error accessing ${tableName}:`, error.message);
        return;
    }

    if (data.length === 0) {
        console.log(`Table ${tableName} exists but is empty.`);
        // Try to insert a dummy row to check columns? No, dangerous.
        // We can't easily check columns without data or admin API.
        // But if select('*') worked, the table exists.
    } else {
        console.log(`Table ${tableName} has data. Sample keys:`, Object.keys(data[0]));
    }
}

async function run() {
    await checkTable('proyectos');
    await checkTable('gastos');
    await checkTable('incidencias');
    await checkTable('users'); // Just in case
}

run();
