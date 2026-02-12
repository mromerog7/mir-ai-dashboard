import { Client } from 'pg';
import fs from 'fs';

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function runMigration() {
    console.log('Connecting to database...');
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected successfully.');

        const sql = fs.readFileSync('setup_profiles.sql', 'utf8');
        console.log('Reading setup_profiles.sql...');

        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration executed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
