const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'prestamosbd',
    password: 'p0stgr3s2026',
    port: 5432,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');

        // Check if column exists
        const schemaRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user' AND column_name = 'id_company';
    `);
        console.log('Column Schema for "user".id_company:', schemaRes.rows);

        // Check data
        const res = await client.query('SELECT id, username, id_company FROM "user" LIMIT 5');
        console.log('Users Data:', res.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
