const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testExpensesColumn() {
    console.log('--- Testing Expenses Column ---');

    // Test Gastos (monto)
    console.log('\nTesting Gastos (monto)...');
    const { data, error } = await supabase
        .from("proyectos")
        .select("id, gastos(monto)")
        .limit(1);

    if (error) {
        console.error('FAIL Gastos (monto):', error.message);
    } else {
        console.log('PASS Gastos (monto)');
        if (data.length > 0 && data[0].gastos.length > 0) {
            console.log('Sample Gasto:', JSON.stringify(data[0].gastos[0], null, 2));
        } else {
            console.log('No expenses found for the first project, trying to find one with expenses...');
            const { data: dataWithExpenses } = await supabase
                .from("proyectos")
                .select("id, gastos(monto)")
                .not("gastos", "is", null)
                .limit(1);

            if (dataWithExpenses && dataWithExpenses.length > 0) {
                console.log('Sample Gasto (from search):', JSON.stringify(dataWithExpenses[0].gastos[0], null, 2));
            }
        }
    }

    // Double check full query again just in case
    console.log('\nTesting Full Query (Final Check)...');
    const { error: errorFull } = await supabase
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

    if (errorFull) console.error('FAIL Full Query:', errorFull.message);
    else console.log('PASS Full Query');

}

testExpensesColumn();
