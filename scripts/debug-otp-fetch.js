const https = require('https');
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
const email = 'miguelromeroing@gmail.com';

// Construct the URL
// Supabase Auth usually lives at /auth/v1/...
// But for self-hosted or custom domains, it might just be /auth/v1
// Let's assume standard structure: <URL>/auth/v1/otp
const url = new URL(`${supabaseUrl}/auth/v1/otp`);

console.log('Fetching:', url.toString());

const postData = JSON.stringify({
    email: email,
    create_user: true,
    data: {},
    gotrue_meta_security: {}
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
    }
};

const req = https.request(url, options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        console.log('BODY START');
        console.log(rawData);
        console.log('BODY END');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
