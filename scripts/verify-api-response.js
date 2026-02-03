const axios = require('axios');

async function testLoansApi() {
    try {
        const response = await axios.get('http://localhost:3001/api/v1/loans');
        const loans = response.data;

        if (loans.length > 0) {
            console.log('First loan sample:', JSON.stringify(loans[0], null, 2));

            const hasCompanyId = loans.some(l => 'companyId' in l);
            console.log('Does response contain companyId?', hasCompanyId);
        } else {
            console.log('No loans returned');
        }
    } catch (error) {
        console.error('Error calling API:', error.message);
    }
}

testLoansApi();
