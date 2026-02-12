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

async function listTables() {
    console.log('Listing all tables in public schema...');

    // We can't query information_schema directly with supabase-js easily unless we use rpc or if we have permissions.
    // Standard approach: Try to infer from a known table or just check specific ones.
    // BETTER AUTH: actually, anon key usually can't read information_schema.

    // Plan B: Just try to select from the tables the user mentioned/we expect, plus the ones we saw in the screenshot.
    const tablesToCheck = ['proyectos', 'gastos', 'incidencias', 'n8n_chat_asist_pro', 'user_states', 'Users', 'Projects', 'Gastos', 'Incidencias'];

    for (const table of tablesToCheck) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`[${table}] Error: ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`[${table}] Exists. Row count: ${count}`);
            // If exists, show columns
            const { data } = await supabase.from(table).select('*').limit(1);
            if (data && data.length > 0) {
                console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }
}

listTables();
