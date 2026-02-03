const axios = require('axios');

async function testUserListFilter() {
    try {
        // 0. Login
        console.log('Logging in as admin...');
        const loginPayload = {
            username: 'alexisb1v1',
            passwordHash: '@l3x1sb1v1'
        };

        const loginRes = await axios.post('http://localhost:3001/api/v1/users/login', loginPayload);
        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // 1. List All Users
        console.log('Fetching all users...');
        const allUsersRes = await axios.get('http://localhost:3001/api/v1/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Total users:', allUsersRes.data.length);
        console.log('First user sample:', JSON.stringify(allUsersRes.data[0], null, 2));

        // 2. Filter by specific Company ID (e.g. 99 from previous test)
        const targetCompanyId = 99;
        console.log(`Filtering users by companyId=${targetCompanyId}...`);
        const filteredRes = await axios.get(`http://localhost:3001/api/v1/users?idCompany=${targetCompanyId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const filteredUsers = filteredRes.data;
        console.log(`Users found for company ${targetCompanyId}:`, filteredUsers.length);

        if (filteredUsers.length > 0) {
            const allMatch = filteredUsers.every(u => String(u.idCompany) === String(targetCompanyId));
            if (allMatch) {
                console.log('SUCCESS: All returned users match the company ID filter.');
                console.log('Sample filtered user:', filteredUsers[0].username, filteredUsers[0].idCompany);
            } else {
                console.error('FAILURE: Some users do not match the company ID filter.');
                filteredUsers.forEach(u => console.log(`User: ${u.username}, Company: ${u.idCompany}`));
            }
        } else {
            console.warn('WARNING: No users found for this company. Ensure test user exists.');
        }

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testUserListFilter();
