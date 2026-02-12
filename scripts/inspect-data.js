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

async function inspectTable(tableName) {
    console.log(`\n--- Inspecting ${tableName} ---`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        console.error(`Error reading ${tableName}:`, error.message);
        // Try without selecting specific columns, just count to see if it exists
        const { count, error: countError } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
        if (countError) console.error(`Error counting ${tableName}:`, countError.message);
        else console.log(`Table ${tableName} exists. Count: ${count}`);
    } else if (data.length === 0) {
        console.log(`Table ${tableName} is empty.`);
        // If empty, we can't see columns easily with just SELECT *. 
        // But the error "column ... does not exist" implies the table exists but the column doesn't.
        // We'll try to insert a dummy row to fail and see which columns work? No, that's risky.
        // We'll try to select columns one by one?
    } else {
        console.log(`Sample Row Keys:`, Object.keys(data[0]));
        // console.log(`First Row Data:`, JSON.stringify(data[0], null, 2)); // Commented out to avoid truncation of keys
    }
}

async function run() {
    await inspectTable('cotizaciones');
    await inspectTable('levantamientos');
}

run();
