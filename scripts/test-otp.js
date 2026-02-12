const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
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

console.log('Testing OTP to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOtp() {
    try {
        const email = 'miguelromeroing@gmail.com';
        console.log(`Sending OTP to ${email}...`);

        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: 'http://localhost:3000/auth/callback',
            },
        });

        if (error) {
            console.error('OTP Failed Message:', error.message);
            console.error('OTP Failed UI Status:', error.status);
            console.error('OTP Full Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('OTP Success! Data:', data);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testOtp();
