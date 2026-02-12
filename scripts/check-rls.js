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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log("Checking if data is accessible without login...");
    const { data, error } = await supabase.from('proyectos').select('count', { count: 'exact', head: true });

    if (error) {
        console.log("RLS Check Failed (Auth required):", error.message);
    } else {
        console.log("RLS Check Passed (Public access): Data accessible");
    }
}

checkRLS();
