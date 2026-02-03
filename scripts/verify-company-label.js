const axios = require('axios');

async function testCompanyLabel() {
    try {
        // 0. Login
        console.log('Logging in as admin...');
        const loginPayload = {
            username: 'alexisb1v1',
            passwordHash: '@l3x1sb1v1'
        };

        const loginRes = await axios.post('http://localhost:3001/api/v1/users/login', loginPayload);
        const token = loginRes.data.token;
        console.log('Login successful.');

        // 1. Create Company with Label
        const uniqueId = Date.now();
        const companyData = {
            companyName: `Test Company ${uniqueId}`,
            label: `TC-${uniqueId}`.substring(0, 10)
        };
        console.log('Creating company...', companyData);

        const createRes = await axios.post('http://localhost:3001/api/v1/companies', companyData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (createRes.status === 201) {
            console.log('Company created. ID:', createRes.data.id);

            // 2. List Companies and Verify Label
            console.log('Listing companies...');
            const listRes = await axios.get('http://localhost:3001/api/v1/companies', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const createdCompany = listRes.data.find(c => c.id === createRes.data.id);
            if (createdCompany) {
                console.log('Found created company:', createdCompany);
                if (createdCompany.label === companyData.label) {
                    console.log('SUCCESS: Label matches.');
                } else {
                    console.error('FAILURE: Label mismatch. Expected', companyData.label, 'got', createdCompany.label);
                }
            } else {
                console.error('FAILURE: Created company not found in list.');
            }

        } else {
            console.error('Failed to create company:', createRes.status);
        }

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testCompanyLabel();
