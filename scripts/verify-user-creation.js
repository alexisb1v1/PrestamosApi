const axios = require('axios');
const { Client } = require('pg');

async function testUserCreation() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'prestamosbd',
        password: 'p0stgr3s2026',
        port: 5432,
    });

    const uniqueId = Date.now();
    const userData = {
        username: `user_${uniqueId}`,
        passwordHash: 'password123',
        profile: 'COBRADOR',
        documentType: 'CC',
        documentNumber: `${uniqueId}`,
        firstName: 'Test',
        lastName: 'User',
        birthday: '1990-01-01',
        idCompany: '99', // Test Company ID
    };

    try {
        // 0. Login
        console.log('Logging in as admin...');
        // Using credentials observed in logs: username: alexisb1v1, passwordHash: @l3x1sb1v1
        // Note: If the backend expects 'passwordHash' field in body to be the password, we send the password there.
        const loginPayload = {
            username: 'alexisb1v1',
            passwordHash: '@l3x1sb1v1'
        };

        const loginRes = await axios.post('http://localhost:3001/api/v1/users/login', loginPayload);
        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');


        // 1. Create User via API
        console.log('Creating user via API...', userData.username);
        const response = await axios.post('http://localhost:3001/api/v1/users', userData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 201) {
            console.log('User created successfully. ID:', response.data.userId);

            // 2. Verify in DB
            await client.connect();
            const res = await client.query('SELECT id, username, id_company FROM "user" WHERE username = $1', [userData.username]);

            if (res.rows.length > 0) {
                console.log('DB Record:', res.rows[0]);
                if (res.rows[0].id_company === '99') {
                    console.log('SUCCESS: id_company was saved correctly.');
                } else {
                    console.error('FAILURE: id_company mismatch. Expected 99, got', res.rows[0].id_company);
                }
            } else {
                console.error('FAILURE: User not found in DB.');
            }

        } else {
            console.error('Failed to create user. Status:', response.status);
        }

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        await client.end();
    }
}

testUserCreation();
