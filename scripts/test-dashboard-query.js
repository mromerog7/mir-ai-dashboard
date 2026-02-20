const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCorrectColumnQuery() {
    console.log('--- Testing Corrected Query ---');

    // Test Presupuestos (total_final)
    console.log('\nTesting Presupuestos (total_final)...');
    const { error: error1 } = await supabase
        .from("proyectos")
        .select("id, presupuestos(total_final)")
        .limit(1);
    if (error1) console.error('FAIL Presupuestos (total_final):', error1.message);
    else console.log('PASS Presupuestos (total_final)');

    // Test Full Query Corrected
    console.log('\nTesting Full Query (Corrected)...');
    const { data, error: error2 } = await supabase
        .from("proyectos")
        .select(`
        id, 
        nombre, 
        status,
        tareas (estatus),
        presupuestos (total_final),
        gastos (monto)
    `)
        .neq("status", "Completado")
        .limit(5);

    if (error2) console.error('FAIL Full Query:', error2.message);
    else {
        console.log('PASS Full Query');
        if (data.length > 0) {
            console.log('Sample Data Structure:', JSON.stringify(data[0], null, 2));
        }
    }
}

testCorrectColumnQuery();
